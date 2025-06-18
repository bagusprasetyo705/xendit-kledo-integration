#!/bin/bash

# Test Kledo OAuth Authorization URL
echo "🔍 Testing Kledo OAuth Authorization URL..."
echo ""

# The URL from your message
TEST_URL="https://app.kledo.com/api/v1/oauth/authorize?client_id=9f2ee85a-8a4f-452f-9be7-13df140198f4&redirect_uri=https%3A%2F%2Fxendit-kledo-integration.vercel.app%2Fapi%2Foauth%2Fcallback&response_type=code&scope=&state=KK5VArJGSXA4JQwQ2K4BHkUIPUNlMAC1pmpoD9rS"

echo "Testing URL: $TEST_URL"
echo ""

# Test with curl to see response
echo "📡 Testing with curl..."
curl -v -L "$TEST_URL" 2>&1 | head -20

echo ""
echo "🔍 Testing different OAuth endpoints..."

# Test the base API
echo "Testing base API: https://app.kledo.com/api/v1"
curl -I "https://app.kledo.com/api/v1" 2>&1 | head -5

echo ""
echo "Testing OAuth endpoint: https://app.kledo.com/oauth/authorize"
curl -I "https://app.kledo.com/oauth/authorize" 2>&1 | head -5

echo ""
echo "📋 Checking if the issue is with the API path..."
echo "PHP demo uses: http://app.kledo.com/api/v1 + /oauth/authorize"
echo "This creates: http://app.kledo.com/api/v1/oauth/authorize"
echo ""
echo "But maybe the correct endpoint is:"
echo "https://app.kledo.com/oauth/authorize (without /api/v1)"
