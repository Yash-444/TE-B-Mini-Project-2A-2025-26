import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

import img1 from '../designs/chastity-cortijo-R-w5Q-4Mqm0-unsplash.jpg';
import img2 from '../designs/collov-home-design--aDGbdTsBZg-unsplash.jpg';
import img3 from '../designs/francesca-tosolini-qnSTxcs0EEs-unsplash.jpg';
import img4 from '../designs/jason-briscoe-GliaHAJ3_5A-unsplash.jpg';
import img5 from '../designs/kelly-sikkema-Pvse_0mSm6Y-unsplash.jpg';
import img6 from '../designs/nathan-fertig-FBXuXp57eM0-unsplash.jpg';
import img7 from '../designs/sonnie-hiles-DhFHtkECn7Q-unsplash.jpg';
import img8 from '../designs/stephen-owen-rjjAKAp0KSw-unsplash.jpg';
import img9 from '../designs/virender-singh-hE0nmTffKtM-unsplash.jpg';

const USER_IMAGE_PATHS = [img1, img2, img3, img4, img5, img6, img7, img8, img9];
const appId = 'default-flipbook-app';

function DesignFlipbook() {
  const designIdeas = useMemo(() =>
    USER_IMAGE_PATHS.map((img, index) => {
      const style = index % 3 === 0 ? 'Classic' : index % 3 === 1 ? 'Industrial' : 'Modern';
      const room = index % 4 === 0 ? 'Bedroom' : index % 4 === 1 ? 'Kitchen' : index % 4 === 2 ? 'Living Room' : 'Office';
      return {
        id: String(index + 1),
        title: `${style} ${room} Design ${index + 1}`,
        image: img,
        description: `A unique space showcasing the elegance of ${style} design in a comfortable ${room} setting.`
      };
    }), []
  );

  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const totalDesigns = designIdeas.length;
  const currentIdea = designIdeas[currentPage];
  const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User signed in:', user.uid);
        setUserId(user.uid);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          console.warn('Failed to sign in anonymously or with token', e);
          setUserId(crypto.randomUUID()); // fallback id
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [initialAuthToken]);

  useEffect(() => {
    if (!userId || !currentIdea || !isAuthReady) return;
    const likeRef = doc(db, 'artifacts', appId, 'users', userId, 'liked_designs', currentIdea.id);

    const unsubscribe = onSnapshot(likeRef, (docSnap) => {
      const likedStatus = docSnap.exists();
      console.log(`Like status for design ${currentIdea.id}:`, likedStatus);
      setIsLiked(likedStatus);
    });
    return () => unsubscribe();
  }, [userId, currentIdea, isAuthReady]);

  const toggleLike = useCallback(async () => {
    if (!userId || !currentIdea) return;
    setIsLiking(true);
    const designId = currentIdea.id;
    const likeRef = doc(db, 'artifacts', appId, 'users', userId, 'liked_designs', designId);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        console.log(`Unliked design ${designId}`);
      } else {
        await setDoc(likeRef, {
          isLiked: true,
          userId,
          title: currentIdea.title,
          imagePath: currentIdea.image,
          timestamp: new Date(),
        });
        console.log(`Liked design ${designId}`);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [userId, currentIdea, isLiked]);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalDesigns - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

  const fallbackImage = (title) =>
    `https://placehold.co/800x600/6D28D9/ffffff?text=${encodeURIComponent(title || 'Design+Preview')}`;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 rounded-lg shadow-xl bg-white flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-gray-700">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (totalDesigns === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-700 p-8 rounded-lg shadow-xl bg-white">No designs available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold text-gray-900 text-center">
            Interior Design Flipbook
          </h1>
          {userId && (
            <p className="text-center text-xs text-gray-500 mt-1">
              User ID: <span className="font-mono text-xs text-purple-600">{userId}</span>
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative aspect-video lg:aspect-square">
            <img
              src={currentIdea.image}
              alt={currentIdea.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImage(currentIdea.title);
              }}
              className="w-full h-full object-cover transition-opacity duration-500"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {currentPage + 1} / {totalDesigns}
            </div>
          </div>
          <div className="p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentIdea.title}</h2>
              <span className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                {currentIdea.title.split(' ')[0]} Style
              </span>
              <p className="text-gray-600 leading-relaxed mb-6">{currentIdea.description}</p>
            </div>
            <div className="mt-6">
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={toggleLike}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all shadow-md ${
                    isLiked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  } ${!isAuthReady || isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isAuthReady || isLiking}
                >
                  {isLiking ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className={`w-6 h-6 ${isLiked ? 'fill-white' : 'fill-none stroke-current'}`}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )}
                  <span>{isLiking ? 'Saving...' : isLiked ? 'Liked!' : 'Like Design'}</span>
                </button>
              </div>
              <div className="flex justify-between space-x-3">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="w-full py-3 px-6 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalDesigns - 1}
                  className="w-full py-3 px-6 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Jump to:</h3>
          <div className="flex overflow-x-auto space-x-3 pb-2">
            {designIdeas.map((idea, index) => (
              <button
                key={idea.id}
                onClick={() => setCurrentPage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all border-2 ${
                  index === currentPage
                    ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-1'
                    : 'border-gray-200 hover:border-gray-400 opacity-70'
                }`}
              >
                <img
                  src={idea.image}
                  className="w-full h-full object-cover"
                  alt={`Thumbnail for ${idea.title}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImage('Thumb');
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignFlipbook;
