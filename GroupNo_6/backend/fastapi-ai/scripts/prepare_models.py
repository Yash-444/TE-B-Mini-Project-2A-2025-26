#!/usr/bin/env python3
"""
Script to prepare ML models for the fashion recommendation system
"""
import sys
import os
import asyncio
import logging
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.ml_engine import MLEngine
from app.database import SessionLocal
from app.models import FashionItem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def prepare_models():
    """Prepare and save ML models"""
    
    logger.info("🚀 Starting model preparation...")
    
    # Initialize ML engine
    ml_engine = MLEngine()
    
    # Create models directory
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)

    
    # Database session
    db = SessionLocal()
    
    try:
        # Check if we have data
        total_items = db.query(FashionItem).count()
        logger.info(f"Found {total_items} fashion items in database")
        
        if total_items == 0:
            logger.warning("No data found. Please load dataset first using load_fashion_data.py")
            return
        
        # Generate embeddings if needed
        items_without_embeddings = db.query(FashionItem).filter(
            FashionItem.embedding.is_(None)
        ).count()
        
        if items_without_embeddings > 0:
            logger.info(f"Generating embeddings for {items_without_embeddings} items...")
            
            # Process in batches
            batch_size = 100
            offset = 0
            
            while True:
                batch = db.query(FashionItem).filter(
                    FashionItem.embedding.is_(None)
                ).offset(offset).limit(batch_size).all()
                
                if not batch:
                    break
                
                # Prepare texts
                texts = []
                for item in batch:
                    text = f"{item.name} {item.category} {' '.join(item.tags or [])}"
                    texts.append(text)
                
                # Generate embeddings
                embeddings = await ml_engine.generate_embeddings(texts)
                
                # Update items
                for item, embedding in zip(batch, embeddings):
                    item.embedding = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                
                db.commit()
                offset += batch_size
                logger.info(f"Processed {min(offset, items_without_embeddings)} embeddings...")
        
        # Build similarity index
        logger.info("Building similarity index...")
        await ml_engine.build_similarity_index(db)
        
        # Save models to disk
        logger.info("Saving models to disk...")
        await ml_engine.save_models(models_dir)
        
        logger.info(f"✅ Models prepared and saved to {models_dir}")
        
        # Print model info
        model_info = ml_engine.get_embedding_model_info()
        loaded_models = ml_engine.get_loaded_models()
        
        logger.info("📊 Model Summary:")
        logger.info(f"  - Embedding Model: {model_info.get('type', 'Unknown')}")
        logger.info(f"  - Loaded Models: {', '.join(loaded_models)}")
        logger.info(f"  - Total Items: {total_items}")
        logger.info(f"  - Items with Embeddings: {total_items - items_without_embeddings}")
        
    except Exception as e:
        logger.error(f"Error during model preparation: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(prepare_models())
