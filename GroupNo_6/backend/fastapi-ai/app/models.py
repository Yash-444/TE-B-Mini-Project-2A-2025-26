from sqlalchemy import Column, String, Integer, Text, DECIMAL, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid

from app.database import Base

class FashionItem(Base):
    __tablename__ = "fashion_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(Integer, unique=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100))
    article_type = Column(String(100))
    gender = Column(String(20))
    base_color = Column(String(50))
    season = Column(String(20))
    usage = Column(String(50))
    image_url = Column(String(500))
    image_hash = Column(String(100))  # For duplicate detection
    tags = Column(ARRAY(Text), default=[])
    price_range = Column(String(20))
    style_score = Column(DECIMAL(5, 2))
    embedding = Column(JSON)  # Store embedding as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    gender = Column(String(10), nullable=False)
    answers = Column(JSON, nullable=False, default={})
    aesthetic_profile = Column(String(50))
    completed_at = Column(DateTime(timezone=True))
    is_completed = Column(Boolean, default=False)
    score = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    items = Column(JSON, nullable=False, default=[])
    score = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    profile_picture = Column(String, nullable=True)
    gender = Column(String, nullable=True)