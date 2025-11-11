import React, { useState } from 'react';
import { Heart, Save, Eye, Star, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';

const RecommendationCard = ({ 
  outfit, 
  onLike, 
  onSave, 
  onView, 
  isLiked = false, 
  isSaved = false 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState({ like: false, save: false });

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleAction = async (action, handler) => {
    setActionLoading(prev => ({ ...prev, [action]: true }));
    try {
      await handler(outfit);
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const formatPrice = (priceRange) => {
    const priceMap = {
      'low': '₹',
      'mid': '₹₹',
      'high': '₹₹₹',
      'premium': '₹₹₹₹'
    };
    return priceMap[priceRange?.toLowerCase()] || '$$';
  };

  const getPlaceholderImage = () => {
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&h=600&q=80`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Image Container */}
      <div className="relative w-full h-80 overflow-hidden bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )}
        
        <img
          src={imageError ? getPlaceholderImage() : outfit.imageUrl || outfit.image_url || getPlaceholderImage()}
          alt={outfit.name || 'Fashion item'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onView(outfit)}
            className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-200 mx-1"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

       

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
          {formatPrice(outfit.priceRange || outfit.price_range)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and Category */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-1">
            {outfit.name || 'Fashion Item'}
          </h3>
          <p className="text-sm text-gray-500">
            {outfit.category || outfit.subcategory || 'Fashion'}
            {outfit.gender && ` • ${outfit.gender}`}
          </p>
        </div>

        {/* Tags */}
        {outfit.tags && outfit.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {outfit.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {outfit.tags.length > 3 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{outfit.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Color */}
        {outfit.baseColor || outfit.base_color ? (
          <div className="mb-4 flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: getColorHex(outfit.baseColor || outfit.base_color) }}
            ></div>
            <span className="text-sm text-gray-600 capitalize">
              {outfit.baseColor || outfit.base_color}
            </span>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => handleAction('like', onLike)}
            disabled={actionLoading.like}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
            } ${actionLoading.like ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {actionLoading.like ? '...' : isLiked ? 'Liked' : 'Like'}
            </span>
          </button>

          <button
            onClick={() => handleAction('save', onSave)}
            disabled={actionLoading.save}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isSaved
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600'
            } ${actionLoading.save ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {actionLoading.save ? '...' : isSaved ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>

        {/* Similarity Score (if available) */}
        {outfit.similarityScore && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              {Math.round(outfit.similarityScore * 100)}% match
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert color names to hex (basic implementation)
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

RecommendationCard.propTypes = {
  outfit: PropTypes.object.isRequired,
  onLike: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  isLiked: PropTypes.bool,
  isSaved: PropTypes.bool
};

export default RecommendationCard;
