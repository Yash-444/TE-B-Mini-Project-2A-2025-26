const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, pool } = require('../middleware/auth');

const router = express.Router();

// Create a new outfit
router.post('/', [
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Outfit name is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description, items, occasion, season } = req.body;

    const result = await pool.query(
      `INSERT INTO user_outfits (user_id, name, description, items, occasion, season, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id, name, description, items, occasion, season, created_at`,
      [req.userId, name, description || '', JSON.stringify(items), occasion, season]
    );

    // Record creation in style history
    await pool.query(
      `INSERT INTO style_history (user_id, action_type, outfit_id, created_at)
       VALUES ($1, 'created', $2, CURRENT_TIMESTAMP)`,
      [req.userId, result.rows[0].id]
    );

    res.status(201).json({
      message: 'Outfit created successfully',
      outfit: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        items: result.rows[0].items,
        occasion: result.rows[0].occasion,
        season: result.rows[0].season,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Create outfit error:', error);
    res.status(500).json({ error: 'Failed to create outfit' });
  }
});

// Get user's outfits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter; // 'liked', 'saved', 'all'

    let query = `
      SELECT id, name, description, items, occasion, season, is_liked, is_saved, 
             rating, created_at, updated_at
      FROM user_outfits 
      WHERE user_id = $1
    `;
    const queryParams = [req.userId];
    let paramCount = 2;

    if (filter === 'liked') {
      query += ` AND is_liked = true`;
    } else if (filter === 'saved') {
      query += ` AND is_saved = true`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM user_outfits WHERE user_id = $1';
    const countParams = [req.userId];

    if (filter === 'liked') {
      countQuery += ' AND is_liked = true';
    } else if (filter === 'saved') {
      countQuery += ' AND is_saved = true';
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      outfits: result.rows.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        description: outfit.description,
        items: outfit.items,
        occasion: outfit.occasion,
        season: outfit.season,
        isLiked: outfit.is_liked,
        isSaved: outfit.is_saved,
        rating: outfit.rating,
        createdAt: outfit.created_at,
        updatedAt: outfit.updated_at
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
    console.error('Get outfits error:', error);
    res.status(500).json({ error: 'Failed to get outfits' });
  }
});

// Get specific outfit
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const outfitId = req.params.id;

    const result = await pool.query(
      `SELECT id, name, description, items, occasion, season, is_liked, is_saved, 
              rating, created_at, updated_at
       FROM user_outfits 
       WHERE id = $1 AND user_id = $2`,
      [outfitId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const outfit = result.rows[0];
    
    // Record view in style history
    await pool.query(
      `INSERT INTO style_history (user_id, action_type, outfit_id, created_at)
       VALUES ($1, 'viewed', $2, CURRENT_TIMESTAMP)`,
      [req.userId, outfitId]
    );

    res.json({
      id: outfit.id,
      name: outfit.name,
      description: outfit.description,
      items: outfit.items,
      occasion: outfit.occasion,
      season: outfit.season,
      isLiked: outfit.is_liked,
      isSaved: outfit.is_saved,
      rating: outfit.rating,
      createdAt: outfit.created_at,
      updatedAt: outfit.updated_at
    });
  } catch (error) {
    console.error('Get outfit error:', error);
    res.status(500).json({ error: 'Failed to get outfit' });
  }
});

// Update outfit
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().notEmpty(),
  body('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const outfitId = req.params.id;
    const { name, description, rating } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (rating !== undefined) {
      updates.push(`rating = $${paramCount}`);
      values.push(rating);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(outfitId, req.userId);

    const query = `
      UPDATE user_outfits 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, name, description, rating, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    res.json({
      message: 'Outfit updated successfully',
      outfit: result.rows[0]
    });
  } catch (error) {
    console.error('Update outfit error:', error);
    res.status(500).json({ error: 'Failed to update outfit' });
  }
});

// Delete outfit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const outfitId = req.params.id;

    const result = await pool.query(
      'DELETE FROM user_outfits WHERE id = $1 AND user_id = $2 RETURNING id',
      [outfitId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    res.json({
      message: 'Outfit deleted successfully',
      outfitId
    });
  } catch (error) {
    console.error('Delete outfit error:', error);
    res.status(500).json({ error: 'Failed to delete outfit' });
  }
});

module.exports = router;
