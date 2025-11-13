# System Architecture

## High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└─────┬───────┘
      │
      │ HTTP/HTTPS
      │
┌─────▼──────────────────────────────────────────────┐
│              Express.js Server                     │
│  ┌──────────────────────────────────────────────┐  │
│  │           Middleware Layer                   │  │
│  │  • Helmet (Security Headers)                 │  │
│  │  • CORS                                      │  │
│  │  • Morgan (Logging)                          │  │
│  │  • Rate Limiting                             │  │
│  │  • Body Parser                               │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │           Routes Layer                       │  │
│  │  • POST /api/shorten                         │  │
│  │  • GET /:shortCode                           │  │
│  │  • GET /api/stats/:shortCode                 │  │
│  │  • GET /api/urls                             │  │
│  │  • GET /health                               │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │        Controllers Layer                     │  │
│  │  • URL Shortening Logic                      │  │
│  │  • Redirect Logic                            │  │
│  │  • Analytics Aggregation                     │  │
│  │  • Validation                                │  │
│  └──────────────────────────────────────────────┘  │
└────────┬─────────────────────────┬─────────────────┘
         │                         │
         │                         │
    ┌────▼─────┐            ┌──────▼──────┐
    │  Redis   │            │  MongoDB    │
    │  Cache   │            │  Database   │
    └──────────┘            └─────────────┘
```

## Request Flow

### 1. URL Shortening Flow
```
Client Request (POST /api/shorten)
    ↓
Rate Limiter (100 req/15min)
    ↓
URL Validation
    ↓
Generate/Validate Short Code
    ↓
Save to MongoDB
    ↓
Cache in Redis (TTL: 1h)
    ↓
Return Short URL
```

### 2. Redirect Flow
```
Client Request (GET /:shortCode)
    ↓
Check Redis Cache
    ↓
Cache Hit?
    ├── Yes → Get URL from Redis
    └── No  → Get URL from MongoDB → Cache in Redis
    ↓
Update Analytics (Async)
    ├── IP → Location
    ├── Timestamp
    ├── Referrer
    └── User Agent
    ↓
301 Redirect to Original URL
```

### 3. Analytics Flow
```
Client Request (GET /api/stats/:shortCode)
    ↓
Rate Limiter (300 req/15min)
    ↓
Query MongoDB
    ↓
Aggregate Data
    ├── Total Clicks
    ├── Clicks by Country
    ├── Clicks by City
    ├── Clicks by Date
    └── Recent Clicks
    ↓
Return JSON Response
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                 │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Routes   │→ │ Controllers │→ │  Middleware  │ │
│  └────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
                    ↓           ↓
        ┌───────────┘           └───────────┐
        ↓                                   ↓
┌──────────────┐                    ┌──────────────┐
│ Cache Layer  │                    │  Data Layer  │
│   (Redis)    │                    │  (MongoDB)   │
├──────────────┤                    ├──────────────┤
│ • Key-Value  │                    │ • Documents  │
│ • TTL: 1h    │                    │ • Indexes    │
│ • Fallback   │                    │ • Validation │
└──────────────┘                    └──────────────┘
        ↓                                   ↓
┌──────────────────────────────────────────────────┐
│              Network/Storage Layer               │
└──────────────────────────────────────────────────┘
```

## Database Schema Architecture

```
┌────────────────────────────────────────────┐
│            Url Collection                  │
├────────────────────────────────────────────┤
│ _id: ObjectId                              │
│ originalUrl: String (required)             │
│ shortCode: String (unique, indexed)        │
│ customAlias: String (unique, sparse)       │
│ totalClicks: Number (indexed)              │
│ createdAt: Date (indexed)                  │
│ lastAccessed: Date                         │
│ expiresAt: Date                            │
│ clicks: [ClickSchema]                      │
│   ├── timestamp: Date                      │
│   ├── ipAddress: String                    │
│   ├── country: String                      │
│   ├── city: String                         │
│   ├── userAgent: String                    │
│   └── referer: String                      │
└────────────────────────────────────────────┘

Indexes:
• shortCode (unique)
• totalClicks + createdAt (compound)
• customAlias (sparse unique)
• createdAt
```

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                    src/                             │
├─────────────────────────────────────────────────────┤
│  config/                                            │
│    ├── database.js    (MongoDB Connection)          │
│    └── redis.js       (Redis Connection)            │
│                                                      │
│  models/                                            │
│    └── Url.js         (Mongoose Schema)             │
│                                                      │
│  controllers/                                       │
│    └── urlController.js (Business Logic)            │
│                                                      │
│  routes/                                            │
│    └── urlRoutes.js   (API Endpoints)               │
│                                                      │
│  middleware/                                        │
│    ├── rateLimiter.js (Rate Limiting)               │
│    └── errorHandler.js (Error Handling)             │
│                                                      │
│  utils/                                             │
│    ├── urlUtils.js    (URL Validation & Generation) │
│    └── geoUtils.js    (IP Geolocation)              │
│                                                      │
│  server.js            (Application Entry)           │
└─────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌───────────────────────────────────────────────┐
│            Security Layers                    │
├───────────────────────────────────────────────┤
│  Layer 1: Network Security                    │
│    • HTTPS (Production)                       │
│    • CORS Configuration                       │
│    • Proxy Trust                              │
├───────────────────────────────────────────────┤
│  Layer 2: Application Security                │
│    • Helmet.js Headers                        │
│    • Rate Limiting                            │
│    • Input Validation                         │
├───────────────────────────────────────────────┤
│  Layer 3: Data Security                       │
│    • NoSQL Injection Prevention               │
│    • Schema Validation                        │
│    • Secure Random Generation                 │
├───────────────────────────────────────────────┤
│  Layer 4: Access Control                      │
│    • IP-based Rate Limiting                   │
│    • Environment Variables                    │
│    • Error Message Sanitization               │
└───────────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
┌──────────────────────────────────────┐
│      Performance Layers              │
├──────────────────────────────────────┤
│  1. Caching (Redis)                  │
│     • Sub-millisecond lookups        │
│     • 1-hour TTL                     │
│     • Cache-aside pattern            │
├──────────────────────────────────────┤
│  2. Database Indexing                │
│     • O(log n) queries               │
│     • Compound indexes               │
│     • Unique constraints             │
├──────────────────────────────────────┤
│  3. Async Operations                 │
│     • Non-blocking I/O               │
│     • Promise-based                  │
│     • Background analytics           │
├──────────────────────────────────────┤
│  4. Connection Pooling               │
│     • MongoDB pooling                │
│     • Redis pooling                  │
│     • Resource reuse                 │
└──────────────────────────────────────┘
```

## Deployment Architecture

### Development
```
┌──────────────────────┐
│   Local Machine      │
│  ┌─────────────────┐ │
│  │   Node.js App   │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │  MongoDB Local  │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │   Redis Local   │ │
│  └─────────────────┘ │
└──────────────────────┘
```

### Docker Deployment
```
┌─────────────────────────────────────────┐
│          Docker Compose                 │
│  ┌────────────────────────────────────┐ │
│  │  App Container (Node.js)           │ │
│  │  • Port 3000                       │ │
│  │  • Environment Variables           │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  MongoDB Container                 │ │
│  │  • Port 27017                      │ │
│  │  • Volume: mongodb_data            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Redis Container                   │ │
│  │  • Port 6379                       │ │
│  │  • Volume: redis_data              │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Production Deployment (Recommended)
```
┌────────────────────────────────────────────────┐
│               Load Balancer                    │
│              (e.g., Nginx)                     │
└────────────┬──────────────┬────────────────────┘
             │              │
    ┌────────▼────┐   ┌────▼────────┐
    │   App 1     │   │   App 2     │
    │  (Docker)   │   │  (Docker)   │
    └────────┬────┘   └────┬────────┘
             │              │
             └──────┬───────┘
                    │
         ┌──────────▼──────────┐
         │   MongoDB Cluster   │
         │  (Replica Set)      │
         └─────────────────────┘
         ┌──────────▼──────────┐
         │   Redis Cluster     │
         │  (Master-Slave)     │
         └─────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Multiple application instances
- Load balancer distribution
- Shared database and cache

### Vertical Scaling
- Increased server resources
- Optimized database indexes
- Efficient caching strategy
- Connection pooling

### Database Scaling
- MongoDB sharding
- Read replicas
- Index optimization
- Query optimization

### Cache Scaling
- Redis clustering
- Cache warming
- TTL optimization
- Eviction policies

## Monitoring & Observability

```
Application Logs (Morgan)
    ↓
Error Tracking
    ↓
Performance Metrics
    ├── Request Duration
    ├── Cache Hit Rate
    ├── Database Query Time
    └── Error Rate
    ↓
Health Checks
    ├── /health endpoint
    ├── Database connectivity
    └── Redis connectivity
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB 6.x with Mongoose ODM
- **Cache**: Redis 7.x
- **Security**: Helmet.js, express-rate-limit
- **Geolocation**: geoip-lite
- **Logging**: Morgan
- **Containerization**: Docker & Docker Compose

## Key Design Decisions

1. **Separation of Concerns**: MVC architecture for maintainability
2. **Cache-Aside Pattern**: Redis for performance optimization
3. **Async Analytics**: Non-blocking analytics updates
4. **Index Strategy**: Multiple indexes for query optimization
5. **Rate Limiting**: Protection at URL creation, not redirect
6. **Stateless Design**: Easy horizontal scaling
7. **Environment Config**: 12-factor app principles
8. **Security First**: Multiple security layers

## Future Enhancements

1. **User Authentication**: JWT-based auth system
2. **GraphQL API**: Alternative to REST
3. **WebSocket**: Real-time analytics
4. **Microservices**: Service decomposition
5. **Message Queue**: Async processing with RabbitMQ
6. **CDN Integration**: Global content delivery
7. **Advanced Analytics**: ML-based insights
8. **Multi-tenancy**: Organization support
