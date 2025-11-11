import logging
import requests
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os

logger = logging.getLogger(__name__)

class ExternalCatalogService:
    """Service for integrating with external fashion APIs"""
    
    def __init__(self):
        self.api_key = os.getenv('EXTERNAL_API_KEY')
        self.api_base_url = os.getenv('EXTERNAL_API_URL', 'https://api.example-fashion.com')
        self.timeout = 30
        self.max_retries = 3
    
    async def search_products(
        self, 
        query: str, 
        category: str = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search products from external fashion API"""
        try:
            if not self.api_key:
                logger.warning("External API key not configured, using fallback")
                return await self._fallback_search(query, category, limit)
            
            params = {
                'q': query,
                'limit': limit
            }
            
            if category:
                params['category'] = category
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            url = f"{self.api_base_url}/search"
            
            # Make async request
            response = await self._make_request('GET', url, params=params, headers=headers)
            
            if response and 'products' in response:
                return self._normalize_products(response['products'])
            
            return []
            
        except Exception as e:
            logger.error(f"Error searching external catalog: {e}")
            return await self._fallback_search(query, category, limit)
    
    async def get_product_details(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed product information from external API"""
        try:
            if not self.api_key:
                return None
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            url = f"{self.api_base_url}/products/{product_id}"
            
            response = await self._make_request('GET', url, headers=headers)
            
            if response:
                return self._normalize_product(response)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting product details: {e}")
            return None
    
    async def get_trending_items(self, category: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get trending fashion items from external API"""
        try:
            if not self.api_key:
                return await self._fallback_trending(category, limit)
            
            params = {
                'trending': True,
                'limit': limit
            }
            
            if category:
                params['category'] = category
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            url = f"{self.api_base_url}/trending"
            
            response = await self._make_request('GET', url, params=params, headers=headers)
            
            if response and 'items' in response:
                return self._normalize_products(response['items'])
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting trending items: {e}")
            return await self._fallback_trending(category, limit)
    
    async def _make_request(
        self, 
        method: str, 
        url: str, 
        params: Dict = None, 
        headers: Dict = None, 
        data: Dict = None
    ) -> Optional[Dict[str, Any]]:
        """Make HTTP request with retries and error handling"""
        
        for attempt in range(self.max_retries):
            try:
                # Simulate async HTTP request (replace with actual async HTTP client)
                # Using requests here for simplicity, but in production use httpx or aiohttp
                
                if method == 'GET':
                    response = requests.get(
                        url, 
                        params=params, 
                        headers=headers, 
                        timeout=self.timeout
                    )
                elif method == 'POST':
                    response = requests.post(
                        url, 
                        json=data, 
                        headers=headers, 
                        timeout=self.timeout
                    )
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout on attempt {attempt + 1}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Rate limited
                    logger.warning("Rate limited, waiting before retry")
                    await asyncio.sleep(5 * (attempt + 1))
                else:
                    raise
                    
            except Exception as e:
                logger.error(f"Request error on attempt {attempt + 1}: {e}")
                if attempt == self.max_retries - 1:
                    raise
        
        return None
    
    def _normalize_products(self, products: List[Dict]) -> List[Dict[str, Any]]:
        """Normalize external API product format to internal format"""
        normalized = []
        
        for product in products:
            try:
                normalized_product = {
                    'id': product.get('id'),
                    'external_id': product.get('id'),
                    'name': product.get('name', product.get('title', '')),
                    'category': product.get('category', ''),
                    'subcategory': product.get('subcategory', ''),
                    'gender': product.get('gender', ''),
                    'base_color': product.get('color', product.get('primary_color', '')),
                    'image_url': product.get('image_url', product.get('image', '')),
                    'tags': product.get('tags', []),
                    'price_range': self._normalize_price(product.get('price')),
                    'style_score': product.get('popularity', 0.5),
                    'source': 'external_api'
                }
                
                normalized.append(normalized_product)
                
            except Exception as e:
                logger.warning(f"Error normalizing product: {e}")
                continue
        
        return normalized
    
    def _normalize_product(self, product: Dict) -> Dict[str, Any]:
        """Normalize single product from external API"""
        products = self._normalize_products([product])
        return products[0] if products else {}
    
    def _normalize_price(self, price_data) -> str:
        """Normalize price information to price range"""
        try:
            if isinstance(price_data, (int, float)):
                price = float(price_data)
                if price < 50:
                    return 'low'
                elif price < 150:
                    return 'mid'
                else:
                    return 'high'
            elif isinstance(price_data, dict):
                price = float(price_data.get('amount', 0))
                return self._normalize_price(price)
            else:
                return 'unknown'
                
        except (ValueError, TypeError):
            return 'unknown'
    
    async def _fallback_search(self, query: str, category: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback search when external API is unavailable"""
        logger.info(f"Using fallback search for query: {query}")
        
        # Mock fallback data
        fallback_items = []
        for i in range(min(limit, 10)):
            fallback_items.append({
                'id': f'fallback_{i}',
                'name': f'{query} Item {i}',
                'category': category or 'clothing',
                'image_url': f'https://picsum.photos/400/600?random={i}',
                'tags': [query.lower(), 'fallback'],
                'price_range': 'mid',
                'style_score': 0.6,
                'source': 'fallback'
            })
        
        return fallback_items
    
    async def _fallback_trending(self, category: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback trending items when external API is unavailable"""
        logger.info("Using fallback trending items")
        
        trending_items = [
            "Oversized Blazer",
            "Wide Leg Jeans", 
            "Chunky Sneakers",
            "Midi Dress",
            "Leather Jacket"
        ]
        
        fallback_items = []
        for i, item in enumerate(trending_items[:limit]):
            fallback_items.append({
                'id': f'trending_{i}',
                'name': item,
                'category': category or 'clothing',
                'image_url': f'https://picsum.photos/400/600?random=trending_{i}',
                'tags': ['trending', item.lower().replace(' ', '_')],
                'price_range': 'mid',
                'style_score': 0.8,
                'source': 'fallback_trending'
            })
        
        return fallback_items

# Global service instance
external_catalog = ExternalCatalogService()
