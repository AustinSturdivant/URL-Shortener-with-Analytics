# Project Structure

```
URL-Shortener-with-Analytics/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection configuration
│   │   └── redis.js          # Redis connection configuration
│   ├── controllers/
│   │   └── urlController.js  # Business logic for URL operations
│   ├── middleware/
│   │   ├── errorHandler.js   # Global error handling middleware
│   │   └── rateLimiter.js    # Rate limiting middleware
│   ├── models/
│   │   └── Url.js           # Mongoose schema for URLs
│   ├── routes/
│   │   └── urlRoutes.js     # API route definitions
│   ├── utils/
│   │   ├── geoUtils.js      # Geographical utilities
│   │   └── urlUtils.js      # URL validation and generation
│   └── server.js            # Main application entry point
├── .env.example             # Example environment variables
├── .gitignore              # Git ignore rules
├── API_EXAMPLES.md         # API usage examples
├── package.json            # Project dependencies
├── PROJECT_STRUCTURE.md    # This file
└── README.md               # Main documentation

```

## File Descriptions

### Configuration Files

#### `src/config/database.js`
MongoDB connection setup with error handling and connection pooling.

#### `src/config/redis.js`
Redis client configuration for caching layer. Gracefully handles Redis unavailability.

### Models

#### `src/models/Url.js`
Mongoose schema defining:
- URL document structure
- Click tracking sub-documents
- Database indexes for performance
- Validation rules

**Key Indexes:**
- `shortCode` - Unique index for fast lookups
- `totalClicks` + `createdAt` - Compound index for analytics
- `customAlias` - Sparse unique index for branded links

### Controllers

#### `src/controllers/urlController.js`
Contains all business logic:
- `shortenUrl` - Create shortened URLs with collision detection
- `redirectUrl` - Handle redirects with analytics tracking
- `getAnalytics` - Aggregate and return analytics data
- `getAllUrls` - Paginated list of all URLs

### Middleware

#### `src/middleware/rateLimiter.js`
Express rate limiting:
- `shortenLimiter` - Stricter limits for URL creation
- `apiLimiter` - General API rate limiting

#### `src/middleware/errorHandler.js`
Global error handling middleware that:
- Logs errors
- Returns formatted error responses
- Includes stack traces in development

### Routes

#### `src/routes/urlRoutes.js`
API endpoint definitions:
- POST `/api/shorten` - Create short URL
- GET `/api/stats/:shortCode` - Get analytics
- GET `/api/urls` - List all URLs
- GET `/:shortCode` - Redirect to original URL

### Utilities

#### `src/utils/urlUtils.js`
Helper functions:
- `generateShortCode` - Generate random base62 codes
- `isValidUrl` - URL validation
- `isValidAlias` - Custom alias validation

#### `src/utils/geoUtils.js`
Geographical utilities:
- `getLocationFromIP` - Extract country/city from IP address
- Handles localhost and private IPs gracefully

### Main Application

#### `src/server.js`
Application entry point:
- Express app setup
- Middleware configuration
- Database connections
- Route mounting
- Server initialization

## Code Organization Principles

### 1. Separation of Concerns
- **Routes:** Define endpoints and middleware
- **Controllers:** Contain business logic
- **Models:** Define data structure
- **Middleware:** Handle cross-cutting concerns
- **Utils:** Reusable helper functions

### 2. Modularity
Each file has a single responsibility and clear exports

### 3. Scalability
Structure supports easy addition of:
- New endpoints
- New analytics features
- Additional middleware
- Alternative data sources

### 4. Testability
Clean separation makes unit testing straightforward:
- Controllers can be tested independently
- Utils are pure functions
- Middleware can be tested in isolation

## Data Flow

### URL Shortening
```
Client → Route → Rate Limiter → Controller → Model → Database
                                           → Redis Cache
```

### URL Redirect
```
Client → Route → Controller → Redis Cache → Model → Database
                           → Analytics Update (async)
                           → Redirect Response
```

### Analytics Retrieval
```
Client → Route → Rate Limiter → Controller → Model → Database
                                           → Data Aggregation
```

## Environment Variables

All configuration is externalized via environment variables:
- Server configuration (PORT, NODE_ENV)
- Database URLs (MONGODB_URI)
- Cache settings (REDIS_HOST, REDIS_PORT)
- Application settings (BASE_URL, SHORT_CODE_LENGTH)
- Rate limits (RATE_LIMIT_*)

## Security Layers

1. **Input Validation:** URL and alias validation
2. **Rate Limiting:** Prevent abuse
3. **Helmet:** Security headers
4. **CORS:** Cross-origin control
5. **Mongoose:** NoSQL injection prevention

## Performance Optimizations

1. **Database Indexes:** Fast queries
2. **Redis Caching:** Reduce database load
3. **Async Analytics:** Non-blocking updates
4. **Selective Fields:** Only fetch needed data
5. **Connection Pooling:** Reuse connections
