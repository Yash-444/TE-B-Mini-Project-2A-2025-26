from .room_analyzer import RoomAnalyzer
from .design_generation import InteriorDesignGenerator

import os
from typing import Dict, List
import time

class AIService:
    def __init__(self):
        """Initialize AI services"""
        print("Initializing ZenSpace AI Services...")
        self.room_analyzer = RoomAnalyzer()
        self.design_generation = InteriorDesignGenerator()
        print("AI Services initialized successfully!")
        
    def process_room_upload(self, image_path: str, user_prompt: str = "") -> Dict:
        """Complete room processing with AI analysis"""
        try:
            print(f"Processing room image: {image_path}")
            start_time = time.time()
            
            # Step 1: Room Analysis
            room_analysis = self.room_analyzer.get_full_analysis(image_path)
            
            # Step 2: Generate Design Variations (if prompt provided)
            generated_images = []
            if user_prompt:
                generated_images = self.design_generator.generate_interior_designs(
                    user_prompt, room_analysis, num_images=4
                )
            
            processing_time = time.time() - start_time
            
            return {
                'success': True,
                'room_analysis': room_analysis,
                'generated_designs': generated_images,
                'processing_time': round(processing_time, 2)
            }
            
        except Exception as e:
            print(f"Error in room processing: {e}")
            return {
                'success': False,
                'error': str(e),
                'room_analysis': {},
                'generated_designs': []
            }
    
    def generate_designs_from_prompt(self, 
                                     image_path: str, 
                                     prompt: str, 
                                     style: str = "") -> Dict:
        """Generate designs based on user prompt and style"""
        try:
            print(f"Generating designs for prompt: {prompt}")
            
            # Get room analysis for context
            room_analysis = self.room_analyzer.get_full_analysis(image_path)
            
            # Generate designs
            generated_images = self.design_generator.generate_interior_designs(
                prompt, room_analysis, style, num_images=4
            )
            
            return {
                'success': True,
                'generated_designs': generated_images,
                'room_analysis': room_analysis,
                'prompt_used': f"{prompt} {style}".strip()
            }
            
        except Exception as e:
            print(f"Error in design generation: {e}")
            return {
                'success': False,
                'error': str(e),
                'generated_designs': [],
                'room_analysis': {},
                'prompt_used': prompt
            }
    
    def get_ai_status(self) -> Dict:
        """Get status of all AI components"""
        return {
            'room_analyzer': 'loaded',
            'design_generator': 'loaded' if self.design_generation.model_loaded else 'fallback',
            'device': str(self.room_analyzer.device)
        }

# Global AI service instance
ai_service = AIService()
