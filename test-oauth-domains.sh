#!/bin/bash

echo "🔍 COMPREHENSIVE OAuth Domain Testing"
echo "===================================="
echo ""
echo "Testing Client ID: 9f2ee85a-8a4f-452f-9be7-13df140198f4"
echo "Finding the correct OAuth domain..."
echo ""

CLIENT_ID="9f2ee85a-8a4f-452f-9be7-13df140198f4"
REDIRECT_URI="https://xendit-kledo-integration.vercel.app/api/oauth/callback"

# Test different OAuth domain combinations
OAUTH_DOMAINS=(
    "https://bagus2.api.kledo.com"
    "https://app.kledo.com" 
    "https://api.kledo.com"
    "https://auth.kledo.com"
    "https://login.kledo.com"
    "https://oauth.kledo.com"
    "http://bagus2.api.kledo.com"
    "http://app.kledo.com"
)

OAUTH_PATHS=(
    "/oauth/authorize"
    "/api/v1/oauth/authorize"
    "/v1/oauth/authorize"
    "/auth/oauth/authorize"
)

echo "🧪 Testing OAuth endpoints systematically..."
echo ""

found_working=""

for domain in "${OAUTH_DOMAINS[@]}"; do
    for path in "${OAUTH_PATHS[@]}"; do
        oauth_url="${domain}${path}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=&state=test123"
        
        echo "Testing: ${domain}${path}"
        
        # Test with curl and capture response
        response=$(curl -s -w "HTTP_STATUS:%{http_code}\n" "$oauth_url" 2>/dev/null)
        status_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
        response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
        
        case $status_code in
            200)
                echo "  ✅ SUCCESS (200) - Found working OAuth endpoint!"
                echo "  Response: ${response_body:0:100}..."
                found_working="$domain$path"
                echo ""
                break 2
                ;;
            302|301)
                echo "  ✅ REDIRECT ($status_code) - OAuth endpoint works!"
                location=$(curl -s -I "$oauth_url" 2>/dev/null | grep -i location | cut -d' ' -f2-)
                echo "  Redirects to: $location"
                found_working="$domain$path"
                echo ""
                break 2
                ;;
            400)
                echo "  ⚠️  BAD REQUEST (400) - Endpoint exists, checking error..."
                if echo "$response_body" | grep -q "invalid_client"; then
                    echo "  ❌ Client ID not valid for this domain"
                elif echo "$response_body" | grep -q "error"; then
                    echo "  ⚠️  Other OAuth error - endpoint exists but configuration issue"
                else
                    echo "  ⚠️  Generic bad request"
                fi
                echo ""
                ;;
            401)
                echo "  ❌ UNAUTHORIZED (401) - Client ID not valid"
                echo ""
                ;;
            404)
                echo "  ❌ NOT FOUND (404) - Endpoint doesn't exist"
                echo ""
                ;;
            *)
                echo "  ❓ UNKNOWN ($status_code)"
                echo ""
                ;;
        esac
    done
done

echo ""
echo "🎯 RESULTS:"
echo "==========="

if [ -n "$found_working" ]; then
    echo "✅ WORKING OAUTH ENDPOINT FOUND: $found_working"
    echo ""
    echo "📋 UPDATE YOUR ENVIRONMENT VARIABLES:"
    echo "KLEDO_OAUTH_HOST=${found_working%/oauth/authorize}"
    echo ""
    echo "🧪 TEST URL:"
    echo "$found_working?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=&state=test123"
else
    echo "❌ NO WORKING OAUTH ENDPOINT FOUND"
    echo ""
    echo "🔧 TROUBLESHOOTING STEPS:"
    echo "1. Verify Client ID is correct"
    echo "2. Check if OAuth app was created on different environment"
    echo "3. Confirm redirect URI is registered in OAuth app"
    echo "4. Try testing in browser instead of curl"
fi

echo ""
echo "🌐 Next step: Test the working URL in your browser"
echo "   It should redirect to Kledo login page (not blank page)"
