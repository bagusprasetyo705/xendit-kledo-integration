// app/api/auth/[...nextauth]/route.js
// Simplified auth for production compatibility
export const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const { pathname } = new URL(request.url);
  
  // Handle signin request
  if (pathname.includes('signin') || searchParams.get('callbackUrl')) {
    const clientId = process.env.KLEDO_CLIENT_ID;
    const redirectUri = process.env.KLEDO_REDIRECT_URI;
    const state = Math.random().toString(36).substring(7);
    
    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({
        error: 'Kledo OAuth not configured. Please set KLEDO_CLIENT_ID and KLEDO_REDIRECT_URI'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const authUrl = `https://bagus2.api.kledo.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=read+write&` +
      `state=${state}`;
    
    return Response.redirect(authUrl);
  }
  
  // Handle callback
  if (pathname.includes('callback')) {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('OAuth Callback Debug Info:', {
      pathname,
      code: code ? 'Present' : 'Missing',
      state: state ? 'Present' : 'Missing',
      error,
      errorDescription,
      fullURL: request.url
    });
    
    // Check for OAuth errors from Kledo
    if (error) {
      console.error('OAuth Error from Kledo:', error, errorDescription);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=${error}&description=${encodeURIComponent(errorDescription || '')}`);
    }
    
    if (!code) {
      console.error('No authorization code received from Kledo');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=no_code&description=${encodeURIComponent('No authorization code received from Kledo')}`);
    }
    
    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://bagus2.api.kledo.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.KLEDO_REDIRECT_URI,
          client_id: process.env.KLEDO_CLIENT_ID,
          client_secret: process.env.KLEDO_CLIENT_SECRET,
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }
      
      const tokens = await tokenResponse.json();
      
      // For now, just redirect back to home with success
      // In a full implementation, you'd store the tokens securely
      return Response.redirect(`${process.env.NEXTAUTH_URL}?auth=success`);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=callback_error`);
    }
  }
  
  return new Response(JSON.stringify({ 
    message: 'Auth endpoint ready',
    endpoints: {
      signin: '/api/auth/signin',
      callback: '/api/auth/callback/kledo'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request) {
  return new Response(JSON.stringify({ 
    message: 'Auth endpoint ready' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const dynamic = 'force-dynamic';
