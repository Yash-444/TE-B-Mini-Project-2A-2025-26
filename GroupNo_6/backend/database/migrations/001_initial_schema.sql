-- Fashion Recommendation Database Schema
-- Migration 001: Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
    date_of_birth DATE,
    profile_picture VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aesthetic_profile VARCHAR(50),
    color_preferences TEXT[],
    style_preferences TEXT[],
    occasion_preferences TEXT[],
    comfort_level VARCHAR(20),
    budget_range VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quiz results
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(10) NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    aesthetic_profile VARCHAR(50),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Fashion items from dataset
CREATE TABLE IF NOT EXISTS fashion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id INTEGER UNIQUE, -- Kaggle dataset ID
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    article_type VARCHAR(100),
    gender VARCHAR(20),
    base_color VARCHAR(50),
    season VARCHAR(20),
    usage VARCHAR(50),
    image_url VARCHAR(500),
    image_hash VARCHAR(100), -- For duplicate detection
    tags TEXT[] DEFAULT '{}',
    price_range VARCHAR(20),
    style_score DECIMAL(5,2),
    embedding JSONB, -- Store embeddings as JSON
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User outfits
CREATE TABLE IF NOT EXISTS user_outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    occasion VARCHAR(100),
    season VARCHAR(50),
    is_liked BOOLEAN DEFAULT FALSE,
    is_saved BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations (store generated recommendations)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User style history
CREATE TABLE IF NOT EXISTS style_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('viewed','liked','disliked','saved','unsaved','created','rated')),
    item_id UUID, -- References fashion_items
    outfit_id UUID REFERENCES user_outfits(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_fashion_items_category ON fashion_items(category);
CREATE INDEX IF NOT EXISTS idx_fashion_items_gender ON fashion_items(gender);
CREATE INDEX IF NOT EXISTS idx_fashion_items_tags ON fashion_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_fashion_items_external_id ON fashion_items(external_id);
CREATE INDEX IF NOT EXISTS idx_user_outfits_user_id ON user_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_outfits_liked ON user_outfits(user_id, is_liked) WHERE is_liked = true;
CREATE INDEX IF NOT EXISTS idx_user_outfits_saved ON user_outfits(user_id, is_saved) WHERE is_saved = true;
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_style_history_user_id ON style_history(user_id);
CREATE INDEX IF NOT EXISTS idx_style_history_action_type ON style_history(action_type);

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER trg_users_updated 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_preferences_updated 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_outfits_updated 
    BEFORE UPDATE ON user_outfits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
