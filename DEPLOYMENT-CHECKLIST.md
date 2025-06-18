# 🚀 Deployment Checklist for xendit-kledo-integration.vercel.app

## 📋 Pre-Deployment Setup

### 1. Kledo OAuth Application Configuration

**Add these redirect URIs to your Kledo OAuth app:**

✅ **Development URI:**
```
http://localhost:3000/api/auth/callback/kledo
```

✅ **Production URI:**
```
https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo
```

**Important:** Your Kledo OAuth app should have BOTH URIs configured to support development and production.

### 2. Vercel Environment Variables

In your Vercel dashboard, set these environment variables:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_production_0G8CNWxScTl5TF2uYtw4nIYqSasUv9irnteyx62XWH6eYHQ8UuVWRQmFdn5uhy3S
XENDIT_WEBHOOK_TOKEN=53fc1630cafbca77f3f02acba347e71c5c6a9b39f7298f2d915ac4db163cbbaf

# Kledo OAuth Configuration
KLEDO_API_BASE_URL=https://bagus2.api.kledo.com/api/v1
KLEDO_CLIENT_ID=your_actual_client_id_here
KLEDO_CLIENT_SECRET=your_actual_client_secret_here
KLEDO_REDIRECT_URI=https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo

# NextAuth Configuration
NEXTAUTH_SECRET=XCQSeQg5hXE+iEDsIT+0um0Eu8knKRdPYp4HegsFooI=
NEXTAUTH_URL=https://xendit-kledo-integration.vercel.app
```

### 3. Xendit Webhook Configuration

**Update your Xendit webhook URL to:**
```
https://xendit-kledo-integration.vercel.app/api/xendit/webhook
```

## 🚀 Deployment Steps

### 1. Deploy to Vercel
```bash
# If not already connected to Vercel
vercel login
vercel link

# Deploy to production
vercel --prod
```

### 2. Verify Environment Variables
- Go to Vercel dashboard → Project → Settings → Environment Variables
- Ensure all variables are set correctly
- **Double-check the KLEDO_REDIRECT_URI and NEXTAUTH_URL**

### 3. Test the Deployment

1. **Visit your production URL:**
   ```
   https://xendit-kledo-integration.vercel.app
   ```

2. **Test OAuth Flow:**
   - Click "Connect to Kledo"
   - Should redirect to Kledo OAuth page
   - After authorization, should redirect back to dashboard

3. **Test API Endpoints:**
   - Health check: `https://xendit-kledo-integration.vercel.app/api/health`
   - Kledo test: `https://xendit-kledo-integration.vercel.app/api/kledo/test` (requires auth)

## 🔧 Post-Deployment Configuration

### 1. Update Xendit Dashboard
- Set webhook URL to: `https://xendit-kledo-integration.vercel.app/api/xendit/webhook`
- Ensure webhook token matches `XENDIT_WEBHOOK_TOKEN`
- Test webhook by creating a test payment

### 2. Test End-to-End Flow
1. Create a test payment in Xendit
2. Verify webhook is received (check Vercel function logs)
3. Confirm invoice is created in Kledo
4. Verify invoice is marked as paid

## ✅ Verification Checklist

- [ ] Vercel deployment successful
- [ ] All environment variables set in Vercel
- [ ] Kledo OAuth app has production redirect URI
- [ ] Xendit webhook URL updated to production
- [ ] OAuth flow works on production
- [ ] Webhook receives and processes payments
- [ ] Invoices created successfully in Kledo
- [ ] Manual sync function works

## 🔍 Troubleshooting

### Common Issues:

1. **OAuth callback error (redirect_uri_mismatch)**
   - Verify Kledo OAuth app has exact URI: `https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo`
   - Check no trailing slashes

2. **NextAuth configuration error**
   - Ensure `NEXTAUTH_URL=https://xendit-kledo-integration.vercel.app`
   - Verify `NEXTAUTH_SECRET` is set

3. **Webhook not working**
   - Check Vercel function logs
   - Verify webhook URL in Xendit dashboard
   - Confirm webhook token matches

### Debug Commands:

```bash
# Check Vercel deployment logs
vercel logs

# View environment variables (in dashboard)
# Vercel Dashboard → Project → Settings → Environment Variables
```

## 📱 Testing URLs

**Production URLs to test:**
- Dashboard: https://xendit-kledo-integration.vercel.app
- Health: https://xendit-kledo-integration.vercel.app/api/health
- OAuth: https://xendit-kledo-integration.vercel.app/api/auth/signin/kledo

**Webhook URL for Xendit:**
```
https://xendit-kledo-integration.vercel.app/api/xendit/webhook
```

---

🎉 **Your app is ready for production at:** https://xendit-kledo-integration.vercel.app
