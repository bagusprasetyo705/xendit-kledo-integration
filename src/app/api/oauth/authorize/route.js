// Direct OAuth2 authorization endpoint (following PHP demo pattern)
import { cookies } from 'next/headers';

function generateRandomString(length = 40) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function GET(request) {
  try {
    const clientId = process.env.KLEDO_CLIENT_ID;
    const redirectUri = process.env.KLEDO_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({
        error: 'OAuth configuration missing',
        details: 'KLEDO_CLIENT_ID and KLEDO_REDIRECT_URI must be set'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate state for CSRF protection (like PHP demo)
    const state = generateRandomString(40);
    
    // Store state in httpOnly cookie (secure session equivalent)
    const cookieStore = cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    // Build authorization URL exactly like PHP demo
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: '', // Empty scope like PHP demo
      state: state,
    });

    // Fix the OAuth endpoint based on analysis
    // The PHP demo uses API_HOST=http://app.kledo.com/api/v1, but OAuth endpoints are typically at root level
    // Try the correct OAuth endpoint pattern
    const baseHost = 'http://app.kledo.com'; // Base host without /api/v1
    const authorizationUrl = `${baseHost}/oauth/authorize?${authParams.toString()}`;

    console.log('OAuth Authorization Request:', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri,
      state: state.substring(0, 8) + '...',
      authorizationUrl: authorizationUrl.substring(0, 100) + '...'
    });

    // Redirect to Kledo authorization server
    return Response.redirect(authorizationUrl);

  } catch (error) {
    console.error('OAuth authorization error:', error);
    return new Response(JSON.stringify({
      error: 'Authorization failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = 'force-dynamic';
