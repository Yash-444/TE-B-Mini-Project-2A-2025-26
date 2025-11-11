import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Save, Eye, MoreHorizontal, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { recommendationAPI, likesAPI, savesAPI, apiHelpers } from '../utils/api';
import toast from 'react-hot-toast';
import RecommendationCard from '../components/RecommendationCard';
import ModalView from '../components/ModalView';

const Recommendations = () => {
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
     gender: 'all'
  });
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load initial recommendations
  useEffect(() => {
    if (isAuthenticated) {
      loadRecommendations(true);
    }
  }, [isAuthenticated, filters]);

  const loadRecommendations = useCallback(async (reset = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 12,
        ...filters
      };

      const response = await recommendationAPI.getRecommendations(params);
      const { items, pagination } = response.data;

      if (reset) {
        setRecommendations(items);
        setPage(1);
      } else {
        setRecommendations(prev => [...prev, ...items]);
      }
      
      setHasMore(pagination.hasNext);
      if (!reset) {
        setPage(prev => prev + 1);
      }
      
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(apiHelpers.getErrorMessage(err));
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [loading, page, filters]);

  const handleLike = async (outfit) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like outfits');
      return;
    }

    try {
      await likesAPI.likeOutfit({
        outfitId: outfit.id,
        name: outfit.name,
        description: `Liked outfit: ${outfit.name}`,
        items: [outfit]
      });

      toast.success('Outfit liked!');
      
      // Update local state
      setRecommendations(prev => 
        prev.map(item => 
          item.id === outfit.id 
            ? { ...item, isLiked: true }
            : item
        )
      );
    } catch (err) {
      console.error('Error liking outfit:', err);
      toast.error(apiHelpers.getErrorMessage(err));
    }
  };

  const handleSave = async (outfit) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save outfits');
      return;
    }

    try {
      await savesAPI.saveOutfit({
        outfitId: outfit.id,
        name: outfit.name,
        description: `Saved outfit: ${outfit.name}`,
        items: [outfit]
      });

      toast.success('Outfit saved to your closet!');
      
      // Update local state
      setRecommendations(prev => 
        prev.map(item => 
          item.id === outfit.id 
            ? { ...item, isSaved: true }
            : item
        )
      );
    } catch (err) {
      console.error('Error saving outfit:', err);
      toast.error(apiHelpers.getErrorMessage(err));
    }
  };

  const handleView = (outfit) => {
    setSelectedOutfit(outfit);
    setShowModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadRecommendations(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to see recommendations</h2>
          <p className="text-gray-600">Please sign in to view your personalized fashion recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent mb-4">
            Your Personalized Recommendations
          </h1>
          <p className="text-xl text-gray-600">
            Curated just for your unique style aesthetic
          </p>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Categories</option>
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Personal Care">Personal Care</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Prices</option>
                <option value="low">Budget Friendly (₹)</option>
                <option value="mid">Mid Range (₹₹)</option>
                <option value="high">Premium (₹₹₹₹)</option>
                <option value="premium">Luxury (₹₹₹₹₹)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.gender || 'all'}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Genders</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="unisex">Unisex</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => loadRecommendations(true)}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendations Grid */}
        {recommendations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {recommendations.map((outfit, index) => (
                <RecommendationCard
                  key={`${outfit.id}-${index}`}
                  outfit={outfit}
                  onLike={handleLike}
                  onSave={handleSave}
                  onView={handleView}
                  isLiked={outfit.isLiked}
                  isSaved={outfit.isSaved}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-primary-500 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Loading...' : 'Show More'}
                </button>
              </div>
            )}
          </>
        ) : loading ? (
          /* Loading State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-80 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-6">
              Take our style quiz to get personalized fashion recommendations!
            </p>
            <button
              onClick={() => window.location.href = '/quiz'}
              className="bg-primary-500 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-600 transition-colors duration-200"
            >
              Take Style Quiz
            </button>
          </div>
        )}

        {/* Modal for outfit details */}
        <ModalView
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          outfit={selectedOutfit}
        />
      </div>
    </div>
  );
};

export default Recommendations;

