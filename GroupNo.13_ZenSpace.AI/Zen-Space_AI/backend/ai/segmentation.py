import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms

class RoomSegmenter:
    """Semantic segmentation for room elements"""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = [
            'background', 'wall', 'floor', 'ceiling', 'door', 'window',
            'furniture', 'decoration', 'lighting', 'plant'
        ]
    
    def load_model(self):
        """Load segmentation model"""
        try:
            # Use DeepLabV3 for semantic segmentation
            from torchvision.models.segmentation import deeplabv3_resnet50
            self.model = deeplabv3_resnet50(pretrained=True)
            self.model.to(self.device)
            self.model.eval()
            
            self.preprocess = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            print("Segmentation model loaded successfully")
            return True
        except Exception as e:
            print(f"Failed to load segmentation model: {e}")
            return False
    
    def segment_room(self, image_path):
        """Segment room into different elements"""
        try:
            if not self.model:
                if not self.load_model():
                    return None
            
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.preprocess(image)
            input_batch = input_tensor.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                output = self.model(input_batch)['out'][0]
            
            output_predictions = output.argmax(0).cpu().numpy()
            
            # Map predictions to room elements
            segments = self.map_to_room_elements(output_predictions)
            
            return segments
            
        except Exception as e:
            print(f"Segmentation failed: {e}")
            return None
    
    def map_to_room_elements(self, predictions):
        """Map segmentation predictions to room elements"""
        # This is a simplified mapping - in practice, you'd need
        # a model trained specifically on interior scenes
        
        unique_classes = np.unique(predictions)
        segments = {}
        
        # Basic mapping (simplified)
        for class_id in unique_classes:
            mask = (predictions == class_id)
            area = np.sum(mask)
            
            if area > 1000:  # Only consider significant segments
                if class_id < len(self.class_names):
                    element_name = self.class_names[class_id]
                    segments[element_name] = {
                        'mask': mask,
                        'area': int(area),
                        'percentage': float(area / predictions.size * 100)
                    }
        
        return segments
    
    def analyze_room_layout(self, segments):
        """Analyze room layout from segments"""
        if not segments:
            return {
                'layout_type': 'open_plan',
                'wall_coverage': 60,
                'floor_coverage': 25,
                'furniture_coverage': 15
            }
        
        layout_analysis = {
            'layout_type': 'open_plan',
            'wall_coverage': segments.get('wall', {}).get('percentage', 50),
            'floor_coverage': segments.get('floor', {}).get('percentage', 30),
            'furniture_coverage': segments.get('furniture', {}).get('percentage', 20),
            'elements_detected': list(segments.keys())
        }
        
        # Determine layout type based on segments
        if 'door' in segments and segments['door']['percentage'] > 5:
            layout_analysis['layout_type'] = 'traditional'
        elif 'window' in segments and segments['window']['percentage'] > 10:
            layout_analysis['layout_type'] = 'bright_open'
        
        return layout_analysis
