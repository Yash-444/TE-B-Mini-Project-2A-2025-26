import React, { useState } from 'react';

const quizQuestions = [
  {
    question: "What colors do you prefer in your living space?",
    options: ["Purple", "Neutral tones", "Wood finishes", "Bright whites"]
  },
  {
    question: "Which style resonates with you the most?",
    options: ["Classic", "Modern", "Industrial", "Bohemian"]
  },
  {
    question: "What’s more important: comfort or style?",
    options: ["Comfort", "Style", "Both equally"]
  },
  {
    question: "How do you prefer your furniture shapes?",
    options: ["Curvy & soft", "Sharp & angular", "Minimalist & sleek", "Eclectic & varied"]
  },
  {
    question: "Your budget range is?",
    options: ["Less than $500", "$500 - $1500", "$1500 - $3000", "Premium"]
  }
];

const recommendedStyles = {
  Purple: ["Modern Living Room", "Art Chair"],
  Neutral: ["Classic Dining Set", "Wooden Shelf"],
  Wood: ["Rustic Coffee Table", "Armchair"],
  Bright: ["Minimalist Sofa", "Glass Table"],
  Classic: ["Classic Armchair", "Elegant Shelf"],
  Modern: ["Modern Sofa", "Coffee Table"],
  Industrial: ["Metal Shelf", "Concrete Table"],
  Bohemian: ["Woven Chair", "Vintage Shelf"],
  Comfort: ["Plush Sofa", "Cushioned Chair"],
  Style: ["Designer Chair", "Stylish Table"],
  Both: ["Balanced Set", "Modern Classic"],
  Curvy: ["Round Table", "Soft Sofa"],
  Sharp: ["Angular Desk", "Sculptured Chair"],
  Minimalist: ["Simple Stool", "Clean Lines Table"],
  Eclectic: ["Mix & Match Chair", "Unique Shelf"],
  Low: ["Affordable Set"],
  Mid: ["Mid-range Collection"],
  High: ["Premium Collection"],
  Premium: ["Luxury Sofa", "Designer Collection"]
};

function StyleQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const currentQuestion = quizQuestions[step];

  const handleAnswer = (option) => {
    setAnswers([...answers, option]);
    setStep(step + 1);
  };

  const getRecommendations = () => {
    // Simple map: collect recommendations based on chosen answers
    const recs = new Set();
    answers.forEach(answer => {
      const key = Object.keys(recommendedStyles).find(k => k.toLowerCase().startsWith(answer.toLowerCase().substring(0,3)));
      if (recommendedStyles[answer]) {
        recommendedStyles[answer].forEach(item => recs.add(item));
      }
    });
    return Array.from(recs);
  };

  if (step >= quizQuestions.length) {
    const recommendations = getRecommendations();
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Your Style Recommendations</h1>
        {recommendations.length === 0 ? (
          <p>No recommendations found. Please try the quiz again!</p>
        ) : (
          <ul className="list-disc ml-6 space-y-2 text-lg">
            {recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        )}
        <button
          className="mt-6 px-6 py-2 bg-purple-700 text-white rounded"
          onClick={() => { setStep(0); setAnswers([]); }}
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Find Your Style!</h2>
      <div className="text-xl mb-4 font-medium">{currentQuestion.question}</div>
      <div className="flex flex-col gap-4">
        {currentQuestion.options.map(option => (
          <button
            key={option}
            className="bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-900 font-semibold py-3 rounded transition"
            onClick={() => handleAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StyleQuiz;
