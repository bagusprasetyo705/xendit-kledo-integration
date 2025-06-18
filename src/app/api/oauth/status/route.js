// OAuth status endpoint 
import { getStoredTokens, clearStoredTokens } from '@/lib/oauth-tokens';

export async function GET(request) {
  try {
    const tokens = getStoredTokens();
    
    return new Response(JSON.stringify({
      connected: tokens.is_connected,
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      token_type: tokens.token_type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return new Response(JSON.stringify({
      error: 'Failed to check OAuth status',
      connected: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request) {
  try {
    const success = clearStoredTokens();
    
    return new Response(JSON.stringify({
      success,
      message: success ? 'OAuth tokens cleared' : 'Failed to clear tokens'
    }), {
      status: success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error clearing OAuth tokens:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to clear OAuth tokens'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = 'force-dynamic';
