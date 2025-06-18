#!/bin/bash

# OAuth Endpoints Test Script
# Tests the new OAuth implementation

echo "🔧 Testing OAuth Endpoints..."

BASE_URL="http://localhost:3000"
if [ "$1" == "production" ]; then
    BASE_URL="https://xendit-kledo-integration.vercel.app"
    echo "Testing production environment: $BASE_URL"
else
    echo "Testing development environment: $BASE_URL"
fi

echo ""
echo "📋 Testing OAuth Status Endpoint..."
curl -s -X GET "$BASE_URL/api/oauth/status" | jq '.' || echo "Failed to parse JSON response"

echo ""
echo "🔗 Testing OAuth Authorization Endpoint..."
echo "Visit this URL in your browser to test OAuth flow:"
echo "$BASE_URL/api/oauth/authorize"

echo ""
echo "📊 Testing Health Check..."
curl -s -X GET "$BASE_URL/api/health" | jq '.' || echo "Failed to parse JSON response"

echo ""
echo "🎯 Testing Kledo Test Endpoint..."
curl -s -X GET "$BASE_URL/api/kledo/test" | jq '.' || echo "Failed to parse JSON response"

echo ""
echo "✅ Basic endpoint tests completed!"
echo ""
echo "🚀 To test the full OAuth flow:"
echo "1. Visit: $BASE_URL/api/oauth/authorize"
echo "2. Complete Kledo authorization"
echo "3. You should be redirected back with success"
echo "4. Check status: $BASE_URL/api/oauth/status"
echo ""
echo "📝 Note: Make sure KLEDO_CLIENT_ID and KLEDO_CLIENT_SECRET are set in environment variables"
