const express = require('express');
const { body } = require('express-validator');
const { register, login, logout } = require('../controllers/authController');

const router = express.Router();

// Register endpoint
router.post(
  '/register',
  [
    body('firstname').trim().notEmpty().withMessage('First name is required'),
    body('lastname').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  register
);

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// Logout endpoint
router.post('/logout', logout);

module.exports = router;