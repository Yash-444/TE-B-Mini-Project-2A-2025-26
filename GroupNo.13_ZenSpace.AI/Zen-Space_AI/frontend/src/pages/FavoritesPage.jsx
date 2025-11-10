import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase'; // Adjust path depending on your folder structure
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const appId = 'default-flipbook-app';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState(null);

  // Listen for Authentication state changes and get userId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore collection for current user likes
  useEffect(() => {
    if (!userId) {
      setFavorites([]); // Clear favorites if no user
      return;
    }
    const favRef = collection(db, `artifacts/${appId}/users/${userId}/liked_designs`);
    const unsubscribe = onSnapshot(favRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setFavorites(items);
    });
    return () => unsubscribe();
  }, [userId]);

  // Remove a favorite design for current user
  const removeFavorite = async (id) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/liked_designs`, id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-gray-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-6">💜 My Favorites</h1>
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">You haven't added any favorites yet.</p>
            <p className="text-gray-400 mt-2">Start browsing our catalog!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
            {favorites.map(item => (
              <div key={item.id} className="bg-white border p-6 rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col items-center">
                <img src={item.imagePath} alt={item.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                <div className="font-bold text-lg text-center mb-3">{item.title}</div>
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Remove
                  </button>
                  {item.modelUrl && (
                    <a
                      href={item.modelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-center transition"
                    >
                      View 3D
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
