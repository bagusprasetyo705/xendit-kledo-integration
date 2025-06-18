// API endpoint to test Kledo API structure with valid access token
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔍 Testing Kledo API structure...');
    
    // Get access token
    const { getKledoAccessToken } = await import("@/lib/kledo-service");
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No access token available. Please connect to Kledo first.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = process.env.KLEDO_API_BASE_URL;
    const testEndpoints = [
      '/user',
      '/contacts',
      '/customers', 
      '/invoices',
      '/products',
      '/companies'
    ];

    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = responseText;
        }

        results.push({
          endpoint: endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          data: response.ok ? responseData : null,
          error: !response.ok ? responseData : null
        });

        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        results.push({
          endpoint: endpoint,
          status: 0,
          statusText: 'Network Error',
          success: false,
          data: null,
          error: error.message
        });
        console.log(`${endpoint}: Network Error - ${error.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      baseUrl: baseUrl,
      accessToken: accessToken ? 'Present' : 'Missing',
      endpoints: results,
      workingEndpoints: results.filter(r => r.success),
      failedEndpoints: results.filter(r => !r.success)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ API structure test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
