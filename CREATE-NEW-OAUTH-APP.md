# OAuth Client ID Issue - CREATE NEW OAUTH APP ✅

## Problem Confirmed
The Client ID `9f2ee85a-8a4f-452f-9be7-13df140198f4` returns `"invalid_client"` error on `bagus2.api.kledo.com` because:

**❌ The OAuth application was created on a different Kledo environment**

## SOLUTION: Create New OAuth App on Correct Domain

### Step 1: Login to Kledo 🔐
Go to: `https://bagus2.api.kledo.com` and login with your credentials

### Step 2: Navigate to OAuth Apps 📱
1. Click on **Settings** or **Pengaturan**
2. Look for **"Application Integration"** or **"Integrasi Aplikasi"**
3. Click **"Add"** or **"Tambah"**

### Step 3: Create OAuth Application 🆕
Fill in the following details:

**Application Name**: `Xendit Integration`

**Redirect URI**: `https://xendit-kledo-integration.vercel.app/api/oauth/callback`

**Scopes**: `read write` (or whatever is available)

### Step 4: Copy Credentials 📋
After creating the app, you'll get:
- **Client ID**: (copy this)
- **Client Secret**: (copy this)

### Step 5: Update Environment Variables 🔧

#### Option A: Use Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find your project: `xendit-kledo-integration`
3. Go to **Settings** → **Environment Variables**
4. Update these variables:

```env
KLEDO_CLIENT_ID=<new-client-id-from-step-4>
KLEDO_CLIENT_SECRET=<new-client-secret-from-step-4>
```

#### Option B: Use Vercel CLI (if installed)
```bash
vercel env add KLEDO_CLIENT_ID production
# Enter your new client ID when prompted

vercel env add KLEDO_CLIENT_SECRET production  
# Enter your new client secret when prompted
```

### Step 6: Redeploy 🚀
After updating environment variables:
```bash
vercel --prod
```

Or trigger a redeploy from Vercel dashboard.

### Step 7: Test OAuth Flow 🧪
1. Visit: `https://xendit-kledo-integration.vercel.app`
2. Click **"Connect to Kledo"**
3. Should redirect to Kledo login page
4. After login, should redirect back with success

## Alternative: Find Existing OAuth App 🔍

If you already created an OAuth app but can't remember where:

### Check these Kledo environments:
1. **Main**: `https://app.kledo.com` → Settings → Application Integration
2. **API**: `https://bagus2.api.kledo.com` → Settings → Application Integration  
3. **Alternative**: Check any other Kledo accounts you might have

Look for an app with redirect URI: `https://xendit-kledo-integration.vercel.app/api/oauth/callback`

## Current Environment Status ✅

Your OAuth implementation is **technically correct**:
- ✅ OAuth authorization endpoint
- ✅ OAuth callback handling  
- ✅ Token management
- ✅ Security measures
- ✅ Environment configuration

**Only missing**: Valid Client ID and Secret for `bagus2.api.kledo.com`

---

**🎯 ACTION REQUIRED**: Create new OAuth app on `bagus2.api.kledo.com` and update environment variables
