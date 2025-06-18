#!/bin/bash

echo "🔍 KLEDO OAUTH COMPREHENSIVE DIAGNOSTIC"
echo "======================================"
echo ""

# Test the exact URL from user's message
USER_URL="https://app.kledo.com/oauth/authorize?client_id=9f2ee85a-8a4f-452f-9be7-13df140198f4&redirect_uri=https%3A%2F%2Fxendit-kledo-integration.vercel.app%2Fapi%2Foauth%2Fcallback&response_type=code&scope=&state=2YPTkZ3gwFh45I3ek1iNNb2vTf50NMvqQF9jZWRx"

echo "1. Testing user's exact URL..."
echo "URL: $USER_URL"
echo ""

# Test with curl to get detailed response
echo "Response headers:"
curl -I "$USER_URL" 2>&1 | head -10

echo ""
echo "Response body (first 500 chars):"
curl -s "$USER_URL" 2>&1 | head -c 500

echo ""
echo ""

# Test different protocol combinations
echo "2. Testing different URL patterns..."
echo ""

PATTERNS=(
    "https://app.kledo.com/oauth/authorize"
    "http://app.kledo.com/oauth/authorize"
    "https://app.kledo.com/api/v1/oauth/authorize"
    "http://app.kledo.com/api/v1/oauth/authorize"
    "https://api.kledo.com/oauth/authorize"
    "https://auth.kledo.com/oauth/authorize"
)

CLIENT_ID="9f2ee85a-8a4f-452f-9be7-13df140198f4"

for pattern in "${PATTERNS[@]}"; do
    echo "Testing: $pattern"
    
    # Test just the endpoint
    status=$(curl -o /dev/null -s -w "%{http_code}" "$pattern" 2>/dev/null)
    echo "  Status: $status"
    
    # Test with OAuth parameters
    oauth_url="${pattern}?client_id=${CLIENT_ID}&response_type=code"
    oauth_status=$(curl -o /dev/null -s -w "%{http_code}" "$oauth_url" 2>/dev/null)
    echo "  With OAuth params: $oauth_status"
    
    echo ""
done

echo "3. Testing Kledo domain structure..."
echo ""

# Test base domains
DOMAINS=(
    "https://app.kledo.com"
    "http://app.kledo.com"
    "https://kledo.com"
    "https://api.kledo.com"
    "https://auth.kledo.com"
)

for domain in "${DOMAINS[@]}"; do
    echo "Testing: $domain"
    status=$(curl -o /dev/null -s -w "%{http_code}" "$domain" 2>/dev/null)
    echo "  Status: $status"
    
    # Check if it redirects
    redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "$domain" 2>/dev/null)
    if [ -n "$redirect" ]; then
        echo "  Redirects to: $redirect"
    fi
    echo ""
done

echo "🔍 DIAGNOSIS SUMMARY:"
echo "==================="
echo ""
echo "If all OAuth endpoints return 404 or blank:"
echo "1. The client ID might be for a different Kledo environment"
echo "2. The OAuth app might be created on a different instance"
echo "3. The redirect URI might not be properly configured"
echo "4. The OAuth endpoint path might be different"
echo ""
echo "NEXT STEPS:"
echo "- Check if the client ID is for the correct Kledo instance"
echo "- Verify the redirect URI in Kledo OAuth app settings"
echo "- Try accessing the Kledo admin panel to verify the OAuth app"
echo "- Contact Kledo support for the correct OAuth endpoint"
