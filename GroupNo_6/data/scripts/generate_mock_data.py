import json
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_comprehensive_mock_data():
    """Generate comprehensive mock fashion data"""
    
    # Fashion data structure
    categories = {
        'Topwear': {
            'subcategories': ['Shirts', 'T-Shirts', 'Blouses', 'Sweaters', 'Jackets', 'Hoodies', 'Tank Tops', 'Cardigans', 'Blazers', 'Vests'],
            'colors': ['White', 'Black', 'Blue', 'Grey', 'Navy', 'Red', 'Pink', 'Green', 'Purple', 'Yellow'],
            'brands': ['H&M', 'Zara', 'Uniqlo', 'Gap', 'Forever 21', 'Mango', 'Tommy Hilfiger', 'Calvin Klein']
        },
        'Bottomwear': {
            'subcategories': ['Jeans', 'Trousers', 'Skirts', 'Shorts', 'Leggings', 'Culottes', 'Palazzo', 'Capris'],
            'colors': ['Blue', 'Black', 'White', 'Grey', 'Khaki', 'Brown', 'Navy', 'Maroon'],
            'brands': ['Levi\'s', 'Lee', 'Wrangler', 'Zara', 'H&M', 'Gap', 'American Eagle', 'Hollister']
        },
        'Footwear': {
            'subcategories': ['Sneakers', 'Formal Shoes', 'Sandals', 'Boots', 'Flats', 'Heels', 'Loafers', 'Slip-ons'],
            'colors': ['Black', 'Brown', 'White', 'Tan', 'Navy', 'Grey', 'Red', 'Pink'],
            'brands': ['Nike', 'Adidas', 'Puma', 'Reebok', 'Converse', 'Vans', 'Clarks', 'Dr. Martens']
        },
        'Dress': {
            'subcategories': ['Casual Dress', 'Formal Dress', 'Maxi Dress', 'Mini Dress', 'A-Line Dress', 'Shift Dress', 'Wrap Dress'],
            'colors': ['Black', 'Navy', 'Red', 'Blue', 'Pink', 'Green', 'Purple', 'White', 'Grey'],
            'brands': ['Zara', 'H&M', 'Forever 21', 'Mango', 'ASOS', 'Boohoo', 'Missguided']
        },
        'Accessories': {
            'subcategories': ['Bags', 'Belts', 'Watches', 'Jewelry', 'Sunglasses', 'Scarves', 'Hats', 'Wallets'],
            'colors': ['Black', 'Brown', 'Tan', 'Gold', 'Silver', 'Rose Gold', 'Navy', 'Red'],
            'brands': ['Coach', 'Michael Kors', 'Kate Spade', 'Fossil', 'Casio', 'Ray-Ban', 'Oakley']
        }
    }
    
    genders = ['Men', 'Women', 'Unisex']
    seasons = ['Summer', 'Winter', 'Fall', 'Spring', 'All']
    usage_types = ['Casual', 'Formal', 'Sports', 'Party', 'Work', 'Ethnic', 'Travel', 'Lounge']
    
    # Generate mock items
    fashion_items = []
    item_id = 1
    
    for category, details in categories.items():
        for subcategory in details['subcategories']:
            for color in details['colors'][:8]:  # Limit colors per subcategory
                for brand in details['brands'][:6]:  # Limit brands per subcategory
                    # Generate 2-3 items per combination
                    for variant in range(np.random.randint(2, 4)):
                        
                        # Price based on brand and category
                        base_prices = {
                            'Topwear': (25, 150),
                            'Bottomwear': (30, 200),
                            'Footwear': (40, 300),
                            'Dress': (35, 250),
                            'Accessories': (15, 500)
                        }
                        
                        price_range = base_prices.get(category, (25, 150))
                        price = np.random.uniform(price_range[0], price_range[1])
                        
                        # Determine price category
                        if price < 50:
                            price_cat = 'low'
                        elif price < 150:
                            price_cat = 'mid'
                        else:
                            price_cat = 'high'
                        
                        # Generate style score
                        style_score = np.random.beta(2, 2)  # Beta distribution for realistic scores
                        style_score = round(0.5 + (style_score * 0.5), 2)  # Scale to 0.5-1.0
                        
                        # Generate tags
                        tags = [
                            category.lower(),
                            subcategory.lower(),
                            color.lower(),
                            brand.lower().replace(' ', '').replace('\'', ''),
                            np.random.choice(['trendy', 'classic', 'casual', 'elegant', 'comfortable']),
                            np.random.choice(['versatile', 'statement', 'basic', 'premium', 'everyday'])
                        ]
                        
                        # Remove duplicates
                        tags = list(set([tag for tag in tags if tag]))
                        
                        # Generate image URL
                        img_id = 1000000 + item_id
                        image_url = f"https://images.pexels.com/photos/{img_id}/pexels-photo-{img_id}.jpeg?auto=compress&cs=tinysrgb&w=400"
                        
                        item = {
                            'id': item_id,
                            'external_id': item_id + 1000,
                            'name': f'{brand} {color} {subcategory} {variant + 1}',
                            'category': category,
                            'subcategory': subcategory,
                            'article_type': subcategory,
                            'gender': np.random.choice(genders, p=[0.4, 0.4, 0.2]),  # Weighted selection
                            'base_color': color,
                            'season': np.random.choice(seasons, p=[0.2, 0.2, 0.2, 0.2, 0.2]),
                            'usage': np.random.choice(usage_types, p=[0.3, 0.15, 0.1, 0.1, 0.15, 0.05, 0.1, 0.05]),
                            'image_url': image_url,
                            'tags': tags,
                            'price_range': price_cat,
                            'style_score': style_score,
                            'brand': brand,
                            'price': round(price, 2),
                            'discount': round(np.random.uniform(0, 40), 1),
                            'year': np.random.choice([2021, 2022, 2023, 2024], p=[0.1, 0.2, 0.3, 0.4]),
                            'rating': round(np.random.uniform(3.5, 5.0), 1),
                            'reviews_count': np.random.randint(10, 500)
                        }
                        
                        fashion_items.append(item)
                        item_id += 1
    
    logger.info(f"Generated {len(fashion_items)} mock fashion items")
    return fashion_items

def save_mock_data():
    """Save mock data to files"""
    
    # Generate data
    fashion_items = generate_comprehensive_mock_data()
    
    # Setup paths
    data_dir = Path("data")
    processed_dir = data_dir / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    # Save as JSON
    json_path = processed_dir / "fashion_items.json"
    with open(json_path, 'w') as f:
        json.dump(fashion_items, f, indent=2)
    logger.info(f"Saved JSON to: {json_path}")
    
    # Save as CSV
    csv_path = processed_dir / "fashion_items.csv"
    df = pd.DataFrame(fashion_items)
    df.to_csv(csv_path, index=False)
    logger.info(f"Saved CSV to: {csv_path}")
    
    # Generate metadata
    metadata = {
        'total_items': len(fashion_items),
        'categories': df['category'].unique().tolist(),
        'subcategories': df['subcategory'].unique().tolist(),
        'genders': df['gender'].unique().tolist(),
        'colors': df['base_color'].unique().tolist(),
        'brands': df['brand'].unique().tolist(),
        'seasons': df['season'].unique().tolist(),
        'usage_types': df['usage'].unique().tolist(),
        'price_ranges': df['price_range'].unique().tolist(),
        'generation_date': pd.Timestamp.now().isoformat(),
        'data_source': 'mock_generated',
        'statistics': {
            'avg_price': round(df['price'].mean(), 2),
            'avg_style_score': round(df['style_score'].mean(), 2),
            'price_distribution': df['price_range'].value_counts().to_dict(),
            'category_distribution': df['category'].value_counts().to_dict(),
            'gender_distribution': df['gender'].value_counts().to_dict()
        }
    }
    
    metadata_path = processed_dir / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved metadata to: {metadata_path}")
    
    # Print summary
    print("\n📊 Mock Data Summary:")
    print("=" * 30)
    print(f"Total Items: {len(fashion_items)}")
    print(f"Categories: {len(metadata['categories'])}")
    print(f"Brands: {len(metadata['brands'])}")
    print(f"Colors: {len(metadata['colors'])}")
    print(f"Average Price: ${metadata['statistics']['avg_price']}")
    print(f"Average Style Score: {metadata['statistics']['avg_style_score']}")
    
    return fashion_items

def main():
    """Main function"""
    print("🎭 Mock Fashion Data Generator")
    print("=" * 40)
    
    fashion_items = save_mock_data()
    
    print("\n✅ Mock data generation completed!")
    print("📁 Files saved in: data/processed/")
    print("\nFiles created:")
    print("- fashion_items.json")
    print("- fashion_items.csv") 
    print("- metadata.json")
    
    print(f"\n🎉 Ready to use {len(fashion_items)} fashion items!")

if __name__ == "__main__":
    main()
