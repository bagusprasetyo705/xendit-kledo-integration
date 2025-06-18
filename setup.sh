#!/bin/bash

# Xendit to Kledo Integration Setup Script
echo "🚀 Setting up Xendit to Kledo Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env .env.local
    echo "✅ .env.local created from .env template"
else
    echo "ℹ️  .env.local already exists, skipping creation"
fi

echo ""
echo "🔧 Setup completed! Next steps:"
echo ""
echo "1. 📝 Edit .env.local with your actual credentials:"
echo "   - KLEDO_CLIENT_ID"
echo "   - KLEDO_CLIENT_SECRET"
echo "   - XENDIT_SECRET_KEY"
echo "   - XENDIT_WEBHOOK_TOKEN"
echo ""
echo "2. 🔐 Set up Kledo OAuth application:"
echo "   - Visit Kledo developer dashboard"
echo "   - Create new OAuth app"
echo "   - Set redirect URI: http://localhost:3000/api/auth/callback/kledo"
echo "   - Copy Client ID and Secret to .env.local"
echo ""
echo "3. 🌐 Configure Xendit webhook:"
echo "   - Set webhook URL (use ngrok for local testing)"
echo "   - Configure webhook token"
echo ""
echo "4. 🚀 Start the development server:"
echo "   npm run dev"
echo ""
echo "5. 📖 Read the complete setup guide:"
echo "   - KLEDO-OAUTH-SETUP.md (detailed OAuth setup)"
echo "   - README-COMPLETE.md (complete documentation)"
echo ""
echo "🎉 Happy integrating!"
