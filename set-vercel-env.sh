#!/bin/bash
# Script to set Vercel environment variables from .env.production

echo "Setting Vercel environment variables..."

# Read .env.production and set each variable
vercel env add XENDIT_SECRET_KEY production < <(echo "xnd_production_0G8CNWxScTl5TF2uYtw4nIYqSasUv9irnteyx62XWH6eYHQ8UuVWRQmFdn5uhy3S")
vercel env add XENDIT_WEBHOOK_TOKEN production < <(echo "53fc1630cafbca77f3f02acba347e71c5c6a9b39f7298f2d915ac4db163cbbaf")
vercel env add KLEDO_API_HOST production < <(echo "http://app.kledo.com/api/v1")
vercel env add KLEDO_API_BASE_URL production < <(echo "http://app.kledo.com/api/v1")
vercel env add KLEDO_CLIENT_ID production < <(echo "9f2ee85a-8a4f-452f-9be7-13df140198f4")
vercel env add KLEDO_CLIENT_SECRET production < <(echo "4BJ8qozZh4cPgXF7izx0cCItiI22DEMh5pdoROca")
vercel env add KLEDO_REDIRECT_URI production < <(echo "https://xendit-kledo-integration.vercel.app/api/oauth/callback")
vercel env add NEXTAUTH_SECRET production < <(echo "XCQSeQg5hXE+iEDsIT+0um0Eu8knKRdPYp4HegsFooI=")
vercel env add NEXTAUTH_URL production < <(echo "https://xendit-kledo-integration.vercel.app")

echo "Environment variables set successfully!"
echo "Remember to redeploy your application for changes to take effect."
