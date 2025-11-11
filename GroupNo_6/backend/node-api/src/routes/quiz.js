const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Mock quiz data storage
let quizResults = [];

// Submit quiz answers
router.post('/submit', authenticateToken, [
  body('gender').notEmpty().withMessage('Gender is required'),
  body('answers').isObject().withMessage('Answers must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gender, answers } = req.body;
    const userId = req.user.userId;

    // Calculate aesthetic based on answers
    const aesthetic = calculateAesthetic(answers);
    const score = Math.floor(Math.random() * 20) + 80; // 80-99%

    const quizResult = {
      id: quizResults.length + 1,
      userId,
      gender,
      answers,
      aesthetic,
      score,
      completedAt: new Date().toISOString(),
      isCompleted: true
    };

    quizResults.push(quizResult);

    res.status(201).json({
      message: 'Quiz submitted successfully',
      result: {
        id: quizResult.id,
        aesthetic: quizResult.aesthetic,
        score: quizResult.score,
        completedAt: quizResult.completedAt
      }
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz history for user (for Styling History page)
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userQuizzes = quizResults
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.json({
      quizzes: userQuizzes.map(q => ({
        id: q.id,
        aesthetic: q.aesthetic,
        completedAt: q.completedAt,
        answers: q.answers
      }))
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// Calculate aesthetic from answers
function calculateAesthetic(answers) {
  const styleAnswer = answers['6']; // style aesthetic question
  
  if (styleAnswer) {
    if (styleAnswer.toLowerCase().includes('classic')) return 'Classic & Timeless';
    if (styleAnswer.toLowerCase().includes('minimalist')) return 'Modern Minimalist';
    if (styleAnswer.toLowerCase().includes('bohemian')) return 'Bohemian & Free-spirited';
    if (styleAnswer.toLowerCase().includes('edgy')) return 'Edgy & Alternative';
    if (styleAnswer.toLowerCase().includes('romantic')) return 'Romantic & Feminine';
    if (styleAnswer.toLowerCase().includes('streetwear')) return 'Streetwear & Urban';
    if (styleAnswer.toLowerCase().includes('vintage')) return 'Vintage & Retro';
    if (styleAnswer.toLowerCase().includes('preppy')) return 'Preppy & Polished';
  }
  
  return 'Classic & Timeless';
}

module.exports = router;
