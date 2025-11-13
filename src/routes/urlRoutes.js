const express = require('express');
const router = express.Router();
const {
  shortenUrl,
  redirectUrl,
  getAnalytics,
  getAllUrls,
} = require('../controllers/urlController');
const { shortenLimiter, apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/shorten
 * @desc    Create a shortened URL
 * @access  Public (rate limited)
 */
router.post('/api/shorten', shortenLimiter, shortenUrl);

/**
 * @route   GET /api/urls
 * @desc    Get all shortened URLs with pagination
 * @access  Public (rate limited)
 */
router.get('/api/urls', apiLimiter, getAllUrls);

/**
 * @route   GET /api/stats/:shortCode
 * @desc    Get analytics for a shortened URL
 * @access  Public (rate limited)
 */
router.get('/api/stats/:shortCode', apiLimiter, getAnalytics);

/**
 * @route   GET /:shortCode
 * @desc    Redirect to original URL
 * @access  Public
 */
router.get('/:shortCode', redirectUrl);

module.exports = router;
