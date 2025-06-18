#!/bin/bash

echo "🔧 Update OAuth Domain Environment Variable"
echo "=========================================="
echo ""
echo "Use this script to update your OAuth domain after testing."
echo ""

# Function to update Vercel environment variable
update_vercel_env() {
    local key=$1
    local value=$2
    echo "Updating Vercel environment variable: $key"
    vercel env add "$key" production <<< "$value"
}

echo "Choose the OAuth domain that worked:"
echo "1. https://app.kledo.com"
echo "2. https://api.kledo.com" 
echo "3. https://bagus2.api.kledo.com"
echo "4. Custom domain"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        OAUTH_HOST="https://app.kledo.com"
        ;;
    2)
        OAUTH_HOST="https://api.kledo.com"
        ;;
    3)
        OAUTH_HOST="https://bagus2.api.kledo.com"
        ;;
    4)
        read -p "Enter custom OAuth domain (e.g., https://your-domain.com): " OAUTH_HOST
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Selected OAuth Host: $OAUTH_HOST"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    echo ""
    echo "Or manually update in Vercel dashboard:"
    echo "   KLEDO_OAUTH_HOST=$OAUTH_HOST"
    exit 1
fi

# Update local .env.production file
echo "Updating local .env.production file..."
if grep -q "KLEDO_OAUTH_HOST=" .env.production; then
    sed -i.bak "s|KLEDO_OAUTH_HOST=.*|KLEDO_OAUTH_HOST=$OAUTH_HOST|" .env.production
else
    echo "KLEDO_OAUTH_HOST=$OAUTH_HOST" >> .env.production
fi

echo "✅ Local .env.production updated"
echo ""

# Ask if user wants to update Vercel environment
read -p "Update Vercel environment variable? (y/n): " update_vercel

if [[ $update_vercel =~ ^[Yy]$ ]]; then
    echo "Updating Vercel environment variable..."
    update_vercel_env "KLEDO_OAUTH_HOST" "$OAUTH_HOST"
    echo "✅ Vercel environment variable updated"
    echo ""
    echo "🚀 Redeploying application..."
    vercel --prod
else
    echo "⏳ Please manually update KLEDO_OAUTH_HOST in Vercel dashboard:"
    echo "   https://vercel.com/dashboard"
    echo "   Set: KLEDO_OAUTH_HOST=$OAUTH_HOST"
fi

echo ""
echo "🧪 Test your OAuth flow:"
echo "   https://xendit-kledo-integration.vercel.app"
echo ""
echo "✅ OAuth domain configuration complete!"
