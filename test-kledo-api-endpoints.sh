#!/bin/bash

# Test script to discover correct Kledo API endpoints
echo "🔍 Testing Kledo API endpoints structure..."

CLIENT_ID="9f2fa222-7ea0-4be4-81ed-39b9d7763062"
BASE_URL="https://bagus2.api.kledo.com"

# Test different possible API endpoints
echo "📋 Testing API endpoint variations..."

ENDPOINTS=(
    "/api/v1/contacts"
    "/api/contacts" 
    "/contacts"
    "/api/v1/customers"
    "/api/customers"
    "/customers"
    "/api/v1/invoices"
    "/api/invoices"
    "/invoices"
    "/api/v1/user"
    "/api/user"
    "/user"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing ${BASE_URL}${endpoint} ... "
    
    # Test with HEAD request to avoid getting large responses
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" "${BASE_URL}${endpoint}")
    
    if [ "$STATUS" -eq 200 ]; then
        echo "✅ $STATUS (OK)"
    elif [ "$STATUS" -eq 401 ]; then
        echo "🔑 $STATUS (Auth required - endpoint exists!)"
    elif [ "$STATUS" -eq 403 ]; then
        echo "🚫 $STATUS (Forbidden - endpoint exists but no access)"
    elif [ "$STATUS" -eq 404 ]; then
        echo "❌ $STATUS (Not Found)"
    else
        echo "❓ $STATUS"
    fi
done

echo ""
echo "🌍 Testing OAuth endpoints..."

OAUTH_ENDPOINTS=(
    "/oauth/authorize"
    "/api/oauth/authorize"
    "/api/v1/oauth/authorize"
    "/oauth/token"
    "/api/oauth/token"
    "/api/v1/oauth/token"
)

for endpoint in "${OAUTH_ENDPOINTS[@]}"; do
    echo -n "Testing ${BASE_URL}${endpoint} ... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
    
    if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 400 ]; then
        echo "✅ $STATUS (OAuth endpoint exists)"
    elif [ "$STATUS" -eq 404 ]; then
        echo "❌ $STATUS (Not Found)"
    else
        echo "❓ $STATUS"
    fi
done

echo ""
echo "📚 Testing documentation endpoints..."
DOC_ENDPOINTS=(
    "/documentation"
    "/api/documentation"
    "/docs"
    "/api/docs"
)

for endpoint in "${DOC_ENDPOINTS[@]}"; do
    echo -n "Testing ${BASE_URL}${endpoint} ... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
    
    if [ "$STATUS" -eq 200 ]; then
        echo "✅ $STATUS (Documentation available)"
    elif [ "$STATUS" -eq 404 ]; then
        echo "❌ $STATUS (Not Found)"
    else
        echo "❓ $STATUS"
    fi
done

echo ""
echo "🔧 Summary:"
echo "• If endpoints return 401/403, they exist but need authentication"
echo "• If endpoints return 404, they don't exist at that path"
echo "• Use the working endpoints in your API calls"
