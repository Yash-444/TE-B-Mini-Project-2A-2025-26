import logging
import numpy as np
import pickle
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logging.warning("sentence-transformers not available, falling back to TF-IDF")

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logging.warning("faiss not available, using sklearn for similarity search")

logger = logging.getLogger(__name__)

class MLEngine:
    def __init__(self):
        self.embedding_model = None
        self.tfidf_vectorizer = None
        self.kmeans_model = None
        self.similarity_index = None
        self.item_embeddings = None
        self.item_ids = None
        self._ready = False
        
        # Initialize embedding model
        self._initialize_embedding_model()
    
    def _initialize_embedding_model(self):
        """Initialize the embedding model"""
        try:
            if SENTENCE_TRANSFORMERS_AVAILABLE:
                model_name = "all-MiniLM-L6-v2"
                logger.info(f"Loading SentenceTransformer model: {model_name}")
                self.embedding_model = SentenceTransformer(model_name)
                logger.info("SentenceTransformer model loaded successfully")
            else:
                logger.info("Initializing TF-IDF vectorizer as fallback")
                self.tfidf_vectorizer = TfidfVectorizer(
                    max_features=1000,
                    stop_words='english',
                    ngram_range=(1, 2)
                )
        except Exception as e:
            logger.error(f"Error initializing embedding model: {e}")
            self.tfidf_vectorizer = TfidfVectorizer(max_features=500)
    
    async def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts"""
        try:
            if self.embedding_model and SENTENCE_TRANSFORMERS_AVAILABLE:
                # Use SentenceTransformer
                embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
                return embeddings
            else:
                # Fallback to TF-IDF
                if not hasattr(self.tfidf_vectorizer, 'vocabulary_'):
                    # First time - fit the vectorizer
                    self.tfidf_vectorizer.fit(texts)
                
                embeddings = self.tfidf_vectorizer.transform(texts).toarray()
                return embeddings
                
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Return zero embeddings as last resort
            dim = 384 if self.embedding_model else 100
            return np.zeros((len(texts), dim))
    
    async def generate_recommendations(
        self, 
        user_id: str,
        gender: str,
        quiz_answers: Dict[str, Any],
        limit: int = 12,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """Generate personalized recommendations using ML"""
        try:
            from app.models import FashionItem
            
            if not db:
                raise ValueError("Database session required")
            
            # Build query text from quiz answers
            query_parts = []
            aesthetic_tags = []
            
            for answer in quiz_answers.values():
                if isinstance(answer, dict):
                    if 'aesthetic' in answer:
                        aesthetic_tags.append(answer['aesthetic'])
                    if 'text' in answer:
                        query_parts.append(answer['text'])
                elif isinstance(answer, str):
                    query_parts.append(answer)
            
            query_text = " ".join(query_parts + aesthetic_tags)
            
            # Generate query embedding
            query_embedding = await self.generate_embeddings([query_text])
            query_vector = query_embedding[0]
            
            # Get candidate items from database
            query = db.query(FashionItem)
            if gender != 'all':
                query = query.filter(
                    (FashionItem.gender == gender) | 
                    (FashionItem.gender == 'unisex') |
                    (FashionItem.gender.is_(None))
                )
            
            # Filter by aesthetic tags if available
            if aesthetic_tags:
                for tag in aesthetic_tags:
                    query = query.filter(FashionItem.tags.any(tag.lower()))
            
            candidates = query.limit(1000).all()  # Limit for performance
            
            if not candidates:
                # Fallback to basic query
                candidates = db.query(FashionItem).limit(limit * 2).all()
            
            # Calculate similarities
            scored_items = []
            
            for item in candidates:
                try:
                    # Generate item text for embedding
                    item_text = f"{item.name} {item.category} {' '.join(item.tags or [])}"
                    
                    # Use stored embedding if available
                    if item.embedding:
                        item_vector = np.array(item.embedding)
                    else:
                        item_embedding = await self.generate_embeddings([item_text])
                        item_vector = item_embedding[0]
                        
                        # Store embedding for future use
                        item.embedding = item_vector.tolist()
                    
                    # Calculate similarity
                    if len(query_vector) == len(item_vector):
                        similarity = cosine_similarity(
                            query_vector.reshape(1, -1),
                            item_vector.reshape(1, -1)
                        )[0][0]
                    else:
                        similarity = 0.5  # Default similarity
                    
                    # Boost score based on style_score
                    boost = float(item.style_score or 0) / 100
                    final_score = similarity + boost
                    
                    scored_items.append((item, final_score))
                    
                except Exception as item_error:
                    logger.warning(f"Error processing item {item.id}: {item_error}")
                    continue
            
            # Sort by score and return top items
            scored_items.sort(key=lambda x: x[1], reverse=True)
            top_items = scored_items[:limit]
            
            # Convert to response format
            recommendations = []
            for item, score in top_items:
                recommendations.append({
                    "id": str(item.id),
                    "name": item.name,
                    "category": item.category,
                    "subcategory": item.subcategory,
                    "gender": item.gender,
                    "base_color": item.base_color,
                    "image_url": item.image_url,
                    "tags": item.tags or [],
                    "price_range": item.price_range,
                    "style_score": float(item.style_score) if item.style_score else 0,
                    "similarity_score": float(score)
                })
            
            # Commit any embedding updates
            db.commit()
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in generate_recommendations: {e}")
            return []
    
    async def build_similarity_index(self, db: Session):
        """Build FAISS similarity index for fast lookups"""
        try:
            from app.models import FashionItem
            
            # Get all items with embeddings
            items = db.query(FashionItem).filter(
                FashionItem.embedding.isnot(None)
            ).all()
            
            if not items:
                logger.warning("No items with embeddings found")
                return
            
            # Extract embeddings and IDs
            embeddings = []
            item_ids = []
            
            for item in items:
                if item.embedding:
                    embeddings.append(np.array(item.embedding))
                    item_ids.append(str(item.id))
            
            if not embeddings:
                return
            
            embeddings_array = np.vstack(embeddings).astype('float32')
            
            if FAISS_AVAILABLE:
                # Build FAISS index
                dimension = embeddings_array.shape[1]
                self.similarity_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
                faiss.normalize_L2(embeddings_array)  # Normalize for cosine similarity
                self.similarity_index.add(embeddings_array)
                logger.info(f"Built FAISS index with {len(embeddings)} items")
            else:
                # Store for sklearn-based similarity
                self.item_embeddings = embeddings_array
                
            self.item_ids = item_ids
            self._ready = True
            
        except Exception as e:
            logger.error(f"Error building similarity index: {e}")
    
    def cluster_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> int:
        """Cluster user preferences using K-means"""
        try:
            # Simple clustering based on preference vectors
            # This is a placeholder - implement more sophisticated clustering as needed
            pref_vector = self._vectorize_preferences(preferences)
            
            if self.kmeans_model is None:
                # Initialize with default clusters
                self.kmeans_model = KMeans(n_clusters=5, random_state=42)
                # Fit with some default data
                default_data = np.random.random((100, len(pref_vector)))
                self.kmeans_model.fit(default_data)
            
            cluster_id = self.kmeans_model.predict([pref_vector])[0]
            return int(cluster_id)
            
        except Exception as e:
            logger.error(f"Error clustering user preferences: {e}")
            return 0
    
    def _vectorize_preferences(self, preferences: Dict[str, Any]) -> np.ndarray:
        """Convert preferences to vector format"""
        # Simple vectorization - can be made more sophisticated
        features = []
        
        # Gender encoding
        gender_map = {'male': 0, 'female': 1, 'other': 2}
        features.append(gender_map.get(preferences.get('gender', 'other'), 2))
        
        # Style preferences (simplified)
        style_keywords = ['casual', 'formal', 'sporty', 'elegant', 'edgy']
        for keyword in style_keywords:
            has_keyword = any(
                keyword.lower() in str(v).lower() 
                for v in preferences.values() 
                if isinstance(v, str)
            )
            features.append(1 if has_keyword else 0)
        
        return np.array(features, dtype=float)
    
    async def load_models(self, models_dir: Path):
        """Load pre-trained models from directory"""
        try:
            models_dir = Path(models_dir)
            
            # Load TF-IDF vectorizer
            tfidf_path = models_dir / "tfidf_vectorizer.pkl"
            if tfidf_path.exists():
                with open(tfidf_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)
                logger.info("TF-IDF vectorizer loaded")
            
            # Load K-means model
            kmeans_path = models_dir / "kmeans_model.pkl"
            if kmeans_path.exists():
                with open(kmeans_path, 'rb') as f:
                    self.kmeans_model = pickle.load(f)
                logger.info("K-means model loaded")
            
            # Load similarity index
            if FAISS_AVAILABLE:
                index_path = models_dir / "similarity.index"
                if index_path.exists():
                    self.similarity_index = faiss.read_index(str(index_path))
                    logger.info("FAISS index loaded")
            
            # Load item IDs
            ids_path = models_dir / "item_ids.json"
            if ids_path.exists():
                with open(ids_path, 'r') as f:
                    self.item_ids = json.load(f)
                logger.info("Item IDs loaded")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    async def save_models(self, models_dir: Path):
        """Save trained models to directory"""
        try:
            models_dir = Path(models_dir)
            models_dir.mkdir(exist_ok=True)
            
            # Save TF-IDF vectorizer
            if self.tfidf_vectorizer:
                with open(models_dir / "tfidf_vectorizer.pkl", 'wb') as f:
                    pickle.dump(self.tfidf_vectorizer, f)
            
            # Save K-means model
            if self.kmeans_model:
                with open(models_dir / "kmeans_model.pkl", 'wb') as f:
                    pickle.dump(self.kmeans_model, f)
            
            # Save similarity index
            if self.similarity_index and FAISS_AVAILABLE:
                faiss.write_index(self.similarity_index, str(models_dir / "similarity.index"))
            
            # Save item IDs
            if self.item_ids:
                with open(models_dir / "item_ids.json", 'w') as f:
                    json.dump(self.item_ids, f)
                    
            logger.info(f"Models saved to {models_dir}")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def is_ready(self) -> bool:
        """Check if ML engine is ready"""
        return self._ready or (self.embedding_model is not None or self.tfidf_vectorizer is not None)
    
    def get_loaded_models(self) -> List[str]:
        """Get list of loaded models"""
        models = []
        if self.embedding_model:
            models.append("SentenceTransformer")
        if self.tfidf_vectorizer:
            models.append("TF-IDF")
        if self.kmeans_model:
            models.append("K-Means")
        if self.similarity_index:
            models.append("Similarity Index")
        return models
    
    def get_embedding_model_info(self) -> Dict[str, Any]:
        """Get information about the embedding model"""
        if self.embedding_model and SENTENCE_TRANSFORMERS_AVAILABLE:
            return {
                "type": "SentenceTransformer",
                "model_name": "all-MiniLM-L6-v2",
                "dimension": 384
            }
        elif self.tfidf_vectorizer:
            return {
                "type": "TF-IDF",
                "max_features": getattr(self.tfidf_vectorizer, 'max_features', 1000),
                "dimension": len(getattr(self.tfidf_vectorizer, 'vocabulary_', {}))
            }
        else:
            return {"type": "none", "status": "not_initialized"}
