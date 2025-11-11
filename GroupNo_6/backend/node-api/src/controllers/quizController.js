const pool = require('../config/database');

const submitQuiz = async (req, res) => {
  try {
    const { gender, answers, aestheticProfile } = req.body;
    const result = await pool.query(
      `INSERT INTO quiz_results (user_id, gender, answers, aesthetic_profile, is_completed, completed_at)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
       RETURNING id, aesthetic_profile, completed_at`,
      [req.user.id, gender, JSON.stringify(answers), aestheticProfile]
    );
    res.json({
      message: 'Quiz submitted successfully',
      result: {
        id: result.rows[0].id,
        aestheticProfile: result.rows[0].aesthetic_profile,
        completedAt: result.rows[0].completed_at
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, gender, aesthetic_profile, completed_at FROM quiz_results WHERE user_id = $1 ORDER BY completed_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
};

module.exports = {
  submitQuiz,
  getQuizHistory
};
