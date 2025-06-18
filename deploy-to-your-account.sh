#!/bin/bash

echo "🚀 Deploying Xendit-Kledo Integration to Your Vercel Account"
echo "============================================================"
echo ""

# Check if logged in to Vercel
echo "1️⃣ Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "🔐 Please login to your Vercel account:"
    vercel login
    echo ""
else
    echo "✅ Logged in to Vercel as: $(vercel whoami)"
    echo ""
fi

# Build the project
echo "2️⃣ Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi
echo "✅ Build successful"
echo ""

# Deploy to production
echo "3️⃣ Deploying to production..."
echo "🔄 This will create a new deployment on your Vercel account..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 IMPORTANT: Update your OAuth configuration"
    echo ""
    echo "1. Note your actual Vercel domain from the deployment output above"
    echo "2. Update your Kledo OAuth app redirect URI to:"
    echo "   https://YOUR-ACTUAL-DOMAIN.vercel.app/api/auth/callback/kledo"
    echo ""
    echo "3. Update environment variables in Vercel dashboard:"
    echo "   - KLEDO_REDIRECT_URI=https://YOUR-ACTUAL-DOMAIN.vercel.app/api/auth/callback/kledo"
    echo "   - NEXTAUTH_URL=https://YOUR-ACTUAL-DOMAIN.vercel.app"
    echo ""
    echo "4. Test the OAuth flow again with your new domain"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi
