from passlib.hash import pbkdf2_sha256
import sqlite3, json, os
from dotenv import load_dotenv

load_dotenv()
path = os.getenv("SQLITE_PATH","instance/app.db")
conn = sqlite3.connect(path)
conn.row_factory = sqlite3.Row

def _insert_user(email, role, name):
    conn.execute("INSERT INTO users(email,password_hash,role,full_name) VALUES(?,?,?,?)",
                 (email, pbkdf2_sha256.hash("password123"), role, name))

_insert_user("student@ai.com","student","Student One")
_insert_user("teacher@ai.com","teacher","Teacher One")
_insert_user("admin@ai.com","admin","Admin User")

# Simple sample test
conn.execute("""INSERT INTO assignments(classroom_id,title,content_json,time_limit_minutes)
VALUES(0,'Sample Physics Test',?,30)""", (json.dumps({"questions":[
    {"q":"Unit of force?","options":["N","J","Pa","W"],"answer":"N"},
    {"q":"Speed formula?","options":["d/t","t/d","d*t","d^2"],"answer":"d/t"},
    {"q":"g on Earth?","options":["9.8","1.6","3.7","24.8"],"answer":"9.8"},
]}),))
conn.commit()
print("Seeded demo users and test.")
