const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, profile_picture, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Attach user to request object
    req.user = userResult.rows[0];
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.status(500).json({ error: 'Authentication error' });
  }
};

const requireOwnership = (req, res, next) => {
  const resourceUserId = req.params.id || req.params.userId;
  
  if (!resourceUserId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  if (req.userId !== resourceUserId) {
    return res.status(403).json({ error: 'Access denied - not authorized for this resource' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireOwnership,
  pool
};
