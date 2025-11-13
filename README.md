# URL Shortener with Analytics

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0+-red.svg)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A full-stack URL shortener with comprehensive analytics, showcasing backend development skills including REST API design, database optimization, caching strategies, and data tracking.

---

## 🚀 Features

### Core Functionality
- **URL Shortening**: Generate short, memorable URLs from long URLs
- **Custom Aliases**: Create custom short codes for branded links
- **Redirect Logic**: Fast 301 redirects to original URLs
- **Expiring URLs**: Set expiration dates for temporary links

### Analytics & Tracking
- **Click Tracking**: Real-time click count for each shortened URL
- **Geographical Tracking**: IP-based location tracking (country and city)
- **Referrer Tracking**: Track where clicks are coming from
- **Historical Data**: View click patterns over time
- **Recent Activity**: Monitor the latest clicks on your URLs

### Technical Features
- **Database Indexing**: Optimized MongoDB queries with compound indexes
- **Redis Caching**: Fast URL lookups with Redis cache layer
- **Rate Limiting**: Protect API from abuse with configurable rate limits
- **RESTful API**: Clean, well-documented API endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Security**: Helmet.js for security headers, input validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher) - Optional but recommended

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/AustinSturdivant/URL-Shortener-with-Analytics.git
cd URL-Shortener-with-Analytics
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/url-shortener
REDIS_HOST=localhost
REDIS_PORT=6379
BASE_URL=http://localhost:3000
SHORT_CODE_LENGTH=6
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start MongoDB and Redis**
```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

5. **Run the application**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Shorten URL
Create a shortened URL.

**Endpoint:** `POST /api/shorten`

**Request Body:**
```json
{
  "url": "https://www.example.com/very/long/url",
  "customAlias": "mylink",  // Optional
  "expiresIn": 86400        // Optional, seconds until expiration
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://www.example.com/very/long/url",
    "shortUrl": "http://localhost:3000/mylink",
    "shortCode": "mylink",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit:** 100 requests per 15 minutes per IP

#### 2. Redirect to Original URL
Redirect to the original URL and track analytics.

**Endpoint:** `GET /:shortCode`

**Example:** `GET /mylink`

**Response:** 301 Redirect to original URL

#### 3. Get Analytics
Retrieve analytics for a shortened URL.

**Endpoint:** `GET /api/stats/:shortCode`

**Example:** `GET /api/stats/mylink`

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "mylink",
    "originalUrl": "https://www.example.com/very/long/url",
    "totalClicks": 150,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastAccessed": "2024-01-15T12:30:00.000Z",
    "clicksByCountry": {
      "US": 75,
      "UK": 30,
      "CA": 45
    },
    "clicksByCity": {
      "New York": 40,
      "London": 30,
      "Toronto": 35
    },
    "clicksByDate": {
      "2024-01-15": 50,
      "2024-01-14": 60,
      "2024-01-13": 40
    },
    "recentClicks": [
      {
        "timestamp": "2024-01-15T12:30:00.000Z",
        "country": "US",
        "city": "New York",
        "referer": "https://twitter.com"
      }
    ]
  }
}
```

#### 4. Get All URLs
Retrieve all shortened URLs with pagination.

**Endpoint:** `GET /api/urls`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 100)
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order: asc/desc (default: desc)

**Example:** `GET /api/urls?page=1&limit=20&sortBy=totalClicks&order=desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "shortCode": "mylink",
        "originalUrl": "https://www.example.com/very/long/url",
        "shortUrl": "http://localhost:3000/mylink",
        "totalClicks": 150,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastAccessed": "2024-01-15T12:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUrls": 100,
      "perPage": 20
    }
  }
}
```

#### 5. Health Check
Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:30:00.000Z",
  "uptime": 3600
}
```

## 🏗️ Architecture

### Technology Stack
- **Backend:** Node.js + Express.js
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis
- **Security:** Helmet.js, express-rate-limit
- **Geolocation:** geoip-lite

### Database Schema

**URL Collection:**
```javascript
{
  originalUrl: String (required),
  shortCode: String (required, unique, indexed),
  customAlias: String (optional, unique),
  clicks: [ClickSchema],
  totalClicks: Number (indexed),
  createdAt: Date (indexed),
  lastAccessed: Date,
  expiresAt: Date
}
```

**Click Schema (Embedded):**
```javascript
{
  timestamp: Date,
  ipAddress: String,
  country: String,
  city: String,
  userAgent: String,
  referer: String
}
```

### Indexes
- `shortCode` - Unique index for fast lookups
- `totalClicks` - For sorting popular URLs
- `createdAt` - For time-based queries
- Compound index: `shortCode + createdAt` for efficient filtering

### Caching Strategy
1. **Read-through Cache:** Check Redis first, then MongoDB
2. **Cache Duration:** 1 hour TTL for URL mappings
3. **Cache Invalidation:** No explicit invalidation needed (URLs are immutable)
4. **Fallback:** Application works without Redis

## 🔐 Security Features

- **Rate Limiting:** Prevents API abuse
- **Input Validation:** Validates URLs and custom aliases
- **Helmet.js:** Sets security headers
- **CORS:** Configurable cross-origin requests
- **Environment Variables:** Sensitive data in .env file
- **NoSQL Injection Prevention:** Mongoose schema validation

## 🎯 Use Cases

1. **Marketing Campaigns:** Track link performance across channels
2. **Social Media:** Create short, shareable links
3. **Analytics:** Understand audience geography and behavior
4. **Temporary Links:** Set expiration for time-sensitive content
5. **Branded Links:** Use custom aliases for brand consistency

## 📊 Performance Optimizations

1. **Database Indexing:** O(log n) lookups instead of O(n)
2. **Redis Caching:** Sub-millisecond URL lookups
3. **Async Analytics:** Non-blocking analytics updates
4. **Connection Pooling:** MongoDB connection reuse
5. **Selective Fields:** Only fetch needed data

## 🧪 Testing

```bash
# Test URL shortening
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.example.com"}'

# Test redirection
curl -L http://localhost:3000/abc123

# Test analytics
curl http://localhost:3000/api/stats/abc123

# Test pagination
curl http://localhost:3000/api/urls?page=1&limit=10
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Skills Demonstrated

- **Backend Development:** RESTful API design, Express.js middleware
- **Database Design:** Schema design, indexing strategies, query optimization
- **Caching:** Redis integration, cache strategies
- **Analytics:** Data tracking, aggregation, reporting
- **Security:** Rate limiting, input validation, security headers
- **Error Handling:** Comprehensive error handling and logging
- **Code Organization:** MVC pattern, separation of concerns
- **Documentation:** Clear API documentation, code comments

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

