# Kledo OAuth 2.0 Integration Setup Guide

This guide will help you set up the OAuth 2.0 integration with Kledo API for the Xendit to Kledo transaction sync.

## Prerequisites

1. **Kledo Account**: You need an active Kledo account
2. **Developer Access**: Access to Kledo's developer dashboard
3. **API Documentation**: Familiarize yourself with [Kledo API Documentation](https://bagus2.api.kledo.com/documentation)

## Step 1: Create Kledo OAuth Application

1. **Login to Kledo Developer Dashboard**
   - Visit the Kledo developer portal
   - Login with your Kledo credentials

2. **Create New OAuth Application**
   - Navigate to OAuth applications section
   - Click "Create New Application"
   - Fill in the application details:
     - **Application Name**: `Xendit Integration`
     - **Description**: `Automatic sync of Xendit payments to Kledo invoices`
     - **Application Type**: `Web Application`

3. **Configure OAuth Settings**
   - **Authorization Callback URL**: 
     - Development: `http://localhost:3000/api/auth/callback/kledo`
     - Production: `https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo`
   - **Scopes**: Request the following scopes:
     - `read` - Read access to view data
     - `write` - Write access to create invoices and payments

4. **Save and Get Credentials**
   - After creating the application, you'll receive:
     - **Client ID**: Copy this value
     - **Client Secret**: Copy this value (keep it secure!)

## Step 2: Update Environment Variables

Update your `.env` file with the Kledo OAuth credentials:

```env
# Kledo OAuth Configuration
KLEDO_CLIENT_ID=your_actual_client_id_here
KLEDO_CLIENT_SECRET=your_actual_client_secret_here
KLEDO_API_BASE_URL=https://bagus2.api.kledo.com/api/v1
KLEDO_REDIRECT_URI=http://localhost:3000/api/auth/callback/kledo

# For production deployment
# KLEDO_REDIRECT_URI=https://xendit-kledo-integration.vercel.app/api/auth/callback/kledo
# NEXTAUTH_URL=https://xendit-kledo-integration.vercel.app
```

## Step 3: OAuth 2.0 Flow Implementation

The integration uses the standard OAuth 2.0 Authorization Code flow:

### 1. Authorization Request
When users click "Connect to Kledo", they're redirected to:
```
https://bagus2.api.kledo.com/oauth/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=read+write&
  state=RANDOM_STATE
```

### 2. Authorization Code Exchange
After user approval, Kledo redirects back with an authorization code:
```
http://localhost:3000/api/auth/callback/kledo?code=AUTHORIZATION_CODE&state=STATE
```

### 3. Access Token Request
Exchange the authorization code for an access token:
```bash
POST https://bagus2.api.kledo.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=YOUR_REDIRECT_URI&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

### 4. API Requests
Use the access token for API requests:
```bash
GET https://bagus2.api.kledo.com/api/v1/user
Authorization: Bearer ACCESS_TOKEN
```

## Step 4: Test the Integration

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Open the Dashboard**
   - Navigate to `http://localhost:3000`
   - Click "Connect to Kledo"
   - You should be redirected to Kledo's OAuth page

3. **Authorize the Application**
   - Login to your Kledo account
   - Grant the requested permissions
   - You should be redirected back to the dashboard

4. **Verify Connection**
   - After successful authentication, you should see "Connected to Kledo API"
   - The manual sync button should be enabled

## Step 5: API Endpoints Used

The integration interacts with these Kledo API endpoints:

### Authentication
- `POST /oauth/token` - Get access token
- `POST /oauth/token` - Refresh access token

### User Information
- `GET /user` - Get user profile

### Contacts/Customers
- `GET /contacts` - Search for existing customers
- `POST /contacts` - Create new customer

### Invoices
- `POST /invoices` - Create new invoice
- `GET /invoices` - List invoices

### Payments
- `POST /payments` - Record payment for invoice

## Step 6: Data Mapping

When a Xendit payment is received, the system:

1. **Creates/Finds Customer**
   - Uses the payer email from Xendit
   - Searches for existing customer in Kledo
   - Creates new customer if not found

2. **Creates Invoice**
   - Maps Xendit payment data to Kledo invoice format
   - Sets invoice date to current date
   - Adds payment details as line items

3. **Records Payment**
   - Marks the invoice as paid
   - Records the payment date
   - Links to original Xendit transaction

## Troubleshooting

### Common Issues

1. **Invalid Client Credentials**
   - Verify `KLEDO_CLIENT_ID` and `KLEDO_CLIENT_SECRET`
   - Check if they match your Kledo OAuth app

2. **Redirect URI Mismatch**
   - Ensure `KLEDO_REDIRECT_URI` matches exactly in:
     - Environment variables
     - Kledo OAuth app configuration
     - No trailing slashes

3. **Scope Issues**
   - Verify your OAuth app has `read` and `write` scopes
   - Check if your Kledo account has necessary permissions

4. **Token Expiration**
   - Access tokens expire after a certain period
   - Implement refresh token logic for production

### Debug Mode

Enable debug logging by setting:
```env
NEXTAUTH_DEBUG=true
```

This will provide detailed logs of the OAuth flow.

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use secure environment variable management in production

2. **HTTPS Required**
   - Always use HTTPS in production
   - Kledo may reject HTTP redirect URIs in production

3. **Token Storage**
   - Access tokens are stored in NextAuth.js sessions
   - Consider implementing secure token refresh logic

4. **Webhook Security**
   - Verify webhook signatures from Xendit
   - Use HTTPS endpoints for webhooks

## Production Deployment

When deploying to production:

1. **Update Environment Variables**
   ```env
   NEXTAUTH_URL=https://your-domain.com
   KLEDO_REDIRECT_URI=https://your-domain.com/api/auth/callback/kledo
   ```

2. **Update Kledo OAuth App**
   - Change redirect URI to production URL
   - Verify production domain

3. **Update Xendit Webhook**
   - Set webhook URL to: `https://your-domain.com/api/xendit/webhook`
   - Ensure webhook token is configured

## Support

For issues related to:
- **Kledo API**: Contact Kledo support or check their documentation
- **Xendit API**: Contact Xendit support
- **Integration Issues**: Check the application logs and error messages
