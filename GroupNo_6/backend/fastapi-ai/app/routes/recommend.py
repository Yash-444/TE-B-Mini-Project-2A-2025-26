from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.openai_client import generate_caption
from typing import List, Dict, Any, Optional
import logging

from app.database import get_db
from app.models import FashionItem, QuizResult, Recommendation
from app.services.ml_engine import MLEngine
from app.services.dataset_processor import DatasetProcessor

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
ml_engine = MLEngine()
dataset_processor = DatasetProcessor()

class QuizAnswers(BaseModel):
    style: Optional[str] = None
    color: Optional[str] = None
    aesthetic: Optional[str] = None
    occasion: Optional[str] = None
    season: Optional[str] = None

class RecommendationRequest(BaseModel):
    user_id: str
    gender: str
    quiz_answers: Dict[str, Any]
    limit: int = 12

@router.post("/quiz/recommend")
async def generate_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """Generate AI-powered recommendations based on quiz answers"""
    try:
        logger.info(f"Generating recommendations for user {request.user_id}")
        
        # Store quiz result
        quiz_result = QuizResult(
            user_id=request.user_id,
            gender=request.gender,
            answers=request.quiz_answers,
            is_completed=True
        )
        
        # Extract aesthetic from answers
        aesthetic_profile = extract_aesthetic_profile(request.quiz_answers)
        quiz_result.aesthetic_profile = aesthetic_profile
        
        # Calculate score
        quiz_result.score = calculate_quiz_score(request.quiz_answers)
        
        db.add(quiz_result)
        db.commit()
        db.refresh(quiz_result)
        
        # Generate recommendations using ML engine
        try:
            recommendations = await ml_engine.generate_recommendations(
                user_id=request.user_id,
                gender=request.gender,
                quiz_answers=request.quiz_answers,
                limit=request.limit,
                db=db
            )
        except Exception as ml_error:
            logger.warning(f"ML engine failed, falling back to basic recommendations: {ml_error}")
            recommendations = await fallback_recommendations(
                request.gender, 
                request.quiz_answers, 
                request.limit, 
                db
            )
        
        # Store recommendation record
        recommendation_record = Recommendation(
            user_id=request.user_id,
            items=recommendations,
            score=len(recommendations)
        )
        db.add(recommendation_record)
        db.commit()
        
        return {
            "outfits": recommendations,
            "aesthetic_profile": aesthetic_profile,
            "style_description": f"Personalized recommendations for {aesthetic_profile} aesthetic",
            "total_generated": len(recommendations),
            "quiz_id": str(quiz_result.id)
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

def extract_aesthetic_profile(quiz_answers: Dict[str, Any]) -> str:
    """Extract aesthetic profile from quiz answers"""
    aesthetics = []
    
    for answer in quiz_answers.values():
        if isinstance(answer, dict) and 'aesthetic' in answer:
            aesthetics.append(answer['aesthetic'])
        elif isinstance(answer, str):
            aesthetics.append(answer)
    
    if not aesthetics:
        return "Classic"
    
    # Find most common aesthetic
    from collections import Counter
    aesthetic_counts = Counter(aesthetics)
    return aesthetic_counts.most_common(1)[0][0]

def calculate_quiz_score(quiz_answers: Dict[str, Any]) -> int:
    """Calculate a score based on quiz completeness and consistency"""
    base_score = len(quiz_answers) * 5  # 5 points per answered question
    
    # Bonus for consistency in aesthetic choices
    aesthetics = []
    for answer in quiz_answers.values():
        if isinstance(answer, dict) and 'aesthetic' in answer:
            aesthetics.append(answer['aesthetic'])
    
    if len(set(aesthetics)) <= 2:  # Consistent aesthetic choices
        base_score += 20
    
    return min(base_score, 100)  # Cap at 100

async def fallback_recommendations(
    gender: str, 
    quiz_answers: Dict[str, Any], 
    limit: int, 
    db: Session
) -> List[Dict[str, Any]]:
    """Fallback recommendation logic when ML engine fails"""
    try:
        # Simple filtering based on gender and random selection
        query = db.query(FashionItem)
        
        if gender != 'all':
            query = query.filter(
                (FashionItem.gender == gender) | 
                (FashionItem.gender == 'unisex') |
                (FashionItem.gender.is_(None))
            )
        
        # Get random items
        items = query.order_by(func.random()).limit(limit).all()
        
        return [
            {
                "id": str(item.id),
                "name": item.name,
                "category": item.category,
                "subcategory": item.subcategory,
                "gender": item.gender,
                "base_color": item.base_color,
                "image_url": item.image_url,
                "tags": item.tags or [],
                "price_range": item.price_range,
                "style_score": float(item.style_score) if item.style_score else 0.0
            }
            for item in items
        ]
        
    except Exception as e:
        logger.error(f"Fallback recommendations failed: {e}")
        return []

@router.get("/embeddings/status")
async def get_embeddings_status(db: Session = Depends(get_db)):
    """Get status of embeddings and ML models"""
    try:
        total_items = db.query(FashionItem).count()
        items_with_embeddings = db.query(FashionItem).filter(
            FashionItem.embedding.isnot(None)
        ).count()
        
        return {
            "total_items": total_items,
            "items_with_embeddings": items_with_embeddings,
            "embedding_coverage": items_with_embeddings / total_items if total_items > 0 else 0,
            "ml_engine_status": "ready" if ml_engine.is_ready() else "initializing",
            "models_loaded": ml_engine.get_loaded_models()
        }
    except Exception as e:
        logger.error(f"Error getting embeddings status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get embeddings status")

@router.post("/embeddings/build")
async def build_embeddings(db: Session = Depends(get_db)):
    """Build embeddings for all fashion items"""
    try:
        logger.info("Starting embeddings build process")
        
        # Get all items without embeddings
        items = db.query(FashionItem).filter(
            FashionItem.embedding.is_(None)
        ).all()
        
        if not items:
            return {"message": "All items already have embeddings", "items_processed": 0}
        
        processed_count = 0
        batch_size = 100
        
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            
            # Generate embeddings for batch
            embeddings = await ml_engine.generate_embeddings([
                f"{item.name} {item.category} {' '.join(item.tags or [])}"
                for item in batch
            ])
            
            # Update items with embeddings
            for item, embedding in zip(batch, embeddings):
                item.embedding = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
            
            db.commit()
            processed_count += len(batch)
            logger.info(f"Processed {processed_count}/{len(items)} items")
        
        # Build similarity index
        await ml_engine.build_similarity_index(db)
        
        return {
            "message": "Embeddings built successfully",
            "items_processed": processed_count
        }
        
    except Exception as e:
        logger.error(f"Error building embeddings: {e}")
        raise HTTPException(status_code=500, detail="Failed to build embeddings")

@router.get("/models/status")
async def get_models_status():
    """Get status of ML models"""
    try:
        return {
            "ml_engine_ready": ml_engine.is_ready(),
            "loaded_models": ml_engine.get_loaded_models(),
            "dataset_processor_ready": dataset_processor is not None,
            "embedding_model": ml_engine.get_embedding_model_info()
        }
    except Exception as e:
        logger.error(f"Error getting models status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get models status")
