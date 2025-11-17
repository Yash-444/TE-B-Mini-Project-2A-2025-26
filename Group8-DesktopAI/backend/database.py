# backend/database.py

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import datetime

# --- STEP 3.1: Load environment variables from .env file ---
load_dotenv()

# --- STEP 3.2: Get the database URL from the environment variable ---
DATABASE_URL = os.getenv("DATABASE_URL")

# --- SQLAlchemy Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- ORM Model ---
# This class defines the structure of the 'conversations' table in our database.
class Conversation(Base):
    __tablename__ = "conversations"

    chat_id = Column(String, index=True)
    id = Column(Integer, primary_key=True, index=True)
    user_query = Column(String, nullable=False)
    assistant_response = Column(String, nullable=False)
    intent = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# --- Utility Function ---
def create_db_and_tables():
    # This function will create the table if it doesn't already exist.
    Base.metadata.create_all(bind=engine)