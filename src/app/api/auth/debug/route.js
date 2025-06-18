// app/api/auth/debug/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      KLEDO_CLIENT_ID: process.env.KLEDO_CLIENT_ID ? 'Set' : 'Missing',
      KLEDO_CLIENT_SECRET: process.env.KLEDO_CLIENT_SECRET ? 'Set' : 'Missing',
      KLEDO_REDIRECT_URI: process.env.KLEDO_REDIRECT_URI || 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
    },
    expectedOAuthFlow: {
      authorizationURL: 'https://bagus2.api.kledo.com/oauth/authorize',
      tokenURL: 'https://bagus2.api.kledo.com/oauth/token',
      userInfoURL: 'https://bagus2.api.kledo.com/api/v1/user',
      redirectURI: process.env.KLEDO_REDIRECT_URI,
      scopes: 'read write'
    },
    testURLs: {
      signin: `${process.env.NEXTAUTH_URL}/api/auth/signin`,
      callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/kledo`,
      dashboard: process.env.NEXTAUTH_URL
    },
    troubleshooting: {
      commonIssues: [
        'Kledo OAuth app redirect URI mismatch',
        'Invalid client credentials',
        'Insufficient OAuth scopes',
        'Kledo account permissions',
        'URL encoding issues'
      ],
      checkList: [
        'Verify Kledo OAuth app has exact redirect URI',
        'Confirm client ID and secret are correct',
        'Ensure Kledo account has API access',
        'Check browser network tab for errors',
        'Verify no ad blockers interfering'
      ]
    }
  };
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

export const dynamic = 'force-dynamic';
