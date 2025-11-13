require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const urlRoutes = require('./routes/urlRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Connect to Redis (optional - app will work without it)
connectRedis().catch(err => console.log('Running without Redis cache'));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for the demo frontend
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Trust proxy to get correct IP addresses
app.set('trust proxy', true);

// API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'URL Shortener with Analytics API',
    version: '1.0.0',
    endpoints: {
      shorten: 'POST /api/shorten - Create a shortened URL',
      stats: 'GET /api/stats/:shortCode - Get analytics for a URL',
      urls: 'GET /api/urls - Get all URLs (paginated)',
      redirect: 'GET /:shortCode - Redirect to original URL',
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/', urlRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
