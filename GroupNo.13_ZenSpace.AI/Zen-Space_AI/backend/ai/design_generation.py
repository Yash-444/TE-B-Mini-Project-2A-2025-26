import torch
from diffusers import StableDiffusionPipeline, DiffusionPipeline
from PIL import Image
import os
from typing import List, Dict
import uuid
import numpy as np

class InteriorDesignGenerator:
    """Generate interior design variations using Stable Diffusion"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.pipe = None
        self.model_loaded = False
        
    def load_model(self):
        """Load Stable Diffusion model optimized for interior design"""
        try:
            print("Loading Stable Diffusion model...")
            
            # Use a model optimized for interior design if available
            model_id = "runwayml/stable-diffusion-v1-5"
            
            if self.device.type == 'cuda' and torch.cuda.is_available():
                self.pipe = StableDiffusionPipeline.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16,
                    safety_checker=None,
                    requires_safety_checker=False
                )
                self.pipe = self.pipe.to(self.device)
                
                # Enable memory optimization
                self.pipe.enable_attention_slicing()
                self.pipe.enable_model_cpu_offload()
                
            else:
                # CPU version
                self.pipe = StableDiffusionPipeline.from_pretrained(
                    model_id,
                    torch_dtype=torch.float32,
                    safety_checker=None,
                    requires_safety_checker=False
                )
                self.pipe.enable_attention_slicing()
            
            self.model_loaded = True
            print(f"Model loaded successfully on {self.device}")
            return True
            
        except Exception as e:
            print(f"Failed to load Stable Diffusion model: {e}")
            self.model_loaded = False
            return False
    
    def generate_interior_designs(self, 
                                  prompt: str, 
                                  room_analysis: Dict,
                                  style: str = "",
                                  num_images: int = 4) -> List[str]:
        """Generate interior design variations"""
        
        if not self.model_loaded:
            if not self.load_model():
                return self.generate_fallback_designs(num_images)
        
        try:
            # Enhance prompt with room analysis and style
            enhanced_prompt = self.create_enhanced_prompt(prompt, room_analysis, style)
            negative_prompt = self.get_negative_prompt()
            
            generated_paths = []
            
            for i in range(num_images):
                print(f"Generating design {i+1}/{num_images}...")
                
                # Generate with different seeds for variety
                generator = torch.Generator(device=self.device).manual_seed(
                    np.random.randint(0, 10000)
                )
                
                image = self.pipe(
                    enhanced_prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=25,  # Good quality/speed balance
                    guidance_scale=7.5,
                    generator=generator,
                    height=512,
                    width=512
                ).images[0]
                
                # Save generated image
                filename = f"interior_design_{uuid.uuid4().hex[:8]}_{i}.jpg"
                filepath = os.path.join('static/generated', filename)
                os.makedirs('static/generated', exist_ok=True)
                
                # Apply post-processing
                processed_image = self.post_process_image(image)
                processed_image.save(filepath, quality=90)
                
                generated_paths.append(f"/static/generated/{filename}")
            
            print("Design generation completed successfully")
            return generated_paths
            
        except Exception as e:
            print(f"Error generating designs: {e}")
            return self.generate_fallback_designs(num_images)
    
    def create_enhanced_prompt(self, user_prompt: str, room_analysis: Dict, style: str) -> str:
        """Create enhanced prompt for better interior design generation"""
        
        room_type = room_analysis.get('room_type', 'living room')
        colors = room_analysis.get('dominant_colors', [])
        mood = room_analysis.get('color_analysis', 'modern')
        
        # Base prompt
        enhanced = f"Interior design photograph of a beautiful {room_type}"
        
        # Add user's vision
        if user_prompt:
            enhanced += f", {user_prompt}"
        
        # Add style
        if style and style.lower() != 'no specific style':
            enhanced += f", {style} style interior"
        
        # Add mood-based descriptors
        mood_descriptors = {
            'warm_cozy': ', warm lighting, cozy atmosphere, comfortable furniture',
            'cool_modern': ', modern minimalist design, clean lines, contemporary furniture',
            'balanced_neutral': ', balanced color palette, harmonious design, elegant furniture'
        }
        
        enhanced += mood_descriptors.get(mood, ', stylish and well-designed')
        
        # Add quality descriptors
        enhanced += (
            ", professional interior photography, high resolution, well-lit, "
            "realistic, detailed, architectural photography, home decor magazine quality"
        )
        
        return enhanced
    
    def get_negative_prompt(self) -> str:
        """Get negative prompt to avoid unwanted elements"""
        return (
            "low quality, blurry, pixelated, distorted, ugly, messy, cluttered, "
            "dark, poor lighting, unrealistic, cartoon, painting, sketch, "
            "people, faces, text, watermark, signature"
        )
    
    def post_process_image(self, image: Image.Image) -> Image.Image:
        """Apply post-processing to improve image quality"""
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # Apply subtle sharpening
            from scipy.ndimage import unsharp_mask
            sharpened = unsharp_mask(img_array, radius=1, amount=0.5)
            
            # Ensure values are in valid range
            sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)
            
            # Convert back to PIL Image
            processed_image = Image.fromarray(sharpened)
            
            return processed_image
            
        except Exception as e:
            print(f"Post-processing failed: {e}")
            return image
    
    def generate_fallback_designs(self, num_images: int) -> List[str]:
        """Generate fallback placeholder designs when AI model fails"""
        fallback_designs = []
        
        # Use placeholder service with interior design themes
        base_urls = [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=512&h=512&fit=crop",  # Living room
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=512&h=512&fit=crop",  # Bedroom
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=512&h=512&fit=crop",  # Kitchen
            "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=512&h=512&fit=crop",  # Dining room
        ]
        
        for i in range(num_images):
            url = base_urls[i % len(base_urls)]
            fallback_designs.append(url)
        
        return fallback_designs
    
    def generate_style_variations(self, base_prompt: str, styles: List[str]) -> List[str]:
        """Generate variations with different styles"""
        variations = []
        
        for style in styles:
            style_prompt = f"{base_prompt}, {style} style interior design"
            variations.extend(
                self.generate_interior_designs(style_prompt, {}, style, num_images=1)
            )
        
        return variations
