from typing import Dict, List
import json

class PricingCalculator:
    """Calculate pricing for interior design implementations"""
    
    def __init__(self):
        self.base_rates = {
            'living_room': 50000,
            'bedroom': 40000,
            'kitchen': 75000,
            'bathroom': 35000,
            'dining_room': 45000
        }
        
        self.complexity_multipliers = {
            'minimal': 0.7,
            'moderate': 1.0,
            'complex': 1.4,
            'luxury': 2.0
        }
    
    def calculate_design_cost(self, design_data: Dict) -> Dict:
        """Calculate total cost for a design implementation"""
        
        room_type = design_data.get('room_type', 'living_room')
        base_cost = self.base_rates.get(room_type, 50000)
        
        # Analyze complexity
        complexity = self._analyze_complexity(design_data)
        complexity_multiplier = self.complexity_multipliers.get(complexity, 1.0)
        
        # Calculate component costs
        furniture_cost = base_cost * 0.6 * complexity_multiplier
        decor_cost = base_cost * 0.2 * complexity_multiplier
        lighting_cost = base_cost * 0.15 * complexity_multiplier
        installation_cost = base_cost * 0.05
        
        total_cost = furniture_cost + decor_cost + lighting_cost + installation_cost
        
        return {
            'total_estimated_cost': round(total_cost, 2),
            'currency': 'INR',
            'breakdown': {
                'furniture': round(furniture_cost, 2),
                'decor': round(decor_cost, 2),
                'lighting': round(lighting_cost, 2),
                'installation': round(installation_cost, 2)
            },
            'complexity': complexity,
            'room_type': room_type
        }
    
    def _analyze_complexity(self, design_data: Dict) -> str:
        """Analyze design complexity based on various factors"""
        
        complexity_score = 0
        
        # Room size factor
        room_dimensions = design_data.get('room_dimensions', {})
        room_area = room_dimensions.get('width', 12) * room_dimensions.get('depth', 8)
        
        if room_area > 200:
            complexity_score += 2
        elif room_area > 120:
            complexity_score += 1
        
        # Furniture count factor
        furniture_analysis = design_data.get('furniture_analysis', {})
        furniture_count = furniture_analysis.get('furniture_count', 3)
        
        if furniture_count > 8:
            complexity_score += 2
        elif furniture_count > 5:
            complexity_score += 1
        
        # Color complexity
        colors = design_data.get('dominant_colors', [])
        if len(colors) > 4:
            complexity_score += 1
        
        # Lighting complexity
        lighting = design_data.get('lighting', {})
        if lighting.get('light_sources_detected', 1) > 3:
            complexity_score += 1
        
        # Map score to complexity level
        if complexity_score >= 5:
            return 'luxury'
        elif complexity_score >= 3:
            return 'complex'
        elif complexity_score >= 1:
            return 'moderate'
        else:
            return 'minimal'

    def get_product_recommendations(self, design_data: Dict, budget: float) -> List[Dict]:
        """Get product recommendations within budget"""
        room_type = design_data.get('room_type', 'living_room')
        
        # This would integrate with your products database
        recommendations = []
        
        # Mock recommendations based on room type and budget
        if room_type == 'living_room' and budget > 30000:
            recommendations = [
                {'name': 'Modern Sectional Sofa', 'price': 45000, 'priority': 'high'},
                {'name': 'Glass Coffee Table', 'price': 8500, 'priority': 'medium'},
                {'name': 'Floor Lamp Modern', 'price': 5500, 'priority': 'medium'},
                {'name': 'Area Rug Persian', 'price': 8900, 'priority': 'low'}
            ]
        
        # Filter by budget
        affordable_recommendations = [
            item for item in recommendations 
            if item['price'] <= budget * 0.4  # Max 40% of budget per item
        ]
        
        return affordable_recommendations

# Global pricing calculator instance
pricing_calculator = PricingCalculator()
