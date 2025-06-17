# Xendit to Kledo Integration

This Next.js application automatically syncs paid transactions from Xendit to Kledo using OAuth 2.0 authentication and webhooks.

## Features

- 🔐 OAuth 2.0 authentication with Kledo
- 🚀 Automatic webhook processing from Xendit
- 📊 Dashboard to view recent transfers
- 🔄 Manual sync trigger
- 📱 Responsive design with Tailwind CSS

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=your_xendit_secret_key_here
XENDIT_WEBHOOK_TOKEN=your_xendit_webhook_token_here

# Kledo OAuth Configuration
KLEDO_CLIENT_ID=your_kledo_client_id_here
KLEDO_CLIENT_SECRET=your_kledo_client_secret_here
KLEDO_API_BASE_URL=https://api.kledo.com
KLEDO_REDIRECT_URI=http://localhost:3000/api/auth/callback/kledo

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Kledo OAuth Setup

1. Go to your Kledo developer dashboard
2. Create a new OAuth application
3. Set the redirect URI to: `http://localhost:3000/api/auth/callback/kledo`
4. Copy the Client ID and Client Secret to your `.env.local`

### 3. Xendit Setup

1. Get your Xendit Secret Key from the Xendit dashboard
2. Set up a webhook endpoint: `https://your-domain.com/api/xendit/webhook`
3. Generate a webhook token for security
4. Configure the webhook to send invoice payment notifications

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### 1. Deploy to Vercel

```bash
vercel --prod
```

### 2. Set Environment Variables

In your Vercel dashboard, add all the environment variables from your `.env.local` file.

**Important**: Update these variables for production:

```env
NEXTAUTH_URL=https://your-app-name.vercel.app
KLEDO_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback/kledo
```

### 3. Update Webhook URL

Update your Xendit webhook URL to: `https://your-app-name.vercel.app/api/xendit/webhook`

## How It Works

1. **Authentication**: Users authenticate with Kledo using OAuth 2.0
2. **Webhook Processing**: When a payment is made in Xendit, a webhook is sent to `/api/xendit/webhook`
3. **Data Transfer**: The webhook handler processes the payment and creates an invoice in Kledo
4. **Dashboard**: Users can view recent transfers and manually trigger syncs

## API Endpoints

- `GET /` - Dashboard page
- `POST /api/xendit/webhook` - Xendit webhook handler
- `POST /api/sync/trigger` - Manual sync trigger
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication routes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with custom OAuth provider
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API
- **Deployment**: Vercel

## Troubleshooting

### 404 Error on Vercel

If you get a 404 error on Vercel deployment:

1. Check that your `vercel.json` is configured correctly
2. Ensure all environment variables are set in Vercel dashboard
3. Verify the build process completed successfully
4. Check Vercel function logs for errors

### OAuth Issues

1. Verify redirect URIs match exactly
2. Check client ID and secret are correct
3. Ensure Kledo OAuth app is configured properly
4. Check NEXTAUTH_SECRET is set and unique

### Webhook Issues

1. Verify webhook URL is accessible publicly
2. Check webhook token matches
3. Ensure webhook is configured in Xendit dashboard
4. Check webhook payload format matches expected structure

## Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth.js routes
│   │   ├── xendit/webhook/         # Xendit webhook handler
│   │   └── sync/trigger/           # Manual sync endpoint
│   ├── layout.js                   # Root layout
│   └── page.js                     # Dashboard page
├── components/
│   ├── Providers.js               # Session provider wrapper
│   └── SyncStatus.js              # Transfer status table
└── lib/
    └── kledo-service.js           # Kledo API integration
```

### Adding Features

- Add database integration for persistent transfer logs
- Implement retry logic for failed transfers
- Add email notifications for transfer status
- Create detailed transfer history with filtering

## License

MIT License
