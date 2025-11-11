const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, gender, date_of_birth, profile_picture, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstname: user.first_name,
      lastname: user.last_name,
      gender: user.gender,
      dateOfBirth: user.date_of_birth,
      profilePicture: user.profile_picture,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstname, lastname, gender, dateOfBirth } = req.body;
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, gender, date_of_birth`,
      [firstname, lastname, gender, dateOfBirth, req.user.id]
    );
    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.first_name,
        lastname: user.last_name,
        gender: user.gender,
        dateOfBirth: user.date_of_birth
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
