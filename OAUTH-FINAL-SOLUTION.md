# 🔧 CREATE NEW OAUTH APP - FINAL SOLUTION

## ✅ CONFIRMED ISSUE
The client ID `9f2ee85a-8a4f-452f-9be7-13df140198f4` returns `"invalid_client"` because it was created on a different Kledo environment.

## 🎯 SOLUTION STEPS

### Step 1: Create OAuth App on Correct Domain

1. **Login to Kledo**: Go to `https://bagus2.api.kledo.com`
2. **Navigate to Settings**: Look for "Settings" or "Pengaturan"
3. **Find OAuth/API Section**: Look for:
   - "Application Integration" 
   - "Integrasi Aplikasi"
   - "API Keys"
   - "Developer Settings"

4. **Create New Application**:
   ```
   Application Name: Xendit Integration
   Redirect URI: https://xendit-kledo-integration.vercel.app/api/oauth/callback
   Scopes: Select all available (read, write, etc.)
   ```

### Step 2: Test New Credentials
After getting new Client ID and Client Secret, run:
```bash
./test-new-oauth.sh "YOUR_NEW_CLIENT_ID" "YOUR_NEW_CLIENT_SECRET"
```

### Step 3: Update Environment Variables
Replace in `.env.production`:
```bash
KLEDO_CLIENT_ID=YOUR_NEW_CLIENT_ID
KLEDO_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET
```

### Step 4: Deploy to Vercel
```bash
vercel --prod
```

## 🔍 VERIFICATION
After updating:
1. Visit: `https://xendit-kledo-integration.vercel.app`
2. Click "Connect to Kledo"
3. Should show Kledo login page (not blank!)
4. Complete OAuth flow

## 📞 ALTERNATIVE
If you can't find OAuth settings in Kledo:
1. Contact Kledo support
2. Ask for "OAuth application registration" 
3. Provide redirect URI: `https://xendit-kledo-integration.vercel.app/api/oauth/callback`

---

**🚀 The technical implementation is COMPLETE - we just need valid OAuth credentials!**
