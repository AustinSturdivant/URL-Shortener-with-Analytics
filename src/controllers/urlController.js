const Url = require('../models/Url');
const { generateShortCode, isValidUrl, isValidAlias } = require('../utils/urlUtils');
const { getLocationFromIP } = require('../utils/geoUtils');
const { getRedisClient } = require('../config/redis');

/**
 * Create a shortened URL
 */
const shortenUrl = async (req, res) => {
  try {
    const { url, customAlias, expiresIn } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check for custom alias
    let shortCode;
    if (customAlias) {
      if (!isValidAlias(customAlias)) {
        return res.status(400).json({ 
          error: 'Invalid custom alias. Use 3-20 alphanumeric characters, hyphens, or underscores.' 
        });
      }

      // Check if custom alias already exists
      const existingUrl = await Url.findOne({ 
        $or: [{ shortCode: customAlias }, { customAlias: customAlias }] 
      });
      
      if (existingUrl) {
        return res.status(409).json({ error: 'Custom alias already in use' });
      }

      shortCode = customAlias;
    } else {
      // Generate a unique short code
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        shortCode = generateShortCode(parseInt(process.env.SHORT_CODE_LENGTH) || 6);
        const existing = await Url.findOne({ shortCode });
        
        if (!existing) break;
        attempts++;
      }

      if (attempts === maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique short code' });
      }
    }

    // Create URL document
    const urlDoc = new Url({
      originalUrl: url,
      shortCode,
      customAlias: customAlias || undefined,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
    });

    await urlDoc.save();

    // Cache in Redis
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.setEx(
          `url:${shortCode}`,
          3600, // Cache for 1 hour
          url
        );
      } catch (redisErr) {
        console.error('Redis cache error:', redisErr);
      }
    }

    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    res.status(201).json({
      success: true,
      data: {
        originalUrl: url,
        shortUrl,
        shortCode,
        createdAt: urlDoc.createdAt,
        ...(urlDoc.expiresAt && { expiresAt: urlDoc.expiresAt }),
      },
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
};

/**
 * Redirect to original URL and track analytics
 */
const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Try to get from Redis cache first
    const redisClient = getRedisClient();
    let originalUrl = null;
    
    if (redisClient) {
      try {
        originalUrl = await redisClient.get(`url:${shortCode}`);
      } catch (redisErr) {
        console.error('Redis get error:', redisErr);
      }
    }

    // If not in cache, get from database
    let urlDoc;
    if (!originalUrl) {
      urlDoc = await Url.findOne({ shortCode });
      
      if (!urlDoc) {
        return res.status(404).json({ error: 'Short URL not found' });
      }

      // Check if expired
      if (urlDoc.expiresAt && urlDoc.expiresAt < new Date()) {
        return res.status(410).json({ error: 'This short URL has expired' });
      }

      originalUrl = urlDoc.originalUrl;

      // Cache in Redis
      if (redisClient) {
        try {
          await redisClient.setEx(`url:${shortCode}`, 3600, originalUrl);
        } catch (redisErr) {
          console.error('Redis cache error:', redisErr);
        }
      }
    } else {
      // Still need to get the document for analytics
      urlDoc = await Url.findOne({ shortCode });
    }

    // Track analytics
    if (urlDoc) {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const location = getLocationFromIP(ipAddress);

      const clickData = {
        timestamp: new Date(),
        ipAddress,
        country: location.country,
        city: location.city,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'] || req.headers['referrer'],
      };

      // Update analytics asynchronously
      Url.findOneAndUpdate(
        { shortCode },
        {
          $push: { clicks: clickData },
          $inc: { totalClicks: 1 },
          $set: { lastAccessed: new Date() },
        }
      ).exec().catch(err => console.error('Error updating analytics:', err));
    }

    // Redirect to original URL
    res.redirect(301, originalUrl);
  } catch (error) {
    console.error('Error redirecting URL:', error);
    res.status(500).json({ error: 'Failed to redirect' });
  }
};

/**
 * Get analytics for a shortened URL
 */
const getAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Aggregate analytics data
    const clicksByCountry = {};
    const clicksByCity = {};
    const clicksByDate = {};

    urlDoc.clicks.forEach(click => {
      // Count by country
      clicksByCountry[click.country] = (clicksByCountry[click.country] || 0) + 1;

      // Count by city
      clicksByCity[click.city] = (clicksByCity[click.city] || 0) + 1;

      // Count by date
      const date = click.timestamp.toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    });

    // Get recent clicks (last 10)
    const recentClicks = urlDoc.clicks
      .slice(-10)
      .reverse()
      .map(click => ({
        timestamp: click.timestamp,
        country: click.country,
        city: click.city,
        referer: click.referer,
      }));

    res.json({
      success: true,
      data: {
        shortCode: urlDoc.shortCode,
        originalUrl: urlDoc.originalUrl,
        totalClicks: urlDoc.totalClicks,
        createdAt: urlDoc.createdAt,
        lastAccessed: urlDoc.lastAccessed,
        clicksByCountry,
        clicksByCity,
        clicksByDate,
        recentClicks,
      },
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

/**
 * Get all URLs (for dashboard/admin)
 */
const getAllUrls = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const urls = await Url.find()
      .select('-clicks') // Exclude detailed clicks for performance
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Url.countDocuments();

    res.json({
      success: true,
      data: {
        urls: urls.map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
          totalClicks: url.totalClicks,
          createdAt: url.createdAt,
          lastAccessed: url.lastAccessed,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUrls: total,
          perPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error getting URLs:', error);
    res.status(500).json({ error: 'Failed to get URLs' });
  }
};

module.exports = {
  shortenUrl,
  redirectUrl,
  getAnalytics,
  getAllUrls,
};
