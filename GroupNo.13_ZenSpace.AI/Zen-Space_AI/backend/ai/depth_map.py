import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F

class DepthEstimator:
    """Depth estimation for room images"""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def load_model(self):
        """Load MiDaS depth estimation model"""
        try:
            # Use MiDaS for depth estimation
            self.model = torch.hub.load('intel-isl/MiDaS', 'MiDaS_small')
            self.model.to(self.device)
            self.model.eval()
            
            # Load transforms
            self.midas_transforms = torch.hub.load('intel-isl/MiDaS', 'transforms')
            self.transform = self.midas_transforms.small_transform
            
            print("Depth estimation model loaded successfully")
            return True
        except Exception as e:
            print(f"Failed to load depth model: {e}")
            return False
    
    def estimate_depth(self, image_path):
        """Estimate depth map from room image"""
        try:
            if not self.model:
                if not self.load_model():
                    return None
            
            # Load and preprocess image
            img = cv2.imread(image_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Transform for model
            input_batch = self.transform(img).to(self.device)
            
            with torch.no_grad():
                prediction = self.model(input_batch)
                
                prediction = torch.nn.functional.interpolate(
                    prediction.unsqueeze(1),
                    size=img.shape[:2],
                    mode="bicubic",
                    align_corners=False,
                ).squeeze()
            
            # Convert to numpy
            depth_map = prediction.cpu().numpy()
            
            # Normalize for visualization
            depth_map = cv2.normalize(depth_map, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
            
            return depth_map
            
        except Exception as e:
            print(f"Depth estimation failed: {e}")
            return None
    
    def get_room_dimensions(self, depth_map):
        """Estimate room dimensions from depth map"""
        if depth_map is None:
            return {'width': 12, 'height': 10, 'depth': 8}  # Default room size
        
        # Simple room dimension estimation
        h, w = depth_map.shape
        
        # Calculate approximate dimensions (this is simplified)
        avg_depth = np.mean(depth_map) / 255.0 * 10  # Scale to realistic meters
        room_width = w / 50  # Approximate width in meters
        room_height = h / 60  # Approximate height in meters
        
        return {
            'width': max(8, min(20, room_width)),
            'height': max(8, min(15, room_height)),
            'depth': max(6, min(15, avg_depth))
        }
