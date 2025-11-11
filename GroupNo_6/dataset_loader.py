import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from pathlib import Path
import os

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'fashion_ai',
    'user': 'ai_user',
    'password': 'ai_password'
}

def safe_str(value, default=''):
    """Safely convert value to string, handling NaN and None"""
    if pd.isna(value) or value is None:
        return default
    return str(value).strip()

def safe_lower(value, default=''):
    """Safely convert to lowercase string"""
    result = safe_str(value, default)
    return result.lower() if result else default

def safe_int(value, default=None):
    """Safely convert to integer"""
    try:
        if pd.isna(value):
            return default
        return int(value)
    except:
        return default

def safe_float(value, default=0.0):
    """Safely convert to float"""
    try:
        if pd.isna(value):
            return default
        return float(value)
    except:
        return default

def determine_price_range(price):
    """Determine price range category"""
    price_val = safe_float(price, 1000)
    if price_val < 500:
        return 'low'
    elif price_val < 1500:
        return 'mid'
    elif price_val < 3000:
        return 'high'
    else:
        return 'premium'

def calculate_style_score(row):
    """Calculate style score based on metadata completeness and popularity"""
    score = 5.0
    
    # Boost for complete metadata
    if safe_str(row.get('baseColour')):
        score += 0.5
    if safe_str(row.get('articleType')):
        score += 0.5
    if safe_str(row.get('season')):
        score += 0.3
    if safe_str(row.get('usage')):
        score += 0.2
    
    # Boost for popular categories
    master_cat = safe_lower(row.get('masterCategory'))
    if master_cat in ['apparel', 'footwear']:
        score += 1.0
    
    # Boost for casual usage
    usage = safe_lower(row.get('usage'))
    if usage in ['casual', 'formal', 'sports']:
        score += 0.5
    
    return min(round(score, 2), 10.0)

def create_tags(row):
    """Create tags array from row data"""
    tags = []
    
    # Add article type as primary tag
    article = safe_lower(row.get('articleType'))
    if article:
        tags.append(article)
    
    # Add sub category
    subcat = safe_lower(row.get('subCategory'))
    if subcat and subcat not in tags:
        tags.append(subcat)
    
    # Add color
    color = safe_lower(row.get('baseColour'))
    if color and color not in ['na', 'unknown', '']:
        tags.append(color)
    
    # Add usage
    usage = safe_lower(row.get('usage'))
    if usage and usage != 'na':
        tags.append(usage)
    
    # Add season
    season = safe_lower(row.get('season'))
    if season and season not in ['', 'na']:
        tags.append(season)
    
    # Remove duplicates and limit to 10
    tags = list(dict.fromkeys(tags))[:10]
    
    return tags if tags else ['fashion']

def normalize_gender(gender):
    """Normalize gender to male/female/unisex"""
    gender_lower = safe_lower(gender, 'unisex')
    
    if gender_lower in ['men', 'boys']:
        return 'male'
    elif gender_lower in ['women', 'girls']:
        return 'female'
    else:
        return 'unisex'

def find_image_file(product_id, images_dir):
    """Try to find the corresponding image file"""
    if not product_id:
        return None
    
    # Try the product_id directly
    img_path = images_dir / f"{product_id}.jpg"
    if img_path.exists():
        return f"{product_id}.jpg"
    
    # Image not found - will use placeholder
    return None

def load_fashion_dataset():
    """Load Kaggle fashion dataset into PostgreSQL"""
    
    # Paths
    csv_path = Path('data/raw/styles.csv')
    images_dir = Path('data/raw/images')
    
    if not csv_path.exists():
        print(f"❌ Error: {csv_path} not found!")
        print("Please download the dataset and place it in data/raw/")
        return
    
    print("📖 Reading dataset...")
    # Read CSV with proper handling
    df = pd.read_csv(
        csv_path,
        on_bad_lines='skip',
        encoding='utf-8',
        dtype={
            'id': str,
            'gender': str,
            'masterCategory': str,
            'subCategory': str,
            'articleType': str,
            'baseColour': str,
            'season': str,
            'year': 'Int64',  # Nullable integer
            'usage': str,
            'productDisplayName': str
        }
    )
    
    print(f"✅ Loaded {len(df)} items from CSV")
    print(f"📊 Columns: {list(df.columns)}")
    
    # Get list of available images
    print(f"\n🖼️  Checking images directory...")
    available_images = set()
    if images_dir.exists():
        available_images = {f.stem for f in images_dir.glob('*.jpg')}
        print(f"Found {len(available_images)} images")
    else:
        print(f"⚠️  Warning: Images directory not found at {images_dir}")
    
    # Connect to database
    print(f"\n🔗 Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Prepare data
    print(f"\n⚙️  Processing {len(df)} items...")
    items_to_insert = []
    errors = 0
    images_found = 0
    images_missing = 0
    
    for idx, row in df.iterrows():
        try:
            # Extract and normalize all fields
            product_id = safe_str(row.get('id'))
            name = safe_str(row.get('productDisplayName'), 'Fashion Item')
            gender = normalize_gender(row.get('gender'))
            master_cat = safe_str(row.get('masterCategory'), 'Fashion')
            category = safe_str(row.get('subCategory'), 'General')
            sub_cat = safe_str(row.get('articleType'), '')
            article = safe_str(row.get('articleType'), '')
            base_color = safe_lower(row.get('baseColour'), 'unknown')
            season = safe_str(row.get('season'))
            year = safe_int(row.get('year'))
            usage = safe_str(row.get('usage'))
            
            # Create tags
            tags = create_tags(row)
            
            # Determine price range
            price_range = determine_price_range(row.get('price', 1000))
            
            # Calculate style score
            style_score = calculate_style_score(row)
            
            # Handle image mapping
            image_filename = None
            if product_id in available_images:
                image_filename = f"{product_id}.jpg"
                images_found += 1
            else:
                images_missing += 1
            
            # Set image URL
            if image_filename:
                image_url = f"http://localhost:3001/images/{image_filename}"
            else:
                # Use placeholder based on category
                placeholders = {
                    'apparel': 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400',
                    'footwear': 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
                    'accessories': 'https://images.pexels.com/photos/1616839/pexels-photo-1616839.jpeg?auto=compress&cs=tinysrgb&w=400',
                }
                image_url = placeholders.get(master_cat.lower(), placeholders['apparel'])
            
            # Prepare tuple for insertion
            item = (
                product_id,      # product_id
                name,            # name
                gender,          # gender
                master_cat,      # master_category
                category,        # category (using subCategory from CSV)
                sub_cat,         # sub_category (using articleType from CSV)
                article,         # article_type
                base_color,      # base_colour
                season,          # season
                year,            # year
                usage,           # usage
                tags,            # tags (array)
                price_range,     # price_range
                style_score,     # style_score
                image_url,       # image_url
                image_filename   # image_filename
            )
            
            items_to_insert.append(item)
            
            # Show progress
            if (idx + 1) % 5000 == 0:
                print(f"  Processed {idx + 1}/{len(df)} items...")
                
        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  ⚠️  Row {idx}: {e}")
            continue
    
    print(f"\n✅ Processed {len(items_to_insert)} items")
    print(f"   Images found: {images_found}")
    print(f"   Images missing: {images_missing}")
    print(f"   Errors: {errors}")
    
    # Insert into database
    print(f"\n💾 Inserting into database...")
    
    insert_query = """
        INSERT INTO fashion_items 
        (product_id, name, gender, master_category, category, sub_category, 
         article_type, base_colour, season, year, usage, tags, 
         price_range, style_score, image_url, image_filename)
        VALUES %s
    """
    
    try:
        # Insert in batches of 1000
        batch_size = 1000
        total_inserted = 0
        
        for i in range(0, len(items_to_insert), batch_size):
            batch = items_to_insert[i:i + batch_size]
            execute_values(cursor, insert_query, batch)
            conn.commit()
            total_inserted += len(batch)
            print(f"  Inserted {total_inserted}/{len(items_to_insert)} items...")
        
        print(f"\n🎉 Successfully inserted {total_inserted} items!")
        
        # Show statistics
        print(f"\n📊 Database Statistics:")
        
        cursor.execute("SELECT COUNT(*) FROM fashion_items")
        total = cursor.fetchone()[0]
        print(f"  Total items: {total}")
        
        cursor.execute("""
            SELECT gender, COUNT(*) as count 
            FROM fashion_items 
            GROUP BY gender 
            ORDER BY count DESC
        """)
        print(f"\n  Gender distribution:")
        for gender, count in cursor.fetchall():
            print(f"    {gender}: {count}")
        
        cursor.execute("""
            SELECT master_category, COUNT(*) as count 
            FROM fashion_items 
            GROUP BY master_category 
            ORDER BY count DESC 
            LIMIT 10
        """)
        print(f"\n  Top categories:")
        for cat, count in cursor.fetchall():
            print(f"    {cat}: {count}")
        
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM fashion_items 
            WHERE image_filename IS NOT NULL
        """)
        with_images = cursor.fetchone()[0]
        print(f"\n  Items with actual images: {with_images}")
        print(f"  Items with placeholders: {total - with_images}")
        
    except Exception as e:
        print(f"❌ Error inserting data: {e}")
        conn.rollback()
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    print("🎨 AI Fashion Dataset Loader (Fixed Version)")
    print("=" * 60)
    
    load_fashion_dataset()
    
    print("\n" + "=" * 60)
    print("✅ Dataset loading complete!")
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test: curl http://localhost:3001/api/recommendations?limit=5")
    print("3. Take the quiz at: http://localhost:5173/quiz")