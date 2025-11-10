-- Sample data for ZenSpace AI

-- Insert sample products
INSERT INTO products (name, category, subcategory, price, vendor_name, image_url, description) VALUES
-- Seating
('Modern Sectional Sofa', 'seating', 'sofa', 45000.00, 'IKEA', '/static/images/products/modern-sofa.jpg', 'Comfortable 3-seater sectional sofa in light gray fabric'),
('Ergonomic Office Chair', 'seating', 'chair', 12000.00, 'Urban Ladder', '/static/images/products/office-chair.jpg', 'Ergonomic office chair with lumbar support'),
('Accent Armchair', 'seating', 'chair', 18000.00, 'Pepperfry', '/static/images/products/accent-chair.jpg', 'Stylish accent chair in emerald green velvet'),

-- Tables
('Glass Coffee Table', 'tables', 'coffee_table', 8500.00, 'Urban Ladder', '/static/images/products/glass-table.jpg', 'Modern tempered glass coffee table with metal frame'),
('Wooden Dining Table', 'tables', 'dining_table', 25000.00, 'IKEA', '/static/images/products/dining-table.jpg', 'Solid wood dining table for 6 people'),
('Side Table Set', 'tables', 'side_table', 6000.00, 'Pepperfry', '/static/images/products/side-table.jpg', 'Set of 2 wooden side tables'),

-- Storage
('Modular Bookshelf', 'storage', 'bookshelf', 15000.00, 'Urban Ladder', '/static/images/products/bookshelf.jpg', '5-tier modular bookshelf in oak finish'),
('Wardrobe with Mirror', 'storage', 'wardrobe', 35000.00, 'IKEA', '/static/images/products/wardrobe.jpg', '3-door wardrobe with full-length mirror'),
('Storage Ottoman', 'storage', 'ottoman', 4500.00, 'Pepperfry', '/static/images/products/ottoman.jpg', 'Storage ottoman in beige fabric'),

-- Lighting
('Floor Lamp Modern', 'lighting', 'floor_lamp', 5500.00, 'Urban Ladder', '/static/images/products/floor-lamp.jpg', 'Modern tripod floor lamp with fabric shade'),
('Chandelier Crystal', 'lighting', 'chandelier', 22000.00, 'Pepperfry', '/static/images/products/chandelier.jpg', 'Crystal chandelier with LED lights'),
('Table Lamp Set', 'lighting', 'table_lamp', 3200.00, 'IKEA', '/static/images/products/table-lamp.jpg', 'Set of 2 ceramic table lamps'),

-- Decor
('Wall Art Abstract', 'decor', 'wall_art', 2800.00, 'Art Gallery', '/static/images/products/wall-art.jpg', 'Abstract canvas wall art 24x36 inches'),
('Decorative Mirror', 'decor', 'mirror', 4200.00, 'Urban Ladder', '/static/images/products/mirror.jpg', 'Round decorative mirror with gold frame'),
('Ceramic Vase Set', 'decor', 'vase', 1500.00, 'Pepperfry', '/static/images/products/vase-set.jpg', 'Set of 3 ceramic vases in different sizes'),

-- Textiles
('Area Rug Persian', 'textiles', 'rug', 8900.00, 'Carpet World', '/static/images/products/persian-rug.jpg', '6x9 feet Persian style area rug'),
('Throw Pillows Set', 'textiles', 'pillows', 2200.00, 'IKEA', '/static/images/products/throw-pillows.jpg', 'Set of 4 decorative throw pillows'),
('Curtains Blackout', 'textiles', 'curtains', 3800.00, 'Urban Ladder', '/static/images/products/curtains.jpg', 'Blackout curtains 84 inches long'),

-- Plants
('Fiddle Leaf Fig', 'plants', 'indoor_plant', 1800.00, 'Plant Nursery', '/static/images/products/fiddle-fig.jpg', 'Large fiddle leaf fig plant with decorative pot'),
('Snake Plant', 'plants', 'indoor_plant', 950.00, 'Plant Nursery', '/static/images/products/snake-plant.jpg', 'Low maintenance snake plant in ceramic pot'),
('Plant Stand Wooden', 'plants', 'plant_stand', 2500.00, 'Pepperfry', '/static/images/products/plant-stand.jpg', 'Multi-level wooden plant stand');

-- Insert sample user (password is 'password123')
INSERT INTO users (username, email, password_hash) VALUES
('demo_user', 'demo@zenspace.ai', 'scrypt:32768:8:1$lPf8mXYEqOQ1HZox$46d4a7e5c4e7c8b8f3e2a1d9c5b6e4f7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4');

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, preferred_styles, color_preferences, budget_range, room_types) VALUES
(1, '["Modern", "Minimalist", "Scandinavian"]', '["#FFFFFF", "#808080", "#D4B896"]', '25000-100000', '["living_room", "bedroom", "kitchen"]');

-- Insert sample design
INSERT INTO designs (user_id, room_name, room_image, style, status, ai_analysis) VALUES
(1, 'My Living Room', 'sample_room.jpg', 'Modern', 'completed', '{"room_type": "living_room", "confidence": 0.85, "dominant_colors": ["#FFFFFF", "#808080", "#D4B896"], "lighting": {"overall_brightness": 145.5, "lighting_type": "mixed_lighting"}}');
