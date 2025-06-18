#!/bin/bash

# Test script for new OAuth application
# Usage: ./test-new-oauth.sh NEW_CLIENT_ID NEW_CLIENT_SECRET

if [ $# -ne 2 ]; then
    echo "Usage: $0 <CLIENT_ID> <CLIENT_SECRET>"
    echo "Example: $0 'your-new-client-id' 'your-new-client-secret'"
    exit 1
fi

NEW_CLIENT_ID="$1"
NEW_CLIENT_SECRET="$2"
OAUTH_HOST="https://bagus2.api.kledo.com/api/v1"
REDIRECT_URI="https://xendit-kledo-integration.vercel.app/api/oauth/callback"

echo "🔍 Testing new OAuth credentials..."
echo "Client ID: $NEW_CLIENT_ID"
echo "OAuth Host: $OAUTH_HOST"
echo ""

# Test authorization endpoint
echo "📋 Testing authorization endpoint..."
AUTH_URL="${OAUTH_HOST}/oauth/authorize"
FULL_AUTH_URL="${AUTH_URL}?response_type=code&client_id=${NEW_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=test123"

echo "Authorization URL:"
echo "$FULL_AUTH_URL"
echo ""

# Test if authorization endpoint responds
echo "🌐 Checking authorization endpoint accessibility..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$AUTH_URL"
echo ""

# Test token endpoint structure
echo "🔐 Testing token endpoint structure..."
TOKEN_URL="${OAUTH_HOST}/oauth/token"
echo "Token URL: $TOKEN_URL"

# Test basic endpoint accessibility
curl -s -o /dev/null -w "Token endpoint HTTP Status: %{http_code}\n" "$TOKEN_URL"
echo ""

echo "✅ Next steps:"
echo "1. Open the authorization URL in browser:"
echo "   $FULL_AUTH_URL"
echo "2. If it shows Kledo login page (not blank), the client ID is valid!"
echo "3. Update environment variables with these credentials"
echo ""
