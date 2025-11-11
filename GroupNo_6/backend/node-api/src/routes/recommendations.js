// backend/node-api/src/routes/recommendations.js
const express = require('express');
const { authenticateToken, pool } = require('../middleware/auth');

const router = express.Router();

// Existing pagination recommendations route (unchanged)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const priceRange = req.query.priceRange;
    const gender = req.query.gender;

    // Build WHERE clause dynamically
    const whereClauses = ['name IS NOT NULL', 'image_url IS NOT NULL'];
    const params = [];
    
    // Gender filter
    if (gender && gender !== 'all') {
      params.push(gender);
      whereClauses.push(`(gender = $${params.length} OR gender = 'unisex')`);
    }
    
    // Category filter
    if (category && category !== 'all') {
      params.push(category);
      whereClauses.push(`master_category = $${params.length}`);
    }
    
    // Price range filter
    if (priceRange && priceRange !== 'all') {
      params.push(priceRange);
      whereClauses.push(`price_range = $${params.length}`);
    }
    
    // Add LIMIT and OFFSET
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    params.push(limit, offset);
    
    const query = `
      SELECT 
        id, name, master_category, category, sub_category, 
        gender, base_colour, image_url, tags, price_range, 
        style_score, created_at
      FROM fashion_items
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY style_score DESC, RANDOM()
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await pool.query(query, params);

    // Count query
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) 
      FROM fashion_items 
      WHERE ${whereClauses.join(' AND ')}
    `;
    
    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      items: result.rows.map(item => ({
        id: item.id,
        name: item.name,
        category: item.master_category,
        subcategory: item.category,
        gender: item.gender,
        baseColor: item.base_colour,
        imageUrl: item.image_url,
        tags: item.tags || [],
        priceRange: item.price_range,
        styleScore: parseFloat(item.style_score) || 5.0,
        createdAt: item.created_at
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: error.message 
    });
  }
});

// Helper function to fetch user's quiz history
async function getUserQuizHistory(userId) {
  const query = `
    SELECT aesthetic_profile, answers, created_at
    FROM quiz_results 
    WHERE user_id = $1 AND is_completed = true 
    ORDER BY created_at DESC
    LIMIT 5
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

// Analyze quiz answers (moved from previous implementation)
function analyzeQuizAnswers(answers) {
  const aesthetics = {};
  const allTags = [];

  Object.values(answers).forEach(answer => {
    if (answer.aesthetic) {
      aesthetics[answer.aesthetic] = (aesthetics[answer.aesthetic] || 0) + 1;
    }
    if (answer.tags) {
      allTags.push(...answer.tags);
    }
  });

  const sorted = Object.entries(aesthetics).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] || 'Classic';
  const total = Object.keys(answers).length;
  const score = total > 0 ? Math.round((sorted[0]?.[1] / total) * 100) : 50;

  return {
    dominant,
    score,
    tags: [...new Set(allTags)],
    description: `Your style is ${dominant}. ${allTags.slice(0, 3).join(', ')}.`
  };
}

// Generate personalized recommendations
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { gender, answers, quiz_answers, limit = 12 } = req.body;
    const quizAnswers = answers || quiz_answers;

    if (!gender) {
      return res.status(400).json({ error: 'Gender is required' });
    }

    const userId = req.userId;

    // Analyze user's quiz answers to get aesthetic profile
    const aestheticProfile = quizAnswers ? analyzeQuizAnswers(quizAnswers) : { dominant: 'Classic', tags: [] };

    // Save new quiz result if answers provided
    if (quizAnswers) {
      try {
        await pool.query(
          `INSERT INTO quiz_results (user_id, gender, answers, aesthetic_profile, score, is_completed, created_at)
           VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)`,
          [userId, gender, JSON.stringify(quizAnswers), aestheticProfile.dominant, aestheticProfile.score]
        );
      } catch (err) {
        console.error('Quiz save error:', err);
      }
    }

    // Build SQL query to fetch recommendations filtered by gender, and optionally by tags or aesthetic profile
    const params = [];
    const whereClauses = ['gender = $1 OR gender = \'unisex\''];
    params.push(gender);

    // If there are tags from the aesthetic profile, filter by those tags as well
    if (aestheticProfile.tags && aestheticProfile.tags.length > 0) {
      const tagConditions = aestheticProfile.tags.map((tag, idx) => {
        params.push(tag.toLowerCase());
        return `tags @> ARRAY[$${params.length}]::text[]`;
      });
      whereClauses.push(`(${tagConditions.join(' OR ')})`);
    }

    // Limit param
    params.push(limit);

    const query = `
      SELECT id, name, master_category, category, sub_category, gender, base_colour,
             image_url, tags, price_range, style_score, created_at
      FROM fashion_items
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY style_score DESC, RANDOM()
      LIMIT $${params.length}
    `;

    const result = await pool.query(query, params);
    const recommendations = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      category: item.master_category,
      subcategory: item.category,
      gender: item.gender,
      baseColor: item.base_colour,
      imageUrl: item.image_url,
      tags: item.tags || [],
      priceRange: item.price_range,
      styleScore: parseFloat(item.style_score) || 5.0,
      createdAt: item.created_at
    }));

    res.json({
      recommendations,
      aestheticProfile: aestheticProfile.dominant,
      styleDescription: aestheticProfile.description,
      totalGenerated: recommendations.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});
module.exports = router;