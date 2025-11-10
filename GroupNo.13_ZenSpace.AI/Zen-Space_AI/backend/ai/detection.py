import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms

class FurnitureDetector:
    """Detect and classify furniture in room images"""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.furniture_classes = [
            'sofa', 'chair', 'table', 'bed', 'desk', 'bookshelf',
            'tv', 'lamp', 'plant', 'artwork', 'mirror', 'cabinet'
        ]
    
    def load_model(self):
        """Load furniture detection model"""
        try:
            # Use YOLO or similar object detection model
            # For this example, we'll use a simple approach
            from torchvision.models import mobilenet_v2
            self.model = mobilenet_v2(pretrained=True)
            self.model.to(self.device)
            self.model.eval()
            
            self.preprocess = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            print("Furniture detection model loaded successfully")
            return True
        except Exception as e:
            print(f"Failed to load detection model: {e}")
            return False
    
    def detect_furniture(self, image_path):
        """Detect furniture in room image"""
        try:
            if not self.model:
                if not self.load_model():
                    return []
            
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.preprocess(image)
            input_batch = input_tensor.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(input_batch)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            
            # Get top detections (simplified)
            top5_prob, top5_idx = torch.topk(probabilities, 5)
            
            detections = []
            for i in range(5):
                if top5_prob[i] > 0.1:  # Confidence threshold
                    # Map to furniture class (simplified mapping)
                    furniture_type = self.map_to_furniture_class(int(top5_idx[i]))
                    if furniture_type:
                        detections.append({
                            'type': furniture_type,
                            'confidence': float(top5_prob[i]),
                            'bbox': [100, 100, 200, 200]  # Placeholder bbox
                        })
            
            return detections
            
        except Exception as e:
            print(f"Furniture detection failed: {e}")
            return []
    
    def map_to_furniture_class(self, class_id):
        """Map model output to furniture class"""
        # This is a simplified mapping - you'd need proper training data
        furniture_mapping = {
            831: 'sofa',  # ImageNet class for sofa
            857: 'table',  # dining table
            432: 'bookshelf',  # bookcase
            649: 'chair',  # folding chair
            764: 'lamp',  # table lamp
        }
        
        return furniture_mapping.get(class_id, None)
    
    def analyze_furniture_layout(self, detections):
        """Analyze detected furniture layout"""
        if not detections:
            return {
                'furniture_count': 0,
                'layout_density': 'sparse',
                'dominant_furniture': None,
                'suggestions': ['Add a focal point like a sofa or coffee table']
            }
        
        furniture_types = [det['type'] for det in detections]
        furniture_count = len(detections)
        
        analysis = {
            'furniture_count': furniture_count,
            'detected_items': furniture_types,
            'layout_density': 'dense' if furniture_count > 5 else 'moderate' if furniture_count > 2 else 'sparse',
            'dominant_furniture': max(set(furniture_types), key=furniture_types.count) if furniture_types else None,
            'suggestions': self.get_furniture_suggestions(furniture_types)
        }
        
        return analysis
    
    def get_furniture_suggestions(self, existing_furniture):
        """Get suggestions based on detected furniture"""
        suggestions = []
        
        if 'sofa' not in existing_furniture:
            suggestions.append('Consider adding a sofa for comfortable seating')
        
        if 'table' not in existing_furniture:
            suggestions.append('Add a coffee table or side table for functionality')
        
        if 'lamp' not in existing_furniture:
            suggestions.append('Include lighting fixtures for better ambiance')
        
        if 'plant' not in existing_furniture:
            suggestions.append('Add some plants for a fresh, natural feel')
        
        if not suggestions:
            suggestions.append('Your room has good furniture coverage!')
        
        return suggestions
