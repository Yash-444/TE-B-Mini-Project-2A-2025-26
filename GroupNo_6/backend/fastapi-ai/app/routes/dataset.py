from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import logging
import io
import os
from pathlib import Path

from app.database import get_db
from app.models import FashionItem
from app.services.dataset_processor import DatasetProcessor
from app.services.ml_engine import MLEngine

logger = logging.getLogger(__name__)
router = APIRouter()

dataset_processor = DatasetProcessor()
ml_engine = MLEngine()

@router.post("/dataset/load")
async def load_dataset(
    file: UploadFile = File(None),
    csv_path: str = None,
    db: Session = Depends(get_db)
):
    """Load fashion dataset from CSV file"""
    try:
        logger.info("Starting dataset load process")
        
        # Determine data source
        if file:
            # Load from uploaded file
            contents = await file.read()
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            source = f"uploaded file: {file.filename}"
        elif csv_path and os.path.exists(csv_path):
            # Load from file path
            df = pd.read_csv(csv_path)
            source = f"file: {csv_path}"
        else:
            # Try default path
            default_path = "data/processed/fashion_items.csv"
            if os.path.exists(default_path):
                df = pd.read_csv(default_path)
                source = f"default file: {default_path}"
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="No data source provided. Upload a file or specify csv_path"
                )
        
        logger.info(f"Loading dataset from {source}, {len(df)} rows")
        
        # Process and clean data
        df = dataset_processor.clean_data(df)
        
        # Check for existing items to avoid duplicates
        existing_external_ids = set()
        if 'id' in df.columns:
            existing_result = db.query(FashionItem.external_id).filter(
                FashionItem.external_id.in_(df['id'].tolist())
            ).all()
            existing_external_ids = {row[0] for row in existing_result}
        
        items_added = 0
        items_updated = 0
        batch_size = 1000
        
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            
            for _, row in batch.iterrows():
                try:
                    # Check if item exists
                    external_id = row.get('id')
                    existing_item = None
                    
                    if external_id and external_id in existing_external_ids:
                        existing_item = db.query(FashionItem).filter(
                            FashionItem.external_id == external_id
                        ).first()
                    
                    # Process tags
                    tags = []
                    if 'tags' in row and pd.notna(row['tags']):
                        tags = [tag.strip() for tag in str(row['tags']).split(',')]
                    
                    # Calculate image hash for duplicate detection
                    image_hash = None
                    if 'imageurl' in row and pd.notna(row['imageurl']):
                        image_hash = await dataset_processor.calculate_image_hash(row['imageurl'])
                    
                    item_data = {
                        'name': str(row.get('name', '')),
                        'category': str(row.get('category', '')),
                        'subcategory': str(row.get('subcategory', '')),
                        'article_type': str(row.get('articletype', '')),
                        'gender': str(row.get('gender', '')),
                        'base_color': str(row.get('basecolor', '')),
                        'season': str(row.get('season', '')),
                        'usage': str(row.get('usage', '')),
                        'image_url': str(row.get('imageurl', '')),
                        'image_hash': image_hash,
                        'tags': tags,
                        'price_range': str(row.get('pricerange', '')),
                        'style_score': float(row.get('stylescore', 0)) if pd.notna(row.get('stylescore')) else None
                    }
                    
                    if existing_item:
                        # Update existing item
                        for key, value in item_data.items():
                            setattr(existing_item, key, value)
                        items_updated += 1
                    else:
                        # Create new item
                        if external_id:
                            item_data['external_id'] = int(external_id)
                        
                        new_item = FashionItem(**item_data)
                        db.add(new_item)
                        items_added += 1
                        
                except Exception as row_error:
                    logger.warning(f"Error processing row {i}: {row_error}")
                    continue
            
            db.commit()
            logger.info(f"Processed batch {i//batch_size + 1}, total: {i + len(batch)}")
        
        # Generate embeddings for new items
        if items_added > 0:
            logger.info("Generating embeddings for new items...")
            new_items = db.query(FashionItem).filter(
                FashionItem.embedding.is_(None)
            ).limit(items_added).all()
            
            if new_items:
                embeddings = await ml_engine.generate_embeddings([
                    f"{item.name} {item.category} {' '.join(item.tags or [])}"
                    for item in new_items
                ])
                
                for item, embedding in zip(new_items, embeddings):
                    item.embedding = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                
                db.commit()
        
        return {
            "message": "Dataset loaded successfully",
            "source": source,
            "total_rows": len(df),
            "items_added": items_added,
            "items_updated": items_updated,
            "embeddings_generated": items_added
        }
        
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load dataset: {str(e)}")

@router.get("/dataset/stats")
async def get_dataset_stats(db: Session = Depends(get_db)):
    """Get dataset statistics"""
    try:
        stats = {}
        
        # Total items
        stats['total_items'] = db.query(FashionItem).count()
        
        # Items by category
        category_stats = db.query(
            FashionItem.category,
            func.count(FashionItem.id).label('count')
        ).group_by(FashionItem.category).all()
        stats['by_category'] = {cat: count for cat, count in category_stats}
        
        # Items by gender
        gender_stats = db.query(
            FashionItem.gender,
            func.count(FashionItem.id).label('count')
        ).group_by(FashionItem.gender).all()
        stats['by_gender'] = {gender: count for gender, count in gender_stats}
        
        # Items with images
        stats['items_with_images'] = db.query(FashionItem).filter(
            FashionItem.image_url.isnot(None),
            FashionItem.image_url != ''
        ).count()
        
        # Items with embeddings
        stats['items_with_embeddings'] = db.query(FashionItem).filter(
            FashionItem.embedding.isnot(None)
        ).count()
        
        # Price range distribution
        price_stats = db.query(
            FashionItem.price_range,
            func.count(FashionItem.id).label('count')
        ).group_by(FashionItem.price_range).all()
        stats['by_price_range'] = {price: count for price, count in price_stats if price}
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting dataset stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dataset stats")

@router.delete("/dataset/clear")
async def clear_dataset(db: Session = Depends(get_db)):
    """Clear all dataset items (use with caution)"""
    try:
        count = db.query(FashionItem).count()
        db.query(FashionItem).delete()
        db.commit()
        
        return {
            "message": "Dataset cleared successfully",
            "items_deleted": count
        }
        
    except Exception as e:
        logger.error(f"Error clearing dataset: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear dataset")
