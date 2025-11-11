import csv
from app.database import SessionLocal
from app.models import FashionItem
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "fastapi-ai"))

def load_fashion_items():
    db = SessionLocal()
    
    with open("/Users/huzaifashaikh/ai-fashion-recommendation/data/processed/fashion_items.csv", "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            item = FashionItem(
                external_id=int(row["id"]),
                name=row["name"],
                category=row["category"],
                subcategory=row.get("subcategory"),
                article_type=row.get("articletype"),
                gender=row.get("gender"),
                base_color=row.get("basecolor"),
                season=row.get("season"),
                usage=row.get("usage"),
                image_url=row.get("imageurl"),
                tags=row["tags"].split(",") if row.get("tags") else [],
                price_range=row.get("pricerange")
            )
            db.add(item)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    load_fashion_items()
    print("Fashion items loaded!")
