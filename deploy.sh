#!/bin/bash

# Production Deployment Script for Xendit to Kledo Integration
echo "🚀 Deploying Xendit to Kledo Integration to Production..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is available"

# Build the application first
echo "🏗️  Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

echo "✅ Deployment successful!"
echo ""
echo "🎉 Your app is now live at: https://xendit-kledo-integration.vercel.app"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ Set environment variables in Vercel dashboard"
echo "2. ⚠️  Update Kledo OAuth app redirect URI to production URL"
echo "3. ⚠️  Update Xendit webhook URL to production endpoint"
echo "4. 🧪 Test OAuth flow on production"
echo "5. 🧪 Test webhook with a real Xendit payment"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - DEPLOYMENT-CHECKLIST.md"
echo "   - KLEDO-OAUTH-SETUP.md"
echo ""
echo "🔧 Environment variables needed in Vercel:"
echo "   KLEDO_CLIENT_ID=your_actual_client_id"
echo "   KLEDO_CLIENT_SECRET=your_actual_client_secret"
echo "   KLEDO_REDIRECT_URI=https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo"
echo "   NEXTAUTH_URL=https://xendit-kledo-integration.vercel.app"
echo "   (plus all other variables from .env)"
