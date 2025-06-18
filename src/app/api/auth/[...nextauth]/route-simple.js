// app/api/auth/[...nextauth]/route.js
// Temporary simplified auth for production build
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  if (searchParams.get('action') === 'signin') {
    // Redirect to Kledo OAuth
    const clientId = process.env.KLEDO_CLIENT_ID;
    const redirectUri = process.env.KLEDO_REDIRECT_URI;
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://bagus2.api.kledo.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=read+write&` +
      `state=${state}`;
    
    return Response.redirect(authUrl);
  }
  
  return new Response(JSON.stringify({ 
    message: 'Auth endpoint - use action=signin to authenticate' 
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
