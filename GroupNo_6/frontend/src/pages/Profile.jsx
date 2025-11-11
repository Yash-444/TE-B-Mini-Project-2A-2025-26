import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { savesAPI, likesAPI } from '../utils/api';
import { Heart, Bookmark, History, User as UserIcon, Trash2 } from 'lucide-react';

const BASE = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Profile() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState({ quizHistory: [], outfitHistory: [], pagination: { page: 1, limit: 10, hasMore: false } });
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [likedOutfits, setLikedOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const res = await axios.get(`${BASE}/api/user/me`, { headers: { ...authHeader() } });
    return res.data;
  };

  const fetchHistory = async (page = 1, limit = 10) => {
    const id = localStorage.getItem('userId') || localStorage.getItem('user_id');
    if (!id) throw new Error('Missing userId in localStorage');
    const res = await axios.get(`${BASE}/api/user/${id}/history`, {
      params: { page, limit },
      headers: { ...authHeader() },
    });
    return res.data;
  };

  const fetchSavedOutfits = async () => {
    const res = await savesAPI.getSavedOutfits();
    return res.data.savedOutfits || [];
  };

  const fetchLikedOutfits = async () => {
    const res = await likesAPI.getLikedOutfits();
    return res.data.likedOutfits || [];
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please login.');

        const me = await fetchProfile();
        setProfile(me);

        const id = localStorage.getItem('userId') || localStorage.getItem('user_id');
        if (!id && me.id) {
          localStorage.setItem('userId', me.id);
        }

        const hist = await fetchHistory(1, 10);
        setHistory(hist);

        // Load saved and liked outfits
        const [saved, liked] = await Promise.all([
          fetchSavedOutfits(),
          fetchLikedOutfits()
        ]);
        setSavedOutfits(saved);
        setLikedOutfits(liked);
      } catch (e) {
        console.error('Profile load error:', e);
        toast.error(e?.response?.data?.error || e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdateProfile = async (updates) => {
    try {
      const id = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (!id) throw new Error('Missing userId in localStorage');
      
      const res = await axios.put(`${BASE}/api/user/${id}/profile`, updates, {
        headers: { ...authHeader() },
      });
      
      setProfile((prev) => ({
        ...prev,
        ...res.data.user,
        firstname: res.data.user.firstname,
        lastname: res.data.user.lastname,
        profilePicture: res.data.user.profilePicture,
        gender: res.data.user.gender,
      }));
      
      // Update user in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        ...res.data.user
      }));
      
      toast.success('Profile updated successfully!');
    } catch (e) {
      console.error('Update profile error:', e);
      const errorMessage = e?.response?.data?.message || e?.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
    }
  };

  const handleRemoveSaved = async (outfitId) => {
    try {
      await savesAPI.unsaveOutfit(outfitId);
      setSavedOutfits(prev => prev.filter(item => item.id !== outfitId));
      toast.success('Removed from saved');
    } catch (e) {
      console.error('Remove saved error:', e);
      toast.error('Failed to remove item');
    }
  };

  const handleRemoveLiked = async (outfitId) => {
    try {
      await likesAPI.unlikeOutfit(outfitId);
      setLikedOutfits(prev => prev.filter(item => item.id !== outfitId));
      toast.success('Removed from liked');
    } catch (e) {
      console.error('Remove liked error:', e);
      toast.error('Failed to remove item');
    }
  };

  const loadMoreHistory = async () => {
    try {
      const nextPage = (history?.pagination?.page || 1) + 1;
      const res = await fetchHistory(nextPage, history?.pagination?.limit || 10);
      setHistory((prev) => ({
        quizHistory: [...(prev.quizHistory || []), ...(res.quizHistory || [])],
        outfitHistory: [...(prev.outfitHistory || []), ...(res.outfitHistory || [])],
        pagination: res.pagination,
      }));
    } catch (e) {
      console.error('Load more history error:', e);
      toast.error(e?.response?.data?.error || 'Failed to load more history');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent mb-2">
            My Profile
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 border-b border-gray-200">
          <TabButton active={activeTab === 'profile'} icon={UserIcon} href="?tab=profile">
            Profile
          </TabButton>
          <TabButton active={activeTab === 'saved'} icon={Bookmark} href="?tab=saved">
            Saved ({savedOutfits.length})
          </TabButton>
          <TabButton active={activeTab === 'liked'} icon={Heart} href="?tab=liked">
            Liked ({likedOutfits.length})
          </TabButton>
          <TabButton active={activeTab === 'history'} icon={History} href="?tab=history">
            History
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'profile' && (
            <ProfileTab profile={profile} onUpdate={handleUpdateProfile} />
          )}
          
          {activeTab === 'saved' && (
            <SavedTab outfits={savedOutfits} onRemove={handleRemoveSaved} />
          )}
          
          {activeTab === 'liked' && (
            <LikedTab outfits={likedOutfits} onRemove={handleRemoveLiked} />
          )}
          
          {activeTab === 'history' && (
            <HistoryTab 
              history={history} 
              onLoadMore={loadMoreHistory} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, href, children }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
        active
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </a>
  );
}

function ProfileTab({ profile, onUpdate }) {
  const [form, setForm] = useState({
    firstname: profile.firstname || '',
    lastname: profile.lastname || '',
    profilePicture: profile.profilePicture || '',
    gender: profile.gender || '',
  });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(profile.profilePicture || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    if (name === 'profilePicture') {
      setPreviewImage(value);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max for base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for direct storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        setForm(s => ({ ...s, profilePicture: base64Image }));
        setPreviewImage(base64Image);
        toast.success('Image selected! Click "Save Changes" to update.');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.firstname || !form.lastname) {
      toast.error('Please fill in first name and last name');
      return;
    }

    if (form.gender && !['male', 'female'].includes(form.gender)) {
      toast.error('Please select a valid gender');
      return;
    }

    await onUpdate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 mb-8">
        {previewImage ? (
          <img src={previewImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary-200" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center text-3xl font-bold text-primary-700">
            {profile.firstname?.[0]}{profile.lastname?.[0]}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile.firstname} {profile.lastname}</h2>
          <p className="text-gray-600">{profile.email}</p>
        </div>
      </div>

      {profile.stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Quizzes Taken" value={profile.stats.quizCount} />
          <StatCard label="Saved Outfits" value={profile.stats.savedOutfits} />
          <StatCard label="Liked Items" value={profile.stats.likedOutfits} />
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              name="firstname"
              placeholder="Enter first name"
              value={form.firstname}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              name="lastname"
              placeholder="Enter last name"
              value={form.lastname}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
          
          

          {/* Or URL Input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1"> Enter image URL</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              name="profilePicture"
              placeholder="https://example.com/profile.jpg"
              value={form.profilePicture}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

function SavedTab({ outfits, onRemove }) {
  if (outfits.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved outfits yet</h3>
        <p className="text-gray-600">Start saving outfits from your recommendations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Saved Outfits</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outfits.map((outfit) => {
          const itemData = Array.isArray(outfit.items) ? outfit.items[0] : outfit.items;
          const imageUrl = itemData?.imageUrl || itemData?.image_url || 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400';
          
          return (
            <div key={outfit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={imageUrl} 
                alt={outfit.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{outfit.name}</h4>
                  <button
                    onClick={() => onRemove(outfit.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {outfit.description && (
                  <p className="text-sm text-gray-600 mb-3">{outfit.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  Saved {new Date(outfit.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LikedTab({ outfits, onRemove }) {
  if (outfits.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No liked items yet</h3>
        <p className="text-gray-600">Start liking items from your recommendations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Liked Items</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outfits.map((outfit) => {
          const itemData = Array.isArray(outfit.items) ? outfit.items[0] : outfit.items;
          const imageUrl = itemData?.imageUrl || itemData?.image_url || 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400';
          
          return (
            <div key={outfit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={imageUrl} 
                alt={outfit.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{outfit.name}</h4>
                  <button
                    onClick={() => onRemove(outfit.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {outfit.description && (
                  <p className="text-sm text-gray-600 mb-3">{outfit.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  Liked {new Date(outfit.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryTab({ history, onLoadMore }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Activity History</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-4 text-gray-700">Quiz History</h4>
          <div className="space-y-3">
            {(history?.quizHistory || []).length === 0 ? (
              <p className="text-gray-500 text-sm">No quiz history yet</p>
            ) : (
              history.quizHistory.map((q) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-medium text-gray-900">Aesthetic: {q.aestheticProfile || '—'}</div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {q.createdAt && new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4 text-gray-700">Outfit Interactions</h4>
          <div className="space-y-3">
            {(history?.outfitHistory || []).length === 0 ? (
              <p className="text-gray-500 text-sm">No outfit history yet</p>
            ) : (
              history.outfitHistory.map((o) => (
                <div key={o.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-medium text-gray-900">{o.name || 'Outfit'}</div>
                  <div className="text-sm text-gray-600">
                    Action: {o.interactionType || (o.isLiked ? 'liked' : o.isSaved ? 'saved' : 'viewed')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {o.createdAt && new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {history?.pagination?.hasMore && (
        <div className="text-center">
          <button 
            onClick={onLoadMore} 
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value ?? 0}</div>
    </div>
  );
}