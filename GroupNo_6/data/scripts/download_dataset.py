import os
import kaggle
import zipfile
from pathlib import Path
import logging
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatasetDownloader:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
    
    def setup_kaggle_credentials(self):
        """Setup Kaggle API credentials"""
        kaggle_dir = Path.home() / ".kaggle"
        kaggle_json = kaggle_dir / "kaggle.json"
        
        if not kaggle_json.exists():
            print("\n🔑 Kaggle API Setup Required")
            print("=" * 40)
            print("1. Go to https://www.kaggle.com/account")
            print("2. Click 'Create API Token'")
            print("3. Download kaggle.json")
            print("4. Place it in ~/.kaggle/kaggle.json")
            print("5. Run: chmod 600 ~/.kaggle/kaggle.json")
            print("\nOr provide credentials manually:")
            
            username = input("Kaggle Username: ").strip()
            key = input("Kaggle API Key: ").strip()
            
            if username and key:
                kaggle_dir.mkdir(exist_ok=True)
                credentials = {"username": username, "key": key}
                
                import json
                with open(kaggle_json, 'w') as f:
                    json.dump(credentials, f)
                
                os.chmod(kaggle_json, 0o600)
                logger.info("Kaggle credentials saved successfully")
                return True
            else:
                logger.error("No credentials provided")
                return False
        else:
            logger.info("Kaggle credentials found")
            return True
    
    def download_fashion_dataset(self):
        """Download the main fashion dataset"""
        try:
            dataset_name = "paramaggarwal/fashion-product-images-small"
            logger.info(f"Downloading dataset: {dataset_name}")
            
            kaggle.api.dataset_download_files(
                dataset_name,
                path=str(self.raw_dir),
                unzip=True
            )
            
            logger.info("✅ Fashion dataset downloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error downloading dataset: {e}")
            return False
    
    def download_sample_images(self):
        """Download sample fashion images"""
        try:
            logger.info("Downloading sample fashion images...")
            
            # Fashion image URLs from Pexels
            sample_images = [
                "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&w=400",
                "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
            ]
            
            images_dir = self.raw_dir / "sample_images"
            images_dir.mkdir(exist_ok=True)
            
            for i, url in enumerate(sample_images):
                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        filename = f"sample_{i+1}.jpg"
                        filepath = images_dir / filename
                        
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        
                        logger.info(f"Downloaded: {filename}")
                    else:
                        logger.warning(f"Failed to download image from: {url}")
                        
                except Exception as e:
                    logger.warning(f"Error downloading image {i+1}: {e}")
            
            logger.info("✅ Sample images downloaded")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error downloading sample images: {e}")
            return False
    
    def download_all(self):
        """Download all datasets"""
        logger.info("🚀 Starting dataset download process...")
        
        # Setup Kaggle credentials
        if not self.setup_kaggle_credentials():
            logger.error("Failed to setup Kaggle credentials")
            return False
        
        # Download main dataset
        fashion_success = self.download_fashion_dataset()
        
        # Download sample images (always try this)
        images_success = self.download_sample_images()
        
        if fashion_success:
            logger.info("🎉 All downloads completed successfully!")
        elif images_success:
            logger.info("⚠️ Main dataset failed, but sample images downloaded")
        else:
            logger.error("❌ All downloads failed")
            return False
        
        return True

def main():
    """Main function"""
    print("📥 Fashion AI Dataset Downloader")
    print("=" * 40)
    
    downloader = DatasetDownloader()
    success = downloader.download_all()
    
    if success:
        print("\n✅ Dataset download completed!")
        print("📁 Files saved in: data/raw/")
        print("\nNext steps:")
        print("1. Run: python data/scripts/preprocess.py")
        print("2. Start the application: ./setup.sh")
    else:
        print("\n❌ Dataset download failed")
        print("The application will use mock data instead")

if __name__ == "__main__":
    main()
