// app/api/auth/test-callback/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const { pathname } = new URL(request.url);
  
  // Log all parameters received
  const allParams = {};
  for (const [key, value] of searchParams.entries()) {
    allParams[key] = value;
  }
  
  const debugInfo = {
    message: 'OAuth Callback Test Endpoint',
    timestamp: new Date().toISOString(),
    request: {
      fullURL: request.url,
      pathname: pathname,
      method: request.method,
      parameters: allParams,
      parameterCount: Object.keys(allParams).length
    },
    analysis: {
      hasCode: !!searchParams.get('code'),
      hasState: !!searchParams.get('state'),
      hasError: !!searchParams.get('error'),
      errorType: searchParams.get('error') || 'none',
      errorDescription: searchParams.get('error_description') || 'none'
    },
    expectedParameters: {
      code: 'Authorization code from Kledo',
      state: 'Random state for security',
      possibleErrors: ['access_denied', 'invalid_request', 'unauthorized_client']
    },
    nextSteps: allParams.code ? 
      'Code received! OAuth flow working correctly.' : 
      'No code parameter - check Kledo OAuth configuration.'
  };
  
  console.log('OAuth Test Callback Debug:', debugInfo);
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

export const dynamic = 'force-dynamic';
