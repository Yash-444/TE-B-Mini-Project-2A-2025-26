import pandas as pd
import numpy as np
import json
import os
import requests
from pathlib import Path
import logging
from PIL import Image
import cv2
from sklearn.preprocessing import LabelEncoder
import zipfile
import kaggle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FashionDataProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw"
        self.processed_dir = self.data_dir / "processed"
        self.images_dir = self.processed_dir / "images"
        
        # Create directories
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
        self.fashion_data = None
        self.label_encoders = {}
    
    def download_kaggle_dataset(self, dataset_name="paramaggarwal/fashion-product-images-small"):
        """Download fashion dataset from Kaggle"""
        try:
            logger.info(f"Downloading dataset: {dataset_name}")
            
            # Check if Kaggle credentials exist
            if not os.path.exists(os.path.expanduser('~/.kaggle/kaggle.json')):
                logger.error("Kaggle credentials not found. Please setup kaggle API credentials.")
                return False
            
            # Download dataset
            kaggle.api.dataset_download_files(
                dataset_name,
                path=str(self.raw_dir),
                unzip=True
            )
            
            logger.info("Dataset downloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading dataset: {e}")
            return False
    
    def load_dataset(self, csv_file="styles.csv"):
        """Load the fashion dataset from CSV"""
        try:
            csv_path = self.raw_dir / csv_file
            
            if not csv_path.exists():
                logger.warning(f"CSV file not found: {csv_path}")
                return self.create_mock_dataset()
            
            logger.info(f"Loading dataset from {csv_path}")
            self.fashion_data = pd.read_csv(csv_path, error_bad_lines=False)
            
            logger.info(f"Loaded {len(self.fashion_data)} fashion items")
            return self.fashion_data
            
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return self.create_mock_dataset()
    
    def create_mock_dataset(self):
        """Create mock dataset for development"""
        logger.info("Creating mock dataset for development")
        
        # Fashion categories and attributes
        categories = ['Topwear', 'Bottomwear', 'Footwear', 'Dress', 'Accessories', 'Innerwear', 'Loungewear']
        
        subcategories = {
            'Topwear': ['Shirts', 'T-Shirts', 'Blouses', 'Sweaters', 'Jackets', 'Hoodies', 'Tank Tops'],
            'Bottomwear': ['Jeans', 'Trousers', 'Skirts', 'Shorts', 'Leggings', 'Culottes'],
            'Footwear': ['Sneakers', 'Formal Shoes', 'Sandals', 'Boots', 'Flats', 'Heels'],
            'Dress': ['Casual Dress', 'Formal Dress', 'Maxi Dress', 'Mini Dress', 'A-Line Dress'],
            'Accessories': ['Bags', 'Belts', 'Watches', 'Jewelry', 'Sunglasses', 'Scarves'],
            'Innerwear': ['Bras', 'Briefs', 'Camisoles', 'Shapewear'],
            'Loungewear': ['Pajamas', 'Nightgowns', 'Robes', 'Lounge Sets']
        }
        
        colors = ['Black', 'White', 'Navy', 'Grey', 'Brown', 'Red', 'Blue', 'Green', 
                 'Pink', 'Purple', 'Orange', 'Yellow', 'Beige', 'Maroon', 'Teal']
        
        genders = ['Men', 'Women', 'Unisex']
        seasons = ['Summer', 'Winter', 'Fall', 'Spring', 'All']
        usage_types = ['Casual', 'Formal', 'Sports', 'Party', 'Work', 'Ethnic', 'Travel']
        
        # Generate mock data
        mock_data = []
        for i in range(1000):  # Create 1000 mock items
            masterCategory = np.random.choice(categories)
            subCategory = np.random.choice(subcategories[masterCategory])
            articleType = subCategory
            
            # Generate brand names
            brands = ['H&M', 'Zara', 'Nike', 'Adidas', 'Uniqlo', 'Forever 21', 'Mango', 
                     'Levi\'s', 'Gap', 'Tommy Hilfiger', 'Calvin Klein', 'Puma']
            
            item = {
                'id': i + 1,
                'gender': np.random.choice(genders),
                'masterCategory': masterCategory,
                'subCategory': subCategory,
                'articleType': articleType,
                'baseColour': np.random.choice(colors),
                'season': np.random.choice(seasons),
                'year': np.random.choice([2020, 2021, 2022, 2023, 2024]),
                'usage': np.random.choice(usage_types),
                'productDisplayName': f'{brands[i % len(brands)]} {articleType} {i+1}',
                'price': np.random.uniform(20, 200),
                'discount': np.random.uniform(0, 50),
                'brand': brands[i % len(brands)]
            }
            mock_data.append(item)
        
        self.fashion_data = pd.DataFrame(mock_data)
        logger.info(f"Created {len(self.fashion_data)} mock fashion items")
        
        return self.fashion_data
    
    def clean_data(self):
        """Clean and preprocess the dataset"""
        if self.fashion_data is None:
            logger.error("No data loaded. Please load dataset first.")
            return None
        
        logger.info("Cleaning dataset...")
        
        # Remove rows with missing critical information
        initial_count = len(self.fashion_data)
        
        # Fill missing values
        self.fashion_data['gender'].fillna('Unisex', inplace=True)
        self.fashion_data['baseColour'].fillna('Multi', inplace=True)
        self.fashion_data['season'].fillna('All', inplace=True)
        self.fashion_data['usage'].fillna('Casual', inplace=True)
        
        # Clean text fields
        text_columns = ['productDisplayName', 'masterCategory', 'subCategory', 'articleType']
        for col in text_columns:
            if col in self.fashion_data.columns:
                self.fashion_data[col] = self.fashion_data[col].astype(str).str.strip()
        
        # Remove duplicates
        self.fashion_data.drop_duplicates(subset=['productDisplayName'], keep='first', inplace=True)
        
        # Add derived features
        self.fashion_data['price_range'] = pd.cut(
            self.fashion_data['price'] if 'price' in self.fashion_data.columns else np.random.uniform(20, 200, len(self.fashion_data)),
            bins=[0, 50, 150, 500],
            labels=['low', 'mid', 'high']
        )
        
        logger.info(f"Cleaned dataset: {initial_count} -> {len(self.fashion_data)} items")
        return self.fashion_data
    
    def encode_categorical_features(self):
        """Encode categorical features for ML"""
        logger.info("Encoding categorical features...")
        
        categorical_columns = ['gender', 'masterCategory', 'subCategory', 'articleType', 'baseColour', 'season', 'usage']
        
        for col in categorical_columns:
            if col in self.fashion_data.columns:
                le = LabelEncoder()
                self.fashion_data[f'{col}_encoded'] = le.fit_transform(self.fashion_data[col].astype(str))
                self.label_encoders[col] = le
        
        logger.info("Categorical encoding completed")
    
    def generate_image_urls(self):
        """Generate placeholder image URLs"""
        logger.info("Generating image URLs...")
        
        # Use Pexels API or placeholder images
        base_urls = [
            "https://images.pexels.com/photos/{}/pexels-photo-{}.jpeg?auto=compress&cs=tinysrgb&w=400",
            "https://picsum.photos/400/500?random={}",
        ]
        
        image_urls = []
        for i, row in self.fashion_data.iterrows():
            # Generate different image IDs based on category
            img_id = 1000000 + i
            url = base_urls[0].format(img_id, img_id)
            image_urls.append(url)
        
        self.fashion_data['image_url'] = image_urls
        logger.info("Image URLs generated")
    
    def calculate_style_scores(self):
        """Calculate style compatibility scores"""
        logger.info("Calculating style scores...")
        
        # Simple scoring based on multiple factors
        scores = []
        
        for _, row in self.fashion_data.iterrows():
            score = 0.5  # Base score
            
            # Brand premium
            premium_brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo']
            if any(brand in str(row.get('brand', '')) for brand in premium_brands):
                score += 0.2
            
            # Season appropriateness
            if row.get('season') in ['All', 'Spring', 'Summer']:
                score += 0.1
            
            # Usage versatility
            if row.get('usage') in ['Casual', 'Work', 'Formal']:
                score += 0.15
            
            # Add some randomness
            score += np.random.uniform(-0.1, 0.1)
            
            # Ensure score is between 0 and 1
            score = max(0.3, min(1.0, score))
            scores.append(round(score, 2))
        
        self.fashion_data['style_score'] = scores
        logger.info("Style scores calculated")
    
    def add_tags(self):
        """Add searchable tags to items"""
        logger.info("Adding tags...")
        
        tags_list = []
        
        for _, row in self.fashion_data.iterrows():
            tags = []
            
            # Add category-based tags
            tags.extend([
                str(row.get('masterCategory', '')).lower(),
                str(row.get('subCategory', '')).lower(),
                str(row.get('articleType', '')).lower()
            ])
            
            # Add color tags
            color = str(row.get('baseColour', '')).lower()
            if color:
                tags.append(color)
                # Add color family tags
                color_families = {
                    'black': ['dark', 'neutral'],
                    'white': ['light', 'neutral'],
                    'grey': ['neutral'],
                    'navy': ['blue', 'dark'],
                    'red': ['bright', 'warm'],
                    'blue': ['cool'],
                    'green': ['cool'],
                    'pink': ['warm', 'feminine'],
                    'purple': ['cool'],
                }
                if color in color_families:
                    tags.extend(color_families[color])
            
            # Add usage tags
            usage = str(row.get('usage', '')).lower()
            if usage:
                tags.append(usage)
            
            # Add seasonal tags
            season = str(row.get('season', '')).lower()
            if season:
                tags.append(season)
            
            # Remove duplicates and empty tags
            tags = list(set([tag for tag in tags if tag and tag != 'nan']))
            tags_list.append(tags)
        
        self.fashion_data['tags'] = tags_list
        logger.info("Tags added successfully")
    
    def save_processed_data(self):
        """Save processed data to JSON and CSV"""
        logger.info("Saving processed data...")
        
        try:
            # Convert DataFrame to list of dictionaries
            fashion_items = []
            
            for _, row in self.fashion_data.iterrows():
                item = {
                    'id': int(row.get('id', 0)),
                    'external_id': int(row.get('id', 0)),
                    'name': str(row.get('productDisplayName', f'Fashion Item {row.get("id", 0)}')),
                    'category': str(row.get('masterCategory', 'Apparel')),
                    'subcategory': str(row.get('subCategory', 'General')),
                    'article_type': str(row.get('articleType', 'Item')),
                    'gender': str(row.get('gender', 'Unisex')),
                    'base_color': str(row.get('baseColour', 'Multi')),
                    'season': str(row.get('season', 'All')),
                    'usage': str(row.get('usage', 'Casual')),
                    'image_url': str(row.get('image_url', '')),
                    'tags': row.get('tags', []),
                    'price_range': str(row.get('price_range', 'mid')),
                    'style_score': float(row.get('style_score', 0.7)),
                    'brand': str(row.get('brand', 'Fashion Brand')),
                    'price': float(row.get('price', 75.0)),
                    'year': int(row.get('year', 2024))
                }
                fashion_items.append(item)
            
            # Save as JSON
            json_path = self.processed_dir / "fashion_items.json"
            with open(json_path, 'w') as f:
                json.dump(fashion_items, f, indent=2)
            logger.info(f"Saved {len(fashion_items)} items to {json_path}")
            
            # Save as CSV
            csv_path = self.processed_dir / "fashion_items.csv"
            processed_df = pd.DataFrame(fashion_items)
            processed_df.to_csv(csv_path, index=False)
            logger.info(f"Saved processed data to {csv_path}")
            
            # Save metadata
            metadata = {
                'total_items': len(fashion_items),
                'categories': processed_df['category'].unique().tolist(),
                'genders': processed_df['gender'].unique().tolist(),
                'colors': processed_df['base_color'].unique().tolist(),
                'brands': processed_df['brand'].unique().tolist(),
                'processing_date': pd.Timestamp.now().isoformat(),
                'label_encoders': {k: v.classes_.tolist() for k, v in self.label_encoders.items()}
            }
            
            metadata_path = self.processed_dir / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            logger.info(f"Saved metadata to {metadata_path}")
            
            return fashion_items
            
        except Exception as e:
            logger.error(f"Error saving processed data: {e}")
            return None
    
    def process_all(self):
        """Run the complete data processing pipeline"""
        logger.info("Starting complete data processing pipeline...")
        
        try:
            # Step 1: Load dataset
            if self.load_dataset() is None:
                logger.error("Failed to load dataset")
                return False
            
            # Step 2: Clean data
            if self.clean_data() is None:
                logger.error("Failed to clean data")
                return False
            
            # Step 3: Encode categorical features
            self.encode_categorical_features()
            
            # Step 4: Generate image URLs
            self.generate_image_urls()
            
            # Step 5: Calculate style scores
            self.calculate_style_scores()
            
            # Step 6: Add tags
            self.add_tags()
            
            # Step 7: Save processed data
            processed_items = self.save_processed_data()
            
            if processed_items:
                logger.info(f"✅ Data processing completed successfully! Processed {len(processed_items)} items")
                return True
            else:
                logger.error("❌ Failed to save processed data")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error in processing pipeline: {e}")
            return False

def main():
    """Main function to run the data processing"""
    print("🎨 Fashion AI Data Processor")
    print("=" * 40)
    
    # Initialize processor
    processor = FashionDataProcessor()
    
    # Check if user wants to download from Kaggle
    download_choice = input("Download dataset from Kaggle? (y/n): ").lower().strip()
    
    if download_choice == 'y':
        print("\n📥 Downloading dataset from Kaggle...")
        success = processor.download_kaggle_dataset()
        if not success:
            print("⚠️ Failed to download from Kaggle. Will use mock data.")
    
    # Process the data
    print("\n🔄 Processing data...")
    success = processor.process_all()
    
    if success:
        print("\n🎉 Data processing completed successfully!")
        print(f"📁 Processed files saved in: {processor.processed_dir}")
        print("\nFiles created:")
        print("- fashion_items.json (for FastAPI)")
        print("- fashion_items.csv (for analysis)")
        print("- metadata.json (dataset info)")
    else:
        print("\n❌ Data processing failed. Check logs for details.")

if __name__ == "__main__":
    main()
