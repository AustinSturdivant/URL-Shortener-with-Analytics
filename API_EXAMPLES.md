# API Examples and Testing Guide

## Using cURL

### 1. Create a Short URL (Basic)
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.github.com/AustinSturdivant/URL-Shortener-with-Analytics"
  }'
```

### 2. Create a Short URL with Custom Alias
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.example.com/my-page",
    "customAlias": "mypage"
  }'
```

### 3. Create an Expiring Short URL
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.example.com/temporary",
    "expiresIn": 86400
  }'
```

### 4. Access a Short URL (Redirect)
```bash
curl -L http://localhost:3000/abc123
```

### 5. Get Analytics for a Short URL
```bash
curl http://localhost:3000/api/stats/abc123
```

### 6. List All URLs (Default Pagination)
```bash
curl http://localhost:3000/api/urls
```

### 7. List URLs with Custom Pagination
```bash
curl "http://localhost:3000/api/urls?page=2&limit=20&sortBy=totalClicks&order=desc"
```

### 8. Health Check
```bash
curl http://localhost:3000/health
```

## Using JavaScript (fetch)

### Create Short URL
```javascript
fetch('http://localhost:3000/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://www.example.com',
    customAlias: 'mylink'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Get Analytics
```javascript
fetch('http://localhost:3000/api/stats/mylink')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Using Python (requests)

### Create Short URL
```python
import requests

url = "http://localhost:3000/api/shorten"
payload = {
    "url": "https://www.example.com",
    "customAlias": "mylink"
}
headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Get Analytics
```python
import requests

url = "http://localhost:3000/api/stats/mylink"
response = requests.get(url)
print(response.json())
```

## Error Responses

### Invalid URL
```json
{
  "error": "Invalid URL format"
}
```

### Custom Alias Already in Use
```json
{
  "error": "Custom alias already in use"
}
```

### Short URL Not Found
```json
{
  "error": "Short URL not found"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Expired URL
```json
{
  "error": "This short URL has expired"
}
```

## Rate Limits

- **URL Shortening:** 100 requests per 15 minutes per IP
- **General API:** 300 requests per 15 minutes per IP
- **Redirects:** No rate limit

## Response Status Codes

- `200 OK` - Request successful
- `201 Created` - URL successfully shortened
- `301 Moved Permanently` - Redirect to original URL
- `400 Bad Request` - Invalid input
- `404 Not Found` - Short URL not found
- `409 Conflict` - Custom alias already in use
- `410 Gone` - URL has expired
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
