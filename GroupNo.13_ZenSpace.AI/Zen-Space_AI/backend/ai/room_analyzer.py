import cv2
import numpy as np
import torch
from torchvision import transforms, models
from PIL import Image
import json
from typing import Dict, List, Tuple
from sklearn.cluster import KMeans

class RoomAnalyzer:
    def __init__(self):
        """Initialize room analysis model"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.scene_model = None
        self.load_models()
        
    def load_models(self):
        """Load pre-trained models for scene and style analysis"""
        try:
            # Load ResNet50 for scene classification
            self.scene_model = models.resnet50(pretrained=True)
            self.scene_model.eval()
            self.scene_model.to(self.device)
            
            # Transform for preprocessing images
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            print(f"Room analyzer models loaded successfully on {self.device}")
        except Exception as e:
            print(f"Error loading models: {e}")
            
    def analyze_room_type(self, image_path: str) -> Dict:
        """Analyze room type from image"""
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.scene_model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                
            # Simple room classification (you can improve this)
            room_classification = self._classify_room_from_features(image_path)
            
            return {
                'room_type': room_classification['type'],
                'confidence': room_classification['confidence'],
                'characteristics': room_classification['characteristics'],
                'suggestions': self.get_room_suggestions(room_classification['type'])
            }
            
        except Exception as e:
            return {
                'room_type': 'living_room',
                'confidence': 0.6,
                'characteristics': ['general_space'],
                'error': str(e),
                'suggestions': self.get_room_suggestions('living_room')
            }
    
    def _classify_room_from_features(self, image_path: str) -> Dict:
        """Classify room type based on visual features"""
        # Load image for analysis
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Analyze image characteristics
        brightness = np.mean(image_rgb)
        color_variance = np.var(image_rgb)
        
        # Simple heuristic-based classification
        if brightness > 180:
            room_type = 'bathroom'
            confidence = 0.7
            characteristics = ['bright', 'clean', 'minimal']
        elif brightness < 100:
            room_type = 'bedroom'
            confidence = 0.75
            characteristics = ['cozy', 'private', 'relaxing']
        elif color_variance > 2000:
            room_type = 'living_room'
            confidence = 0.8
            characteristics = ['colorful', 'social', 'comfortable']
        else:
            room_type = 'kitchen'
            confidence = 0.65
            characteristics = ['functional', 'organized', 'practical']
        
        return {
            'type': room_type,
            'confidence': confidence,
            'characteristics': characteristics
        }
    
    def analyze_color_palette(self, image_path: str) -> Dict:
        """Extract dominant colors from room image"""
        try:
            image = cv2.imread(image_path)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Reshape image to be a list of pixels
            pixels = image.reshape(-1, 3)
            
            # Use K-means to find dominant colors
            kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            # Get the colors
            colors = kmeans.cluster_centers_.astype(int)
            
            # Convert to hex
            hex_colors = ['#%02x%02x%02x' % (r, g, b) for r, g, b in colors]
            
            return {
                'dominant_colors': hex_colors,
                'color_analysis': self.analyze_color_mood(hex_colors),
                'color_temperature': self._analyze_color_temperature(colors),
                'brightness_level': self._analyze_brightness(image)
            }
            
        except Exception as e:
            return {
                'dominant_colors': ['#FFFFFF', '#808080', '#D4B896', '#8B4513', '#228B22'],
                'color_analysis': 'neutral',
                'color_temperature': 'balanced',
                'brightness_level': 'moderate',
                'error': str(e)
            }
    
    def _analyze_color_temperature(self, colors: np.ndarray) -> str:
        """Analyze color temperature of the room"""
        # Calculate average color temperature
        avg_color = np.mean(colors, axis=0)
        r, g, b = avg_color
        
        # Simple color temperature analysis
        if r > g and r > b:
            return 'warm'
        elif b > r and b > g:
            return 'cool'
        else:
            return 'neutral'
    
    def _analyze_brightness(self, image: np.ndarray) -> str:
        """Analyze overall brightness level"""
        brightness = np.mean(image)
        
        if brightness > 180:
            return 'very_bright'
        elif brightness > 140:
            return 'bright'
        elif brightness > 100:
            return 'moderate'
        elif brightness > 60:
            return 'dim'
        else:
            return 'very_dim'
    
    def get_room_suggestions(self, room_type: str) -> List[str]:
        """Get furniture/decor suggestions based on room type"""
        suggestions = {
            'living_room': [
                'Add a comfortable sectional sofa as the focal point',
                'Include a coffee table for functionality and style',
                'Add ambient lighting with floor or table lamps',
                'Consider wall art or mirrors to enhance the space',
                'Include plants for freshness and natural elements'
            ],
            'bedroom': [
                'Upgrade to quality bedding and comfortable pillows',
                'Add bedside tables with appropriate lighting',
                'Include adequate storage like dressers or wardrobes',
                'Consider blackout curtains for better sleep',
                'Add a comfortable reading chair if space allows'
            ],
            'kitchen': [
                'Organize counter space with stylish storage solutions',
                'Add pendant lights over islands or dining areas',
                'Include bar stools for casual seating',
                'Consider upgrading backsplash for visual interest',
                'Add herbs or small plants for freshness'
            ],
            'bathroom': [
                'Upgrade shower fixtures and hardware',
                'Add efficient storage solutions',
                'Include proper lighting around mirrors',
                'Consider heated towel racks for luxury',
                'Add plants that thrive in humidity'
            ],
            'dining_room': [
                'Choose a dining table that fits your space and needs',
                'Add comfortable, stylish dining chairs',
                'Include a statement lighting fixture as focal point',
                'Consider a sideboard or buffet for storage',
                'Add a dining room rug to define the space'
            ]
        }
        
        return suggestions.get(room_type, suggestions['living_room'])
    
    def analyze_color_mood(self, colors: List[str]) -> str:
        """Analyze the mood based on color palette"""
        # Convert hex to RGB for analysis
        rgb_colors = []
        for hex_color in colors:
            hex_color = hex_color.lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            rgb_colors.append(rgb)
        
        # Analyze color characteristics
        warm_score = 0
        cool_score = 0
        brightness_score = 0
        
        for r, g, b in rgb_colors:
            # Warm vs cool analysis
            if r > b:
                warm_score += 1
            elif b > r:
                cool_score += 1
            
            # Brightness analysis
            brightness_score += (r + g + b) / 3
        
        brightness_score /= len(rgb_colors)
        
        # Determine mood
        if warm_score > cool_score and brightness_score > 150:
            return 'warm_bright'
        elif warm_score > cool_score:
            return 'warm_cozy'
        elif cool_score > warm_score and brightness_score > 150:
            return 'cool_modern'
        elif cool_score > warm_score:
            return 'cool_calming'
        else:
            return 'balanced_neutral'

    def get_full_analysis(self, image_path: str) -> Dict:
        """Get complete room analysis"""
        room_analysis = self.analyze_room_type(image_path)
        color_analysis = self.analyze_color_palette(image_path)
        
        return {
            **room_analysis,
            **color_analysis,
            'analysis_timestamp': np.datetime64('now').item().isoformat()
        }
