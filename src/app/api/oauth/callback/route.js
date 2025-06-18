// OAuth2 callback endpoint (following PHP demo pattern)
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('OAuth Callback Debug:', {
      code: code ? 'Present' : 'Missing',
      state: state ? 'Present' : 'Missing',
      error,
      errorDescription,
      url: request.url
    });

    // Check for OAuth errors from Kledo
    if (error) {
      console.error('OAuth Error from Kledo:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}?error=${error}&description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    // Check if authorization code is present
    if (!code) {
      console.error('No authorization code received from Kledo');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}?error=no_code&description=${encodeURIComponent('No authorization code received from Kledo')}`
      );
    }

    // Validate state parameter (CSRF protection like PHP demo)
    const cookieStore = cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    console.log('State validation:', {
      received: state?.substring(0, 8) + '...',
      stored: storedState?.substring(0, 8) + '...',
      match: state === storedState
    });

    if (!storedState || !state || state !== storedState) {
      console.error('Invalid state parameter - possible CSRF attack');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}?error=invalid_state&description=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    // Clear the state cookie
    cookieStore.delete('oauth_state');

    // Exchange authorization code for access token (like PHP demo)
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KLEDO_CLIENT_ID,
      client_secret: process.env.KLEDO_CLIENT_SECRET,
      redirect_uri: process.env.KLEDO_REDIRECT_URI,
      code: code,
    });

    const apiHost = process.env.KLEDO_API_HOST || 'http://app.kledo.com/api/v1';
    const tokenUrl = `${apiHost}/oauth/token`;

    console.log('Token exchange request to:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}?error=token_exchange_failed&description=${encodeURIComponent('Failed to exchange code for token')}`
      );
    }

    const tokens = await tokenResponse.json();
    
    console.log('Token exchange successful:', {
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token
    });

    // Store tokens in secure httpOnly cookies (like PHP demo session)
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
    
    cookieStore.set('kledo_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    if (tokens.refresh_token) {
      cookieStore.set('kledo_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    cookieStore.set('kledo_token_type', tokens.token_type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    // Store connection status for the dashboard
    cookieStore.set('kledo_connected', 'true', {
      httpOnly: false, // Allow client-side access for dashboard
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?auth=success`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}?error=callback_error&description=${encodeURIComponent('OAuth callback processing failed')}`
    );
  }
}

export const dynamic = 'force-dynamic';
