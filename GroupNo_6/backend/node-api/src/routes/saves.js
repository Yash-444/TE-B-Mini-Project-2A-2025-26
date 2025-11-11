const express = require('express');
const { authenticateToken, pool } = require('../middleware/auth');

const router = express.Router();

// Get user's saved outfits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT uo.id, uo.name, uo.description, uo.items, uo.created_at
       FROM user_outfits uo
       WHERE uo.user_id = $1 AND uo.is_saved = true
       ORDER BY uo.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_outfits WHERE user_id = $1 AND is_saved = true',
      [req.userId]
    );

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      savedOutfits: result.rows.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        description: outfit.description,
        items: outfit.items,
        createdAt: outfit.created_at
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
    console.error('Get saved outfits error:', error);
    res.status(500).json({ error: 'Failed to get saved outfits' });
  }
});

// Save an outfit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { outfitId, name, description, items } = req.body;

    if (!outfitId && !items) {
      return res.status(400).json({ error: 'Either outfit ID or items array is required' });
    }

    // Check if already saved
    const existingResult = await pool.query(
      'SELECT id FROM user_outfits WHERE user_id = $1 AND id = $2 AND is_saved = true',
      [req.userId, outfitId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Outfit already saved',
        outfitId 
      });
    }

    // Create new saved outfit record
    const result = await pool.query(
      `INSERT INTO user_outfits (user_id, name, description, items, is_saved, created_at)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
       RETURNING id, name, created_at`,
      [req.userId, name || 'Saved Outfit', description || '', JSON.stringify(items || [])]
    );

    // Record the interaction in style history
    await pool.query(
      `INSERT INTO style_history (user_id, action_type, outfit_id, created_at)
       VALUES ($1, 'saved', $2, CURRENT_TIMESTAMP)`,
      [req.userId, result.rows[0].id]
    );

    res.status(201).json({
      message: 'Outfit saved successfully',
      outfit: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Save outfit error:', error);
    res.status(500).json({ error: 'Failed to save outfit' });
  }
});

// Unsave an outfit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const outfitId = req.params.id;

    // Check if the outfit exists and belongs to the user
    const checkResult = await pool.query(
      'SELECT id FROM user_outfits WHERE user_id = $1 AND id = $2',
      [req.userId, outfitId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    // Delete related history entries first (to handle foreign key constraint)
    await pool.query(
      'DELETE FROM style_history WHERE outfit_id = $1',
      [outfitId]
    );

    // Now delete the outfit
    await pool.query(
      'DELETE FROM user_outfits WHERE user_id = $1 AND id = $2',
      [req.userId, outfitId]
    );

    res.json({
      message: 'Outfit removed successfully',
      outfitId
    });
  } catch (error) {
    console.error('Unsave outfit error:', error);
    res.status(500).json({ error: 'Failed to remove outfit', details: error.message });
  }
});

module.exports = router;