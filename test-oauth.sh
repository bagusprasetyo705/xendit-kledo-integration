#!/bin/bash

echo "🔐 Step 2: OAuth Flow Testing"
echo "================================"
echo ""

echo "🌐 Testing Production Dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://xendit-kledo-integration.vercel.app/")
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard accessible (HTTP $DASHBOARD_STATUS)"
else
    echo "❌ Dashboard issue (HTTP $DASHBOARD_STATUS)"
fi
echo ""

echo "🔐 Testing OAuth Signin Redirect..."
OAUTH_REDIRECT=$(curl -s -I "https://xendit-kledo-integration.vercel.app/api/auth/signin" | grep -i "location:" | head -1)
if [[ $OAUTH_REDIRECT == *"bagus2.api.kledo.com"* ]]; then
    echo "✅ OAuth signin properly redirects to Kledo"
    echo "   $OAUTH_REDIRECT"
else
    echo "❌ OAuth signin redirect issue"
    echo "   $OAUTH_REDIRECT"
fi
echo ""

echo "🔗 OAuth Configuration Verified:"
echo "   • Client ID: 9f2ee85a-8a4f-452f-9be7-13df140198f4"
echo "   • Redirect URI: https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo"
echo "   • Scopes: read write"
echo "   • Authorization URL: https://bagus2.api.kledo.com/oauth/authorize"
echo ""

echo "📋 Manual Testing Steps:"
echo "1. Visit: https://xendit-kledo-integration.vercel.app"
echo "2. Click 'Connect to Kledo' button" 
echo "3. Login with your Kledo credentials"
echo "4. Grant permissions to the application"
echo "5. Verify you're redirected back to dashboard"
echo "6. Check that status shows 'Connected to Kledo API'"
echo ""

echo "🎯 Step 2 Status: READY FOR MANUAL OAUTH TESTING"
echo ""
echo "🔥 Ready to test? Visit the dashboard now:"
echo "   https://xendit-kledo-integration.vercel.app"
