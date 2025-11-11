import React, { useEffect } from 'react';
import { X, Heart, Save, ExternalLink, Star, Tag } from 'lucide-react';
import PropTypes from 'prop-types';

const ModalView = ({ isOpen, onClose, outfit }) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !outfit) return null;

  const formatPrice = (priceRange) => {
    const priceMap = {
      'low': 'Budget Friendly (₹)',
      'mid': 'Mid Range (₹₹)',
      'high': 'Premium (₹₹₹)',
      'premium': 'Luxury (₹₹₹₹)'
    };
    return priceMap[priceRange?.toLowerCase()] || 'Price not available';
  };

  const getPlaceholderImage = () => {
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&h=1200&q=80`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative bg-gray-100 min-h-[400px] md:min-h-[600px]">
            <img
              src={outfit.imageUrl || outfit.image_url || getPlaceholderImage()}
              alt={outfit.name || 'Fashion item'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = getPlaceholderImage();
              }}
            />

            {/* Style Score Badge */}
            {outfit.styleScore || outfit.style_score ? (
              <div className="absolute top-4 left-4 bg-primary-500 text-white px-3 py-2 rounded-full flex items-center space-x-1 shadow-lg">
                <Star className="w-4 h-4" />
                <span className="font-medium">
                  {Math.round((outfit.styleScore || outfit.style_score) * 10) / 10}
                </span>
              </div>
            ) : null}
          </div>

          {/* Details Section */}
          <div className="p-8 overflow-y-auto">
            <div className="space-y-6">
              {/* Title and Category */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {outfit.name || 'Fashion Item'}
                </h2>
                <p className="text-lg text-gray-600">
                  {outfit.category}
                  {outfit.subcategory && ` • ${outfit.subcategory}`}
                  {outfit.gender && ` • ${outfit.gender}`}
                </p>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-1">Price Range</h3>
                <p className="text-primary-600 font-medium">
                  {formatPrice(outfit.priceRange || outfit.price_range)}
                </p>
              </div>

              {/* Color */}
              {outfit.baseColor || outfit.base_color ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Color</h3>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: getColorHex(outfit.baseColor || outfit.base_color) }}
                    ></div>
                    <span className="text-gray-700 capitalize font-medium">
                      {outfit.baseColor || outfit.base_color}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Tags */}
              {outfit.tags && outfit.tags.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Style Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {outfit.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Info */}
              {outfit.season && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Season</h3>
                  <p className="text-gray-700 capitalize">{outfit.season}</p>
                </div>
              )}

              {/* Usage/Occasion */}
              {outfit.usage && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Best For</h3>
                  <p className="text-gray-700 capitalize">{outfit.usage}</p>
                </div>
              )}

              {/* Similarity Score */}
              {outfit.similarityScore && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <h3 className="font-semibold text-primary-900 mb-1">Style Match</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${outfit.similarityScore * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-primary-700 font-medium">
                      {Math.round(outfit.similarityScore * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-primary-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-600 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Like</span>
                </button>
                <button className="flex-1 bg-secondary-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-secondary-600 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </button>
              </div>

              {/* External Link (if available) */}
              {outfit.source && outfit.source !== 'internal' && (
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>View on Store</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for color conversion
const getColorHex = (colorName) => {
  const colorMap = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#10b981',
    'yellow': '#f59e0b',
    'purple': '#8b5cf6',
    'pink': '#ec4899',
    'black': '#1f2937',
    'white': '#f9fafb',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'brown': '#92400e',
    'orange': '#f97316',
    'navy': '#1e3a8a',
    'beige': '#d6d3d1',
    'khaki': '#a3a3a3',
    'camel': '#d2691e'
  };

  return colorMap[colorName?.toLowerCase()] || '#6b7280';
};

ModalView.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  outfit: PropTypes.object
};

export default ModalView;
