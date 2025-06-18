#!/bin/bash

echo "🔍 Testing Kledo OAuth Endpoints - Comprehensive Debug"
echo "=================================================="
echo ""

# Test different possible OAuth endpoint patterns
ENDPOINTS=(
    "https://app.kledo.com/oauth/authorize"
    "http://app.kledo.com/oauth/authorize"
    "https://app.kledo.com/api/v1/oauth/authorize"
    "http://app.kledo.com/api/v1/oauth/authorize"
    "https://bagus2.api.kledo.com/oauth/authorize"
    "https://bagus2.api.kledo.com/api/v1/oauth/authorize"
)

CLIENT_ID="9f2ee85a-8a4f-452f-9be7-13df140198f4"
REDIRECT_URI="https://xendit-kledo-integration.vercel.app/api/oauth/callback"

for endpoint in "${ENDPOINTS[@]}"; do
    echo "🌐 Testing: $endpoint"
    
    # Test with HEAD request first
    echo "  HEAD request:"
    response=$(curl -s -I "$endpoint" 2>&1)
    status_code=$(echo "$response" | grep -i "HTTP" | head -1)
    echo "    $status_code"
    
    # Test with full OAuth URL
    oauth_url="${endpoint}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=&state=test123"
    echo "  Full OAuth URL test:"
    echo "    URL: ${oauth_url:0:100}..."
    
    # Check response
    full_response=$(curl -s -I "$oauth_url" 2>&1 | head -5)
    echo "    Response: $full_response"
    echo ""
done

echo "🔧 Testing Kledo API endpoints to understand the structure..."
echo ""

# Test API endpoints
API_ENDPOINTS=(
    "https://app.kledo.com"
    "http://app.kledo.com"
    "https://app.kledo.com/api"
    "http://app.kledo.com/api"
    "https://app.kledo.com/api/v1"
    "http://app.kledo.com/api/v1"
)

for api_endpoint in "${API_ENDPOINTS[@]}"; do
    echo "📡 Testing API: $api_endpoint"
    response=$(curl -s -I "$api_endpoint" 2>&1 | head -3)
    echo "    $response"
    echo ""
done

echo "📋 Summary:"
echo "If all return blank or 404, the OAuth endpoint might be:"
echo "1. Behind authentication (needs login first)"
echo "2. Different domain/subdomain"
echo "3. Different path structure"
echo "4. HTTPS/HTTP issue"
echo "5. Client ID not valid for this environment"
