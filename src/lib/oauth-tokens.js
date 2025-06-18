// OAuth token management utilities
import { cookies } from 'next/headers';

export function getStoredTokens() {
  try {
    const cookieStore = cookies();
    
    const accessToken = cookieStore.get('kledo_access_token')?.value;
    const refreshToken = cookieStore.get('kledo_refresh_token')?.value;
    const tokenType = cookieStore.get('kledo_token_type')?.value;
    const isConnected = cookieStore.get('kledo_connected')?.value === 'true';
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType || 'Bearer',
      is_connected: isConnected && !!accessToken
    };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return {
      access_token: null,
      refresh_token: null,
      token_type: 'Bearer',
      is_connected: false
    };
  }
}

export function clearStoredTokens() {
  try {
    const cookieStore = cookies();
    
    cookieStore.delete('kledo_access_token');
    cookieStore.delete('kledo_refresh_token'); 
    cookieStore.delete('kledo_token_type');
    cookieStore.delete('kledo_connected');
    
    return true;
  } catch (error) {
    console.error('Error clearing stored tokens:', error);
    return false;
  }
}

export async function refreshAccessToken() {
  try {
    const tokens = getStoredTokens();
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.KLEDO_CLIENT_ID,
      client_secret: process.env.KLEDO_CLIENT_SECRET,
      scope: '',
    });

    const apiHost = process.env.KLEDO_API_HOST || 'http://app.kledo.com/api/v1';
    const tokenUrl = `${apiHost}/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const newTokens = await response.json();
    
    // Store new tokens
    const cookieStore = cookies();
    const tokenExpiry = new Date(Date.now() + (newTokens.expires_in * 1000));
    
    cookieStore.set('kledo_access_token', newTokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    if (newTokens.refresh_token) {
      cookieStore.set('kledo_refresh_token', newTokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    cookieStore.set('kledo_token_type', newTokens.token_type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    cookieStore.set('kledo_connected', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: tokenExpiry
    });

    return {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_type: newTokens.token_type,
      is_connected: true
    };

  } catch (error) {
    console.error('Error refreshing access token:', error);
    // Clear invalid tokens
    clearStoredTokens();
    return null;
  }
}
