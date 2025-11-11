-- Demo seed data for fashion recommendation system

-- Insert demo users (passwords are hashed version of 'password123')
INSERT INTO users (email, password_hash, first_name, last_name, gender) VALUES
('demo@example.com', '$2a$12$IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.ogat2/.uheWGigi', 'Demo', 'User', 'female'),
('sarah@example.com', '$2a$12$IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.ogat2/.uheWGigi', 'Sarah', 'Chen', 'female'),
('marcus@example.com', '$2a$12$IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.ogat2/.uheWGigi', 'Marcus', 'Johnson', 'male')
ON CONFLICT (email) DO NOTHING;

-- Insert sample fashion items with valid image URLs
INSERT INTO fashion_items (name, category, subcategory, gender, base_color, image_url, tags, price_range, style_score) VALUES
('Classic White Button-Down Shirt', 'Topwear', 'Shirts', 'unisex', 'white', 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['classic', 'formal', 'versatile'], 'mid', 8.5),
('High-Waisted Black Jeans', 'Bottomwear', 'Jeans', 'female', 'black', 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['casual', 'modern', 'comfortable'], 'mid', 9.0),
('Leather Chelsea Boots', 'Footwear', 'Boots', 'unisex', 'brown', 'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['leather', 'boots', 'versatile'], 'high', 8.8),
('Oversized Wool Coat', 'Outerwear', 'Coats', 'female', 'camel', 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['winter', 'elegant', 'warm'], 'high', 9.2),
('Casual Sneakers', 'Footwear', 'Sneakers', 'unisex', 'white', 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['casual', 'comfortable', 'sporty'], 'mid', 8.0),
('Silk Midi Dress', 'Dresses', 'Midi', 'female', 'navy', 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['elegant', 'formal', 'silk'], 'high', 9.5),
('Denim Jacket', 'Outerwear', 'Jackets', 'unisex', 'blue', 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['casual', 'denim', 'versatile'], 'mid', 8.3),
('Striped Long Sleeve Tee', 'Topwear', 'T-Shirts', 'unisex', 'navy', 'https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['casual', 'stripes', 'comfortable'], 'low', 7.8),
('Black Blazer', 'Topwear', 'Blazers', 'female', 'black', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['formal', 'business', 'elegant'], 'mid', 9.0),
('Chino Pants', 'Bottomwear', 'Chinos', 'male', 'khaki', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['casual', 'versatile', 'smart-casual'], 'mid', 8.2);

-- Insert sample quiz results
DO $$
DECLARE
    demo_user_id UUID;
    sarah_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@example.com';
    SELECT id INTO sarah_user_id FROM users WHERE email = 'sarah@example.com';
    
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO quiz_results (user_id, gender, answers, aesthetic_profile, is_completed, score) VALUES
        (demo_user_id, 'female', 
         '{"q1": {"text": "Sipping tea on a balcony with a sea breeze", "aesthetic": "Coastal Grandma"}, 
           "q2": {"text": "Beige, ivory, and warm neutrals", "aesthetic": "Old Money"}}',
         'Coastal Grandma', true, 85);
    END IF;
    
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO quiz_results (user_id, gender, answers, aesthetic_profile, is_completed, score) VALUES
        (sarah_user_id, 'female',
         '{"q1": {"text": "Browsing a local bookstore for poetry", "aesthetic": "Dark Academia"},
           "q2": {"text": "Black, charcoal, and deep jewel tones", "aesthetic": "Grunge Fashion"}}',
         'Dark Academia', true, 92);
    END IF;
END $$;

-- Insert sample user preferences
DO $$
DECLARE
    demo_user_id UUID;
    sarah_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@example.com';
    SELECT id INTO sarah_user_id FROM users WHERE email = 'sarah@example.com';
    
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO user_preferences (user_id, aesthetic_profile, color_preferences, style_preferences, budget_range) VALUES
        (demo_user_id, 'Coastal Grandma', ARRAY['beige', 'white', 'cream'], ARRAY['casual', 'comfortable', 'natural'], 'mid');
    END IF;
    
    IF sarah_user_id IS NOT NULL THEN
        INSERT INTO user_preferences (user_id, aesthetic_profile, color_preferences, style_preferences, budget_range) VALUES
        (sarah_user_id, 'Dark Academia', ARRAY['black', 'brown', 'burgundy'], ARRAY['vintage', 'intellectual', 'classic'], 'high');
    END IF;
END $$;
