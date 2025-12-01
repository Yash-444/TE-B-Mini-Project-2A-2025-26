import os, sqlite3, sys
from dotenv import load_dotenv

load_dotenv()
path = os.getenv("SQLITE_PATH", "instance/app.db")
os.makedirs(os.path.dirname(path), exist_ok=True)
conn = sqlite3.connect(path)
conn.executescript(open("db/schema.sql","r",encoding="utf-8").read())
conn.commit()
print("Initialized:", path)
