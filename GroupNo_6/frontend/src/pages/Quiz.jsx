// Quiz.jsx
import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI, apiHelpers } from '../utils/api';
import toast from 'react-hot-toast';
import RecommendationCard from '../components/RecommendationCard';

const TOTAL_QUESTIONS = 12; // hard cap per request
const BASE_FOR_UNISEX = 5; // show these first for unisex, then progressive reveal

const Quiz = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedGender, setSelectedGender] = useState(''); // 'female' | 'male' | 'unisex' ('' -> show selector)
  const [showGenderSelect, setShowGenderSelect] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aesthetic, setAesthetic] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // --------------------------
  // Base (unisex) questions — EXACTLY the base Qs you provided earlier
  // --------------------------
  const baseQuestions = useMemo(() => ([
    {
      id: 'lifestyle',
      text: 'Your ideal weekend morning looks like:',
      type: 'single',
      options: [
        { text: 'Sipping tea on a balcony with a sea breeze', aesthetic: 'Coastal Grandma', tags: ['relaxed', 'natural', 'comfortable'] },
        { text: 'Browsing a local bookstore for poetry', aesthetic: 'Dark Academia', tags: ['intellectual', 'vintage', 'scholarly'] },
        { text: 'Brunch in the city wearing a silky blouse', aesthetic: 'Parisian Chic', tags: ['elegant', 'sophisticated', 'feminine'] },
        { text: 'Workout session followed by a smoothie', aesthetic: 'Athleisure', tags: ['sporty', 'casual', 'active'] }
      ]
    },
    {
      id: 'colors',
      text: 'Which color palette speaks to your soul?',
      type: 'single',
      options: [
        { text: 'Beige, ivory, and warm neutrals', aesthetic: 'Old Money', tags: ['neutral', 'timeless', 'luxury'] },
        { text: 'Black, charcoal, and deep jewel tones', aesthetic: 'Grunge Fashion', tags: ['dark', 'edgy', 'bold'] },
        { text: 'Soft pastels and cream tones', aesthetic: 'Cottagecore', tags: ['soft', 'romantic', 'vintage'] },
        { text: 'Bold brights and neon accents', aesthetic: 'Y2K Revival', tags: ['vibrant', 'fun', 'trendy'] }
      ]
    },
    {
      id: 'inspiration',
      text: 'Your style icon would be:',
      type: 'single',
      options: [
        { text: 'A vintage Hollywood starlet', aesthetic: 'Old Hollywood', tags: ['glamorous', 'classic', 'elegant'] },
        { text: 'A minimalist Scandinavian designer', aesthetic: 'Minimalism', tags: ['clean', 'simple', 'modern'] },
        { text: 'A bohemian artist in Brooklyn', aesthetic: 'Boho Chic', tags: ['artistic', 'free-spirited', 'eclectic'] },
        { text: 'A tech entrepreneur in Silicon Valley', aesthetic: 'Tech Minimalism', tags: ['sleek', 'functional', 'modern'] }
      ]
    },
    {
      id: 'fabric',
      text: 'Your favorite fabric feels like:',
      type: 'single',
      options: [
        { text: 'Luxurious cashmere against your skin', aesthetic: 'Luxury Minimalism', tags: ['luxury', 'soft', 'premium'] },
        { text: 'Crisp cotton that holds its shape', aesthetic: 'Classic Preppy', tags: ['structured', 'clean', 'timeless'] },
        { text: 'Flowing silk that moves with you', aesthetic: 'Romantic Feminine', tags: ['fluid', 'elegant', 'feminine'] },
        { text: 'Comfortable jersey that feels like pajamas', aesthetic: 'Comfort First', tags: ['comfortable', 'casual', 'easy'] }
      ]
    },
    {
      id: 'shopping',
      text: 'When shopping, you gravitate towards:',
      type: 'single',
      options: [
        { text: 'Investment pieces that will last decades', aesthetic: 'Sustainable Fashion', tags: ['timeless', 'quality', 'sustainable'] },
        { text: 'Trending pieces from your favorite influencer', aesthetic: 'Influencer Style', tags: ['trendy', 'social', 'current'] },
        { text: 'Vintage finds with unique stories', aesthetic: 'Vintage Lover', tags: ['unique', 'vintage', 'storytelling'] },
        { text: 'Basics you can mix and match endlessly', aesthetic: 'Capsule Wardrobe', tags: ['versatile', 'practical', 'minimalist'] }
      ]
    }
  ]), []);

  // --------------------------
  // Neutral follow-up questions for unisex path (7 items → total 12)
  // these are gender-agnostic, used only for unisex after the initial 5.
  // --------------------------
  const neutralFollowups = useMemo(() => ([
    {
      id: 'n_follow_1',
      text: 'The perfect outerwear piece is:',
      type: 'single',
      options: [
        { text: 'Oversized knit cardigan', aesthetic: 'Cottagecore', tags: ['cozy','natural'] },
        { text: 'Tailored trench coat', aesthetic: 'Clean Minimalist', tags: ['tailored','sleek'] },
        { text: 'Leather moto jacket', aesthetic: 'Edgy Leather', tags: ['leather','bold'] },
        { text: 'Cropped bomber jacket', aesthetic: 'Streetwear', tags: ['urban','trend'] },
      ]
    },
    {
      id: 'n_follow_2',
      text: 'Your go-to footwear vibe is:',
      type: 'single',
      options: [
        { text: 'White sneakers', aesthetic: 'Sporty Luxe', tags: ['clean','comfortable'] },
        { text: 'Doc Martens or chunky boots', aesthetic: 'E-girl', tags: ['chunky','statement'] },
        { text: 'Ballet flats or slingbacks', aesthetic: 'Parisian Chic', tags: ['elegant','classic'] },
        { text: 'Strappy sandals with gold accents', aesthetic: 'Boho Luxe', tags: ['boho','ornate'] },
      ]
    },
    {
      id: 'n_follow_3',
      text: 'Which bag would you carry?',
      type: 'single',
      options: [
        { text: 'A straw tote with a silk scarf', aesthetic: 'Coastal Grandma', tags: ['beachy','natural'] },
        { text: 'Structured leather satchel', aesthetic: 'Old Money', tags: ['structured','luxury'] },
        { text: 'Micro bag in a bold color', aesthetic: 'Y2K Revival', tags: ['mini','trendy'] },
        { text: 'Quilted crossbody with chain', aesthetic: 'Preppy Chic', tags: ['polished','classic'] },
      ]
    },
    {
      id: 'n_follow_4',
      text: 'Which print are you drawn to?',
      type: 'single',
      options: [
        { text: 'Plaids & tweed', aesthetic: 'Light Academia', tags: ['textured','classic'] },
        { text: 'Florals & ditsy prints', aesthetic: 'Soft Feminine', tags: ['floral','romantic'] },
        { text: 'Bold logos & graphics', aesthetic: 'Streetwear', tags: ['graphic','loud'] },
        { text: 'Solid neutral textures', aesthetic: 'Clean Minimalist', tags: ['simple','versatile'] },
      ]
    },
    {
      id: 'n_follow_5',
      text: 'How do you feel about tailoring?',
      type: 'single',
      options: [
        { text: 'Love sharp tailoring', aesthetic: 'Old Money', tags: ['tailored','polished'] },
        { text: 'Prefer relaxed & comfy', aesthetic: 'Coastal Grandma', tags: ['laidback','cozy'] },
        { text: 'Mix of fitted + oversized', aesthetic: 'Indie Art Girl', tags: ['eclectic','creative'] },
        { text: 'All about statement silhouettes', aesthetic: 'Edgy Leather', tags: ['statement','bold'] },
      ]
    },
    {
      id: 'n_follow_6',
      text: 'Makeup / grooming vibe:',
      type: 'single',
      options: [
        { text: 'Minimal, glowy skin', aesthetic: 'Clean Minimalist', tags: ['minimal','natural'] },
        { text: 'Bold eyeliner / dramatic', aesthetic: 'E-girl', tags: ['dramatic','bold'] },
        { text: 'Soft rosy blushes', aesthetic: 'Soft Feminine', tags: ['soft','rosy'] },
        { text: 'No makeup / natural', aesthetic: 'Coastal Grandma', tags: ['natural','fresh'] },
      ]
    },
    {
      id: 'n_follow_7',
      text: 'Shopping preference:',
      type: 'single',
      options: [
        { text: 'Curated designer pieces', aesthetic: 'Old Money', tags: ['designer','curated'] },
        { text: 'Vintage / thrift finds', aesthetic: 'Indie Art Girl', tags: ['vintage','unique'] },
        { text: 'Fast-fashion trend drops', aesthetic: 'Y2K Revival', tags: ['trendy','affordable'] },
        { text: 'Sustainable / handmade', aesthetic: 'Cottagecore', tags: ['sustainable','handmade'] },
      ]
    },
  ]), []);

  // --------------------------
  // Female questions (12) — copied exactly from your provided content
  // --------------------------
  const femaleQuestions = useMemo(() => ([
    {
      id: 'f_q1',
      text: 'Your ideal Saturday morning looks like…',
      type: 'single',
      options: [
        { text: 'Sipping tea on a balcony with a sea breeze', aesthetic: 'Coastal Grandma' },
        { text: 'Browsing a local bookstore for poetry', aesthetic: 'Dark Academia' },
        { text: 'Brunch in the city wearing a silky blouse', aesthetic: 'Parisian Chic' },
        { text: 'Thrifting for quirky accessories', aesthetic: 'Indie Art Girl' },
      ]
    },
    {
      id: 'f_q2',
      text: 'The colors in your dream wardrobe are…',
      type: 'single',
      options: [
        { text: 'Beige, ivory, and warm neutrals', aesthetic: 'Old Money' },
        { text: 'Black, charcoal, and deep jewel tones', aesthetic: 'Grunge Fashion' },
        { text: 'Pastels, pinks, and creamy whites', aesthetic: 'Soft Feminine' },
        { text: 'Neon, holographic, and bold brights', aesthetic: 'Y2K' },
      ]
    },
    {
      id: 'f_q3',
      text: 'The perfect outerwear piece is…',
      type: 'single',
      options: [
        { text: 'Oversized knit cardigan', aesthetic: 'Cottagecore' },
        { text: 'Tailored trench coat', aesthetic: 'Clean Girl Minimalist' },
        { text: 'Leather moto jacket', aesthetic: 'Edgy Leather & Rock' },
        { text: 'Cropped bomber jacket', aesthetic: 'Streetwear' },
      ]
    },
    {
      id: 'f_q4',
      text: 'Your go-to footwear vibe is…',
      type: 'single',
      options: [
        { text: 'White sneakers', aesthetic: 'Sporty Luxe' },
        { text: 'Doc Martens or chunky boots', aesthetic: 'E-girl' },
        { text: 'Ballet flats or slingbacks', aesthetic: 'Parisian Chic' },
        { text: 'Strappy sandals with gold accents', aesthetic: 'Boho Luxe' },
      ]
    },
    {
      id: 'f_q5',
      text: 'Which bag would you carry?',
      type: 'single',
      options: [
        { text: 'A straw tote with a silk scarf', aesthetic: 'Coastal Grandma' },
        { text: 'Structured leather satchel', aesthetic: 'Old Money' },
        { text: 'Micro bag in a bold color', aesthetic: 'Y2K' },
        { text: 'Quilted crossbody with chain', aesthetic: 'Preppy Chic' },
      ]
    },
    {
      id: 'f_q6',
      text: 'Your favorite season for fashion is…',
      type: 'single',
      options: [
        { text: 'Fall with layered knits', aesthetic: 'Light Academia' },
        { text: 'Summer with linen dresses', aesthetic: 'Coastal Grandma' },
        { text: 'Winter with oversized coats', aesthetic: 'Dark Academia' },
        { text: 'Spring with floral skirts', aesthetic: 'Soft Feminine' },
      ]
    },
    {
      id: 'f_q7',
      text: 'You’re invited to a last-minute party. You wear…',
      type: 'single',
      options: [
        { text: 'Metallic mini skirt and crop top', aesthetic: 'Y2K' },
        { text: 'Silk slip dress with kitten heels', aesthetic: 'Old Money' },
        { text: 'Graphic tee with cargo pants', aesthetic: 'Streetwear' },
        { text: 'Maxi skirt with layered jewelry', aesthetic: 'Boho Luxe' },
      ]
    },
    {
      id: 'f_q8',
      text: 'Which activity excites you the most?',
      type: 'single',
      options: [
        { text: 'Farmers market stroll', aesthetic: 'Cottagecore' },
        { text: 'Rooftop cocktails', aesthetic: 'Parisian Chic' },
        { text: 'Music festival', aesthetic: 'Boho Luxe' },
        { text: 'Urban photography walk', aesthetic: 'Indie Art Girl' },
      ]
    },
    {
      id: 'f_q9',
      text: 'Which print are you drawn to?',
      type: 'single',
      options: [
        { text: 'Pinstripes', aesthetic: 'Preppy Chic' },
        { text: 'Plaid', aesthetic: 'Dark Academia' },
        { text: 'Ditsy floral', aesthetic: 'Cottagecore' },
        { text: 'Abstract graphics', aesthetic: 'Streetwear' },
      ]
    },
    {
      id: 'f_q10',
      text: 'Hair & beauty mood?',
      type: 'single',
      options: [
        { text: 'Sleek bun and minimal makeup', aesthetic: 'Clean Girl Minimalist' },
        { text: 'Messy waves with a bold lip', aesthetic: 'Edgy Leather & Rock' },
        { text: 'Soft curls with blush tones', aesthetic: 'Soft Feminine' },
        { text: 'Space buns and glitter eyeliner', aesthetic: 'E-girl' },
      ]
    },
    {
      id: 'f_q11',
      text: 'Your dream city to live in…',
      type: 'single',
      options: [
        { text: 'Paris', aesthetic: 'Parisian Chic' },
        { text: 'New York', aesthetic: 'Streetwear' },
        { text: 'Florence', aesthetic: 'Old Money' },
        { text: 'Copenhagen', aesthetic: 'Clean Girl Minimalist' },
      ]
    },
    {
      id: 'f_q12',
      text: 'Which fabric makes you feel most “you”?',
      type: 'single',
      options: [
        { text: 'Linen', aesthetic: 'Coastal Grandma' },
        { text: 'Velvet', aesthetic: 'Dark Academia' },
        { text: 'Satin', aesthetic: 'Soft Feminine' },
        { text: 'Leather', aesthetic: 'Edgy Leather & Rock' },
      ]
    }
  ]), []);

  // --------------------------
  // Male questions (12) — copied exactly from your provided content
  // --------------------------
  const maleQuestions = useMemo(() => ([
    {
      id: 'm_q1',
      text: 'Ideal weekend activity?',
      type: 'single',
      options: [
        { text: 'Sailing or golfing', aesthetic: 'Old Money Gentleman' },
        { text: 'Skating with friends', aesthetic: 'Skater Street' },
        { text: 'Attending an indie band gig', aesthetic: 'Rock/Metal Grunge' },
        { text: 'Hiking or surfing', aesthetic: 'Coastal Casual' },
      ]
    },
    {
      id: 'm_q2',
      text: 'Go-to color palette?',
      type: 'single',
      options: [
        { text: 'Navy, beige, and cream', aesthetic: 'Minimalist Neutral Luxe' },
        { text: 'Black, steel grey, and dark green', aesthetic: 'Techwear Futuristic' },
        { text: 'Burgundy, camel, and forest green', aesthetic: 'Dark Academia' },
        { text: 'Bright reds, yellows, and blues', aesthetic: 'Retro 90s Casual' },
      ]
    },
    {
      id: 'm_q3',
      text: 'Preferred outerwear?',
      type: 'single',
      options: [
        { text: 'Double-breasted blazer', aesthetic: 'Old Money Gentleman' },
        { text: 'Puffer jacket', aesthetic: 'Streetwear Hypebeast' },
        { text: 'Denim jacket', aesthetic: 'Retro 90s Casual' },
        { text: 'Long trench coat', aesthetic: 'Light Academia' },
      ]
    },
    {
      id: 'm_q4',
      text: 'Your ideal shoes are…',
      type: 'single',
      options: [
        { text: 'Loafers', aesthetic: 'Old Money Gentleman' },
        { text: 'Chunky sneakers', aesthetic: 'Streetwear Hypebeast' },
        { text: 'Hiking boots', aesthetic: 'Bohemian Traveler' },
        { text: 'Combat boots', aesthetic: 'Rock/Metal Grunge' },
      ]
    },
    {
      id: 'm_q5',
      text: 'Pick a bag:',
      type: 'single',
      options: [
        { text: 'Leather briefcase', aesthetic: 'Business Formal Power' },
        { text: 'Crossbody sling', aesthetic: 'Techwear Futuristic' },
        { text: 'Canvas backpack', aesthetic: 'Bohemian Traveler' },
        { text: 'Belt bag', aesthetic: 'Streetwear Hypebeast' },
      ]
    },
    {
      id: 'm_q6',
      text: 'Favorite season for outfits?',
      type: 'single',
      options: [
        { text: 'Summer linen', aesthetic: 'Coastal Casual' },
        { text: 'Fall layering', aesthetic: 'Dark Academia' },
        { text: 'Winter wool coats', aesthetic: 'Minimalist Neutral Luxe' },
        { text: 'Spring polos', aesthetic: 'Preppy Ivy League' },
      ]
    },
    {
      id: 'm_q7',
      text: 'At a party, you’re wearing…',
      type: 'single',
      options: [
        { text: 'Crisp button-down and trousers', aesthetic: 'Urban Smart Casual' },
        { text: 'Hoodie and cargo pants', aesthetic: 'Streetwear Hypebeast' },
        { text: 'Graphic tee and ripped jeans', aesthetic: 'Rock/Metal Grunge' },
        { text: 'Linen shirt and chinos', aesthetic: 'Coastal Casual' },
      ]
    },
    {
      id: 'm_q8',
      text: 'Which print do you gravitate toward?',
      type: 'single',
      options: [
        { text: 'Pinstripes', aesthetic: 'Business Formal Power' },
        { text: 'Plaid', aesthetic: 'Light Academia' },
        { text: 'Tie-dye', aesthetic: 'Bohemian Traveler' },
        { text: 'Camouflage', aesthetic: 'Techwear Futuristic' },
      ]
    },
    {
      id: 'm_q9',
      text: 'Hairstyle vibe?',
      type: 'single',
      options: [
        { text: 'Slick back', aesthetic: 'Old Money Gentleman' },
        { text: 'Messy waves', aesthetic: 'Rock/Metal Grunge' },
        { text: 'Clean fade', aesthetic: 'Streetwear Hypebeast' },
        { text: 'Shoulder-length natural', aesthetic: 'Bohemian Traveler' },
      ]
    },
    {
      id: 'm_q10',
      text: 'Dream city to live in…',
      type: 'single',
      options: [
        { text: 'Milan', aesthetic: 'Old Money Gentleman' },
        { text: 'Tokyo', aesthetic: 'Techwear Futuristic' },
        { text: 'New York', aesthetic: 'Urban Smart Casual' },
        { text: 'Los Angeles', aesthetic: 'Skater Street' },
      ]
    },
    {
      id: 'm_q11',
      text: 'Favorite fabric?',
      type: 'single',
      options: [
        { text: 'Linen', aesthetic: 'Coastal Casual' },
        { text: 'Tweed', aesthetic: 'Dark Academia' },
        { text: 'Leather', aesthetic: 'Rock/Metal Grunge' },
        { text: 'Wool', aesthetic: 'Minimalist Neutral Luxe' },
      ]
    },
    {
      id: 'm_q12',
      text: 'Your watch preference?',
      type: 'single',
      options: [
        { text: 'Gold classic analog', aesthetic: 'Old Money Gentleman' },
        { text: 'Digital sports watch', aesthetic: 'Sporty Athleisure' },
        { text: 'Minimalist silver', aesthetic: 'Minimalist Neutral Luxe' },
        { text: 'Smartwatch with tech features', aesthetic: 'Techwear Futuristic' },
      ]
    }
  ]), []);

  // --------------------------
  // Pick the right set depending on selection.
  // For unisex: show base (5) first, then neutralFollowups to reach TOTAL_QUESTIONS (progressive reveal)
  // For male/female: show the 12 gender-specific set (or slice to TOTAL_QUESTIONS if necessary)
  // --------------------------
  const getQuestions = () => {
    if (selectedGender === 'female') {
      return femaleQuestions.slice(0, TOTAL_QUESTIONS);
    }
    if (selectedGender === 'male') {
      return maleQuestions.slice(0, TOTAL_QUESTIONS);
    }
    // unisex: base first, then neutral followups up to TOTAL_QUESTIONS
    const followNeeded = TOTAL_QUESTIONS - Math.min(BASE_FOR_UNISEX, baseQuestions.length);
    const followSlice = neutralFollowups.slice(0, followNeeded);
    return [...baseQuestions.slice(0, BASE_FOR_UNISEX), ...followSlice];
  };

  const questions = getQuestions();
  const currentQ = questions[currentQuestion];

  // --------------------------
  // Handlers (kept same behavior / API / UX)
  // --------------------------
  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);

    try {
      // Keep original aiAPI call shape intact
      const response = await aiAPI.generateRecommendations({
        user_id: user?.id,
        gender: selectedGender,
        quiz_answers: answers,
        limit: 12
      });

      const { recommendations: recs, aesthetic_profile } = response.data || {};

      setRecommendations(recs || []);
      setAesthetic(aesthetic_profile || determineAesthetic());
      setShowResults(true);
      setQuizCompleted(true);

      toast.success('Your personalized recommendations are ready!');
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error(apiHelpers.getErrorMessage ? apiHelpers.getErrorMessage(error) : 'Failed to get recommendations');

      // Fallback
      const fallbackAesthetic = determineAesthetic();
      setAesthetic(fallbackAesthetic);
      setShowResults(true);
      setQuizCompleted(true);
      setRecommendations([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const determineAesthetic = () => {
    const counts = {};
    Object.values(answers).forEach(ans => {
      const key = ans?.aesthetic;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'Classic Chic';
  };

  const resetQuiz = () => {
    setSelectedGender('');
    setShowGenderSelect(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setAesthetic('');
    setRecommendations([]);
    setQuizCompleted(false);
  };

  // --------------------------
  // Render (kept original UI/UX)
  // --------------------------
  if (showGenderSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Let's start with your style preferences
              </h2>
              <p className="text-xl text-gray-600">
                Which style category interests you most?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                { value: 'female', label: 'Feminine Styles', emoji: '👗', desc: 'Dresses, blouses, feminine cuts' },
                { value: 'male', label: 'Masculine Styles', emoji: '👔', desc: 'Suits, shirts, masculine fits' },
                { value: 'unisex', label: 'Gender-Neutral', emoji: '👕', desc: 'Unisex and universal styles' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedGender(option.value);
                    setShowGenderSelect(false);
                    setCurrentQuestion(0);
                    setAnswers({});
                    setShowResults(false);
                  }}
                  className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-200"
                >
                  <div className="text-6xl mb-4">{option.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{option.label}</h3>
                  <p className="text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent mb-4">
              Your Style: {aesthetic}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Based on your quiz answers, we've curated personalized recommendations that match your unique aesthetic.
            </p>
          </div>

          {recommendations.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Your Personalized Recommendations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {recommendations.map((outfit, index) => (
                  <RecommendationCard
                    key={`quiz-rec-${index}`}
                    outfit={outfit}
                    onLike={() => {}}
                    onSave={() => {}}
                    onView={() => {}}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                Your recommendations are being generated. Visit the recommendations page to see them!
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/recommendations'}
              className="bg-primary-500 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 transition-colors duration-200"
            >
              View All Recommendations
            </button>
            <button
              onClick={resetQuiz}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // quiz UI
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const hasAnswer = currentQ && answers[currentQ.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {currentQ?.text}
            </h2>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-4 mb-8">
            {currentQ?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQ.id, option)}
                className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                  answers[currentQ.id]?.text === option.text
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{option.text}</span>
                  {answers[currentQ.id]?.text === option.text && (
                    <CheckCircle2 className="w-6 h-6 text-primary-500" />
                  )}
                </div>
                {option.aesthetic && (
                  <div className="mt-2 text-sm text-primary-600 font-medium">
                    Aesthetic: {option.aesthetic}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                onClick={submitQuiz}
                disabled={!hasAnswer || isSubmitting}
                className="flex items-center space-x-2 bg-primary-500 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Sparkles className="w-5 h-5" />
                <span>{isSubmitting ? 'Getting Results...' : 'Get My Recommendations'}</span>
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!hasAnswer}
                className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-gray-600">
          <p className="text-sm">
            This quiz helps us understand your style preferences to provide personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
