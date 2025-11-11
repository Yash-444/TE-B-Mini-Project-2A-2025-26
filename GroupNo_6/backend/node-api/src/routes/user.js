const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireOwnership, pool } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/me (mounted with /api/user)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.profile_picture, u.gender, u.date_of_birth, u.is_active, u.created_at, u.updated_at,
        COALESCE(COUNT(DISTINCT qr.id), 0) AS quiz_count,
        COALESCE(SUM(CASE WHEN uo.is_saved THEN 1 ELSE 0 END), 0) AS saved_outfits,
        COALESCE(SUM(CASE WHEN uo.is_liked THEN 1 ELSE 0 END), 0) AS liked_outfits
      FROM users u
      LEFT JOIN quiz_results qr ON u.id = qr.user_id
      LEFT JOIN user_outfits uo ON u.id = uo.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.profile_picture, u.gender, u.date_of_birth, u.is_active, u.created_at, u.updated_at
      `,
      [userId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];

    return res.json({
      id: u.id,
      email: u.email,
      firstname: u.first_name,
      lastname: u.last_name,
      profilePicture: u.profile_picture,
      gender: u.gender,
      dateOfBirth: u.date_of_birth,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      stats: {
        quizCount: parseInt(u.quiz_count, 10),
        savedOutfits: parseInt(u.saved_outfits, 10),
        likedOutfits: parseInt(u.liked_outfits, 10),
      },
    });
  } catch (e) {
    console.error('GET /api/user/me error:', e);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/user/:id (ownership enforced)
router.get('/:id', [authenticateToken, requireOwnership], async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.profile_picture, u.gender, u.date_of_birth, u.is_active, u.created_at, u.updated_at,
        COALESCE(COUNT(DISTINCT qr.id), 0) AS quiz_count,
        COALESCE(SUM(CASE WHEN uo.is_saved THEN 1 ELSE 0 END), 0) AS saved_outfits,
        COALESCE(SUM(CASE WHEN uo.is_liked THEN 1 ELSE 0 END), 0) AS liked_outfits
      FROM users u
      LEFT JOIN quiz_results qr ON u.id = qr.user_id
      LEFT JOIN user_outfits uo ON u.id = uo.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.profile_picture, u.gender, u.date_of_birth, u.is_active, u.created_at, u.updated_at
      `,
      [id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];

    return res.json({
      id: u.id,
      email: u.email,
      firstname: u.first_name,
      lastname: u.last_name,
      profilePicture: u.profile_picture,
      gender: u.gender,
      dateOfBirth: u.date_of_birth,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      stats: {
        quizCount: parseInt(u.quiz_count, 10),
        savedOutfits: parseInt(u.saved_outfits, 10),
        likedOutfits: parseInt(u.liked_outfits, 10),
      },
    });
  } catch (e) {
    console.error('GET /api/user/:id error:', e);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/user/:id/profile (ownership enforced)
router.put(
  '/:id/profile',
  [
    authenticateToken,
    requireOwnership,
    body('firstname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('profilePicture').optional({ checkFalsy: true }).isURL().withMessage('Profile picture must be a valid URL'),
    body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Please check your input',
          message: errors.array()[0].msg,
          details: errors.array(),
        });
      }

      const userId = req.params.id;
      const { firstname, lastname, profilePicture, gender } = req.body;

      // Check if at least one field is being updated
      if (!firstname && !lastname && !profilePicture && !gender) {
        return res.status(400).json({ 
          error: 'No updates provided',
          message: 'Please provide at least one field to update'
        });
      }

      const updates = [];
      const values = [];
      let i = 1;

      if (firstname !== undefined && firstname !== '') {
        updates.push(`first_name = $${i++}`);
        values.push(firstname);
      }
      if (lastname !== undefined && lastname !== '') {
        updates.push(`last_name = $${i++}`);
        values.push(lastname);
      }
      if (profilePicture !== undefined && profilePicture !== '') {
        updates.push(`profile_picture = $${i++}`);
        values.push(profilePicture);
      }
      if (gender !== undefined && gender !== '') {
        updates.push(`gender = $${i++}`);
        values.push(gender);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          error: 'No valid fields to update',
          message: 'Please fill in the fields you want to update'
        });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${i}
        RETURNING id, email, first_name, last_name, profile_picture, gender, updated_at
      `;

      const { rows } = await pool.query(query, values);
      if (!rows[0]) return res.status(404).json({ error: 'User not found' });

      const u = rows[0];
      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: u.id,
          email: u.email,
          firstname: u.first_name,
          lastname: u.last_name,
          profilePicture: u.profile_picture,
          gender: u.gender,
          updatedAt: u.updated_at,
        },
      });
    } catch (e) {
      console.error('Update profile error:', e);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// GET /api/user/:id/history (ownership enforced)
router.get('/:id/history', [authenticateToken, requireOwnership], async (req, res) => {
  try {
    const userId = req.params.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const quizHistoryQ = pool.query(
      `
      SELECT id, gender, answers, aesthetic_profile, created_at
      FROM quiz_results
      WHERE user_id = $1 AND COALESCE(is_completed, true) = true
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    );

    const outfitHistoryQ = pool.query(
      `
      SELECT 
        uo.id, uo.name, uo.description, uo.is_liked, uo.is_saved, uo.created_at,
        sh.action_type AS interaction_type, sh.created_at AS interaction_date
      FROM user_outfits uo
      LEFT JOIN style_history sh ON uo.id = sh.outfit_id
      WHERE uo.user_id = $1
      ORDER BY uo.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    );

    const [quizHistory, outfitHistory] = await Promise.all([quizHistoryQ, outfitHistoryQ]);

    return res.json({
      quizHistory: quizHistory.rows.map((q) => ({
        id: q.id,
        gender: q.gender,
        answers: q.answers,
        aestheticProfile: q.aesthetic_profile,
        createdAt: q.created_at,
      })),
      outfitHistory: outfitHistory.rows.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        isLiked: o.is_liked,
        isSaved: o.is_saved,
        createdAt: o.created_at,
        interactionType: o.interaction_type,
        interactionDate: o.interaction_date,
      })),
      pagination: {
        page,
        limit,
        hasMore: quizHistory.rows.length === limit || outfitHistory.rows.length === limit,
      },
    });
  } catch (e) {
    console.error('Get history error:', e);
    return res.status(500).json({ error: 'Failed to get history' });
  }
});

// Additional helper route to get latest quiz gender for a user (optional)
router.get('/:id/quiz-gender', [authenticateToken, requireOwnership], async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await pool.query(
      `
      SELECT gender
      FROM quiz_results
      WHERE user_id = $1 AND is_completed = true
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No completed quiz found for user' });
    }
    return res.json({ gender: result.rows[0].gender });
  } catch (e) {
    console.error('Get quiz gender error:', e);
    return res.status(500).json({ error: 'Failed to get quiz gender' });
  }
});

module.exports = router;