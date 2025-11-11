#!/usr/bin/env python3
"""
Script to load fashion dataset into database and generate embeddings
"""
import sys
import os
import pandas as pd
import asyncio
import logging
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import FashionItem
from app.services.ml_engine import MLEngine
from app.services.dataset_processor import DatasetProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """Main function to load dataset and generate embeddings"""
    
    # Initialize services
    ml_engine = MLEngine()
    dataset_processor = DatasetProcessor()
    
    # Default CSV path - adjust as needed
    csv_path = os.getenv('DATASET_PATH', 'data/processed/fashion_items.csv')
    
    if not os.path.exists(csv_path):
        logger.error(f"Dataset file not found: {csv_path}")
        sys.exit(1)
    
    logger.info(f"Loading dataset from: {csv_path}")
    
    # Load and clean data
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} rows from CSV")
    
    # Clean the data
    df = dataset_processor.clean_data(df)
    logger.info(f"After cleaning: {len(df)} rows")
    
    # Database session
    db = SessionLocal()
    
    try:
        # Check for existing items
        existing_count = db.query(FashionItem).count()
        logger.info(f"Existing items in database: {existing_count}")
        
        items_added = 0
        items_updated = 0
        batch_size = 100
        
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            batch_items = []
            
            for _, row in batch.iterrows():
                try:
                    # Check if item exists
                    external_id = row.get('id')
                    existing_item = None
                    
                    if external_id:
                        existing_item = db.query(FashionItem).filter(
                            FashionItem.external_id == int(external_id)
                        ).first()
                    
                    # Process tags
                    tags = []
                    if 'tags' in row and pd.notna(row['tags']):
                        tags = [tag.strip() for tag in str(row['tags']).split(',')]
                    
                    # Calculate image hash for duplicate detection
                    image_hash = None
                    if 'imageurl' in row and pd.notna(row['imageurl']):
                        image_hash = await dataset_processor.calculate_image_hash(str(row['imageurl']))
                    
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
                        batch_items.append(new_item)
                        items_added += 1
                        
                except Exception as row_error:
                    logger.warning(f"Error processing row: {row_error}")
                    continue
            
            # Add batch to database
            if batch_items:
                db.add_all(batch_items)
            
            db.commit()
            logger.info(f"Processed batch {i//batch_size + 1}: +{len(batch_items)} items")
        
        logger.info(f"Data loading complete. Added: {items_added}, Updated: {items_updated}")
        
        # Generate embeddings for items without them
        logger.info("Generating embeddings...")
        items_without_embeddings = db.query(FashionItem).filter(
            FashionItem.embedding.is_(None)
        ).limit(1000).all()  # Process in batches
        
        if items_without_embeddings:
            # Prepare texts for embedding
            texts = []
            for item in items_without_embeddings:
                text = f"{item.name} {item.category} {' '.join(item.tags or [])}"
                texts.append(text)
            
            # Generate embeddings
            embeddings = await ml_engine.generate_embeddings(texts)
            
            # Update items with embeddings
            for item, embedding in zip(items_without_embeddings, embeddings):
                item.embedding = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
            
            db.commit()
            logger.info(f"Generated embeddings for {len(items_without_embeddings)} items")
        
        # Build similarity index
        logger.info("Building similarity index...")
        await ml_engine.build_similarity_index(db)
        
        logger.info("✅ Dataset loading and processing complete!")
        
    except Exception as e:
        logger.error(f"Error during data loading: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
