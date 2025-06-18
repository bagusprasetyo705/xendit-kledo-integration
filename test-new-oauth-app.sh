#!/bin/bash

echo "🧪 Test New OAuth Application"
echo "============================="
echo ""

# Check if client ID is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-new-oauth-app.sh <new-client-id>"
    echo ""
    echo "Example:"
    echo "  ./test-new-oauth-app.sh abc123def456"
    echo ""
    exit 1
fi

NEW_CLIENT_ID="$1"
REDIRECT_URI="https://xendit-kledo-integration.vercel.app/api/oauth/callback"

echo "Testing new Client ID: $NEW_CLIENT_ID"
echo "Redirect URI: $REDIRECT_URI"
echo ""

# Test the new OAuth URL
OAUTH_URL="https://bagus2.api.kledo.com/api/v1/oauth/authorize?client_id=${NEW_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=&state=test123"

echo "🔗 OAuth URL:"
echo "$OAUTH_URL"
echo ""

echo "🧪 Testing OAuth endpoint..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}\n" "$OAUTH_URL" 2>/dev/null)
status_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_STATUS/d')

case $status_code in
    200)
        echo "✅ SUCCESS (200) - OAuth app is working!"
        if echo "$response_body" | grep -q "login"; then
            echo "✅ Redirects to login page - PERFECT!"
        else
            echo "ℹ️  Response: ${response_body:0:100}..."
        fi
        ;;
    302|301)
        echo "✅ REDIRECT ($status_code) - OAuth app is working!"
        location=$(curl -s -I "$OAUTH_URL" 2>/dev/null | grep -i location | cut -d' ' -f2-)
        echo "✅ Redirects to: $location"
        ;;
    400)
        echo "❌ BAD REQUEST (400)"
        if echo "$response_body" | grep -q "invalid_client"; then
            echo "❌ Still getting invalid_client error"
            echo "   Check if Client ID is correct and OAuth app is on bagus2.api.kledo.com"
        else
            echo "ℹ️  Error: $response_body"
        fi
        ;;
    401)
        echo "❌ UNAUTHORIZED (401) - Client ID still not valid"
        ;;
    404)
        echo "❌ NOT FOUND (404) - OAuth endpoint not found"
        ;;
    *)
        echo "❓ UNKNOWN STATUS ($status_code)"
        echo "Response: $response_body"
        ;;
esac

echo ""
echo "🎯 RESULTS:"
echo "==========="

if [[ $status_code == "200" || $status_code == "302" || $status_code == "301" ]]; then
    echo "✅ NEW OAUTH APP IS WORKING!"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Update Vercel environment variables:"
    echo "   KLEDO_CLIENT_ID=$NEW_CLIENT_ID"
    echo "   KLEDO_CLIENT_SECRET=<your-new-client-secret>"
    echo ""
    echo "2. Redeploy your application"
    echo ""
    echo "3. Test OAuth flow at:"
    echo "   https://xendit-kledo-integration.vercel.app"
else
    echo "❌ OAUTH APP NOT WORKING YET"
    echo ""
    echo "🔧 TROUBLESHOOTING:"
    echo "1. Verify Client ID is copied correctly"
    echo "2. Ensure OAuth app was created on bagus2.api.kledo.com"
    echo "3. Check redirect URI is exactly: $REDIRECT_URI"
    echo "4. Wait a few minutes for OAuth app to propagate"
fi

echo ""
echo "🌐 Test URL in browser:"
echo "$OAUTH_URL"
