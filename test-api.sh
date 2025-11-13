#!/bin/bash

# Test Script for URL Shortener API
# This script tests all major endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing URL Shortener API...${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 2: Shorten URL (Basic)
echo -e "${YELLOW}Test 2: Shorten URL (Basic)${NC}"
response=$(curl -s -X POST "${BASE_URL}/api/shorten" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://github.com/AustinSturdivant/URL-Shortener-with-Analytics"}')

if echo "$response" | grep -q "shortUrl"; then
    echo -e "${GREEN}✓ URL shortening passed${NC}"
    shortCode=$(echo "$response" | grep -o '"shortCode":"[^"]*"' | cut -d'"' -f4)
    shortUrl=$(echo "$response" | grep -o '"shortUrl":"[^"]*"' | cut -d'"' -f4)
    echo "Short Code: $shortCode"
    echo "Short URL: $shortUrl"
else
    echo -e "${RED}✗ URL shortening failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 3: Shorten URL with Custom Alias
echo -e "${YELLOW}Test 3: Shorten URL with Custom Alias${NC}"
custom_alias="test-$(date +%s)"
response=$(curl -s -X POST "${BASE_URL}/api/shorten" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"https://example.com\",\"customAlias\":\"$custom_alias\"}")

if echo "$response" | grep -q "$custom_alias"; then
    echo -e "${GREEN}✓ Custom alias creation passed${NC}"
    echo "Custom Alias: $custom_alias"
else
    echo -e "${RED}✗ Custom alias creation failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 4: Redirect (if shortCode exists)
if [ ! -z "$shortCode" ]; then
    echo -e "${YELLOW}Test 4: Test Redirect${NC}"
    redirect_response=$(curl -s -o /dev/null -w "%{http_code}" -L "${BASE_URL}/${shortCode}")
    
    if [ "$redirect_response" -eq 200 ] || [ "$redirect_response" -eq 301 ]; then
        echo -e "${GREEN}✓ Redirect test passed (HTTP $redirect_response)${NC}"
    else
        echo -e "${RED}✗ Redirect test failed (HTTP $redirect_response)${NC}"
    fi
    echo ""

    # Test 5: Get Analytics
    echo -e "${YELLOW}Test 5: Get Analytics${NC}"
    analytics_response=$(curl -s "${BASE_URL}/api/stats/${shortCode}")
    
    if echo "$analytics_response" | grep -q "totalClicks"; then
        echo -e "${GREEN}✓ Analytics retrieval passed${NC}"
        echo "$analytics_response" | head -c 200
        echo "..."
    else
        echo -e "${RED}✗ Analytics retrieval failed${NC}"
        echo "Response: $analytics_response"
    fi
    echo ""
fi

# Test 6: List URLs
echo -e "${YELLOW}Test 6: List All URLs${NC}"
list_response=$(curl -s "${BASE_URL}/api/urls?page=1&limit=5")

if echo "$list_response" | grep -q "pagination"; then
    echo -e "${GREEN}✓ List URLs passed${NC}"
    total_urls=$(echo "$list_response" | grep -o '"totalUrls":[0-9]*' | cut -d':' -f2)
    echo "Total URLs in database: $total_urls"
else
    echo -e "${RED}✗ List URLs failed${NC}"
    echo "Response: $list_response"
fi
echo ""

# Test 7: Invalid URL
echo -e "${YELLOW}Test 7: Test Invalid URL Handling${NC}"
invalid_response=$(curl -s -X POST "${BASE_URL}/api/shorten" \
    -H "Content-Type: application/json" \
    -d '{"url":"not-a-valid-url"}')

if echo "$invalid_response" | grep -q "error"; then
    echo -e "${GREEN}✓ Invalid URL handling passed${NC}"
else
    echo -e "${RED}✗ Invalid URL handling failed${NC}"
    echo "Response: $invalid_response"
fi
echo ""

# Test 8: Missing URL
echo -e "${YELLOW}Test 8: Test Missing URL Handling${NC}"
missing_response=$(curl -s -X POST "${BASE_URL}/api/shorten" \
    -H "Content-Type: application/json" \
    -d '{}')

if echo "$missing_response" | grep -q "error"; then
    echo -e "${GREEN}✓ Missing URL handling passed${NC}"
else
    echo -e "${RED}✗ Missing URL handling failed${NC}"
    echo "Response: $missing_response"
fi
echo ""

# Test 9: Non-existent Short Code
echo -e "${YELLOW}Test 9: Test Non-existent Short Code${NC}"
notfound_response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/nonexistent123")

if [ "$notfound_response" -eq 404 ]; then
    echo -e "${GREEN}✓ Non-existent short code handling passed (HTTP 404)${NC}"
else
    echo -e "${RED}✗ Non-existent short code handling failed (HTTP $notfound_response)${NC}"
fi
echo ""

echo -e "${YELLOW}Testing complete!${NC}"
