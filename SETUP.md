# Quick Setup Guide

This guide will help you set up and run the URL Shortener with Analytics locally.

## Prerequisites

Make sure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6 or higher) - [Download](https://redis.io/download) - Optional but recommended

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

The default `.env` file should work for local development. If needed, update the values:

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

### 3. Start MongoDB

#### On macOS (with Homebrew):
```bash
brew services start mongodb-community
```

#### On Linux:
```bash
sudo systemctl start mongod
```

#### On Windows:
```bash
net start MongoDB
```

#### Alternative - Using Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start Redis (Optional)

#### On macOS (with Homebrew):
```bash
brew services start redis
```

#### On Linux:
```bash
sudo systemctl start redis
```

#### On Windows:
Download and run Redis from [here](https://github.com/microsoftarchive/redis/releases)

#### Alternative - Using Docker:
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Note:** The application will work without Redis, but it won't have caching capabilities.

### 5. Start the Application

```bash
npm start
```

The server will start on `http://localhost:3000`

## Testing the Application

### Using the Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see a user-friendly interface to:
   - Shorten URLs
   - View analytics
   - Copy shortened links

### Using cURL

#### Shorten a URL:
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/AustinSturdivant/URL-Shortener-with-Analytics"}'
```

#### Get Analytics:
```bash
curl http://localhost:3000/api/stats/abc123
```

#### Test Redirect:
```bash
curl -L http://localhost:3000/abc123
```

## Troubleshooting

### MongoDB Connection Error
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:** 
- Make sure MongoDB is running
- Check if MongoDB is listening on port 27017: `lsof -i :27017` (macOS/Linux)
- Verify MONGODB_URI in your `.env` file

### Redis Connection Error
**Error:** `Redis Client Error: connect ECONNREFUSED`

**Solution:** 
- The app will continue to work without Redis
- To enable caching, make sure Redis is running
- Check if Redis is listening on port 6379: `redis-cli ping`

### Port Already in Use
**Error:** `EADDRINUSE: address already in use`

**Solution:** 
- Change the PORT in your `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill -9` (macOS/Linux)

### Rate Limit Hit
**Error:** `Too many requests from this IP`

**Solution:** 
- Wait 15 minutes or adjust `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Restart the server after changing environment variables

## Development Mode

For development with auto-restart on file changes:

```bash
# Install nodemon globally
npm install -g nodemon

# Or use npx
npx nodemon src/server.js
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db/url-shortener
REDIS_HOST=your-redis-host
REDIS_PORT=6379
BASE_URL=https://yourdomain.com
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start src/server.js --name url-shortener

# View logs
pm2 logs url-shortener

# Restart
pm2 restart url-shortener

# Stop
pm2 stop url-shortener
```

### Using Docker

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

Build and run:
```bash
docker build -t url-shortener .
docker run -p 3000:3000 --env-file .env url-shortener
```

## Next Steps

- Explore the API using the web interface at `http://localhost:3000`
- Read the full API documentation in `API_EXAMPLES.md`
- Check out the project structure in `PROJECT_STRUCTURE.md`
- Review the main `README.md` for feature details

## Support

For issues or questions, please open an issue on GitHub.
