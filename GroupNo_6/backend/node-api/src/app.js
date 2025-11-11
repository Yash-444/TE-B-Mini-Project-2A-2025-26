const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');


const authRoutes = require('./routes/auth');
const recommendationRoutes = require('./routes/recommendations');
const likesRoutes = require('./routes/likes');
const savesRoutes = require('./routes/saves');
const outfitRoutes = require('./routes/outfits');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

const app = express();

//app.use('/images', express.static(path.join(__dirname, '../../data/raw/images')));
app.use('/images', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  next();
}, express.static(path.join(__dirname, '../../data/raw/images')));

// Serve dataset images
const imagesPath = path.join(__dirname, '../../../data/raw/images');
console.log('Serving images from:', imagesPath);
app.use('/images', express.static(imagesPath));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// CORS configuration - MUST be first!
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware - before other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-fashion-backend'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/saves', savesRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details || error.message
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;