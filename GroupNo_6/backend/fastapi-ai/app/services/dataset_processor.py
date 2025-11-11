import pandas as pd
import numpy as np
import logging
import hashlib
import requests
from io import BytesIO
from typing import Optional
import imagehash
from PIL import Image

logger = logging.getLogger(__name__)

class DatasetProcessor:
    def __init__(self):
        self.image_hashes = set()
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and preprocess the fashion dataset"""
        try:
            logger.info(f"Cleaning dataset with {len(df)} rows")
            
            # Make a copy to avoid modifying the original
            df = df.copy()
            
            # Fill missing values
            df = df.fillna('')
            
            # Clean string columns
            string_columns = ['name', 'category', 'subcategory', 'articletype', 
                            'gender', 'basecolor', 'season', 'usage', 'tags']
            
            for col in string_columns:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.strip()
                    # Convert to lowercase for consistency
                    df[col] = df[col].str.lower()
            
            # Clean numeric columns
            if 'stylescore' in df.columns:
                df['stylescore'] = pd.to_numeric(df['stylescore'], errors='coerce')
                df['stylescore'] = df['stylescore'].fillna(0)
            
            # Clean image URLs
            if 'imageurl' in df.columns:
                df['imageurl'] = df['imageurl'].astype(str)
                # Remove rows with invalid URLs
                df = df[df['imageurl'].str.startswith(('http://', 'https://'))]
            
            # Process tags column
            if 'tags' in df.columns:
                df['tags'] = df['tags'].apply(self._process_tags)
            
            # Remove duplicates based on name and category
            if 'name' in df.columns and 'category' in df.columns:
                df = df.drop_duplicates(subset=['name', 'category'], keep='first')
            
            # Filter out items with empty names
            if 'name' in df.columns:
                df = df[df['name'].str.len() > 0]
            
            logger.info(f"Dataset cleaned, {len(df)} rows remaining")
            return df
            
        except Exception as e:
            logger.error(f"Error cleaning dataset: {e}")
            return df
    
    def _process_tags(self, tags_str: str) -> str:
        """Process tags string to clean and standardize"""
        try:
            if pd.isna(tags_str) or tags_str == '':
                return ''
            
            # Split by comma and clean
            tags = [tag.strip().lower() for tag in str(tags_str).split(',')]
            tags = [tag for tag in tags if tag]  # Remove empty tags
            
            # Remove duplicates while preserving order
            unique_tags = []
            for tag in tags:
                if tag not in unique_tags:
                    unique_tags.append(tag)
            
            return ', '.join(unique_tags)
            
        except Exception as e:
            logger.warning(f"Error processing tags '{tags_str}': {e}")
            return str(tags_str)
    
    async def calculate_image_hash(self, image_url: str) -> Optional[str]:
        """Calculate perceptual hash of image for duplicate detection"""
        try:
            if not image_url or not image_url.startswith(('http://', 'https://')):
                return None
            
            # Download image with timeout
            response = requests.get(image_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; FashionBot/1.0)'
            })
            response.raise_for_status()
            
            # Open image and calculate hash
            image = Image.open(BytesIO(response.content))
            
            # Calculate perceptual hash
            phash = imagehash.phash(image)
            hash_str = str(phash)
            
            # Check for duplicates
            if hash_str in self.image_hashes:
                logger.info(f"Duplicate image detected: {image_url}")
                return None
            
            self.image_hashes.add(hash_str)
            return hash_str
            
        except Exception as e:
            logger.warning(f"Error calculating image hash for {image_url}: {e}")
            return None
    
    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract additional features from the dataset"""
        try:
            df = df.copy()
            
            # Extract color features
            if 'basecolor' in df.columns:
                df['color_category'] = df['basecolor'].apply(self._categorize_color)
            
            # Extract style features from tags
            if 'tags' in df.columns:
                df['style_features'] = df['tags'].apply(self._extract_style_features)
            
            # Calculate item popularity score (placeholder)
            df['popularity_score'] = np.random.uniform(0, 1, len(df))
            
            # Extract price category
            if 'pricerange' in df.columns:
                df['price_category'] = df['pricerange'].apply(self._categorize_price)
            
            return df
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return df
    
    def _categorize_color(self, color: str) -> str:
        """Categorize colors into broader categories"""
        color = str(color).lower()
        
        warm_colors = ['red', 'orange', 'yellow', 'pink', 'coral']
        cool_colors = ['blue', 'green', 'purple', 'turquoise', 'cyan']
        neutral_colors = ['black', 'white', 'grey', 'gray', 'beige', 'brown', 'tan']
        
        for warm in warm_colors:
            if warm in color:
                return 'warm'
        
        for cool in cool_colors:
            if cool in color:
                return 'cool'
        
        for neutral in neutral_colors:
            if neutral in color:
                return 'neutral'
        
        return 'other'
    
    def _extract_style_features(self, tags: str) -> dict:
        """Extract style-related features from tags"""
        try:
            if pd.isna(tags):
                return {}
            
            tags_list = [tag.strip().lower() for tag in str(tags).split(',')]
            
            features = {
                'formal': any(keyword in ' '.join(tags_list) for keyword in ['formal', 'business', 'suit', 'dress']),
                'casual': any(keyword in ' '.join(tags_list) for keyword in ['casual', 'everyday', 'comfort']),
                'sporty': any(keyword in ' '.join(tags_list) for keyword in ['sport', 'athletic', 'gym', 'active']),
                'elegant': any(keyword in ' '.join(tags_list) for keyword in ['elegant', 'sophisticated', 'luxury']),
                'trendy': any(keyword in ' '.join(tags_list) for keyword in ['trendy', 'fashion', 'style', 'modern'])
            }
            
            return features
            
        except Exception as e:
            logger.warning(f"Error extracting style features from '{tags}': {e}")
            return {}
    
    def _categorize_price(self, price_range: str) -> str:
        """Categorize price ranges"""
        price_str = str(price_range).lower()
        
        if 'low' in price_str or 'budget' in price_str:
            return 'budget'
        elif 'high' in price_str or 'premium' in price_str:
            return 'premium'
        elif 'mid' in price_str or 'medium' in price_str:
            return 'mid-range'
        else:
            return 'unknown'
    
    def get_recommendations(self, user_preferences: dict, limit: int = 20) -> list:
        """Get basic recommendations (fallback method)"""
        try:
            # This is a placeholder implementation
            # In practice, this would query the database or use ML models
            
            mock_recommendations = []
            for i in range(limit):
                mock_recommendations.append({
                    'id': f'item_{i}',
                    'name': f'Fashion Item {i}',
                    'category': 'clothing',
                    'score': np.random.uniform(0.5, 1.0)
                })
            
            return mock_recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
