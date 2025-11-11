import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Plus, Search, Grid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { savesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Closet = () => {
  const { user, isAuthenticated } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedItems();
    }
  }, [isAuthenticated]);

  const loadSavedItems = async () => {
    setLoading(true);
    try {
      const response = await savesAPI.getSavedOutfits();
      setSavedItems(response.data.savedOutfits || []);
    } catch (error) {
      console.error('Error loading saved items:', error);
      toast.error('Failed to load saved items');
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await savesAPI.unsaveOutfit(itemId);
      setSavedItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item removed from closet');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const filteredItems = savedItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.items?.some(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterBy === 'all' || item.occasion?.toLowerCase() === filterBy.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8">Please sign in to view your virtual closet</p>
          <button className="bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your virtual closet...</p>
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
            My Virtual Closet
          </h1>
          <p className="text-xl text-gray-600">
            Your saved outfits and favorite fashion pieces
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your closet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Occasions</option>
                <option value="work">Work</option>
                <option value="casual">Casual</option>
                <option value="evening">Evening</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{filteredItems.length} items</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {savedItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
              <Plus className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your closet is empty</h3>
            <p className="text-gray-600 mb-8">Start saving outfits you love from your recommendations</p>
            <a 
              href="/recommendations"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Browse Recommendations
            </a>
          </div>
        )}

        {/* Saved Items */}
        {filteredItems.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => {
              const itemData = Array.isArray(item.items) ? item.items[0] : item.items;
              const imageUrl = itemData?.imageUrl || itemData?.image_url || 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400';
              
              return (
                <div key={item.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-w-4 aspect-h-3">
                        <img 
                          src={imageUrl} 
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}
                        
                        {itemData?.tags && (
                          <div className="mb-3">
                            {itemData.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                            {itemData?.category || 'Fashion'}
                          </span>
                          <span className="text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img 
                        src={imageUrl} 
                        alt={item.name}
                        className="w-24 h-24 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}
                            <div className="flex items-center space-x-2">
                              <span className="bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded-full">
                                {itemData?.category || 'Fashion'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {savedItems.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items match your search or filter.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear search and filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Closet;