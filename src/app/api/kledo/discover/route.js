// Test Kledo API endpoints with authentication to find correct structure
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔍 Testing authenticated Kledo API endpoints...');
    
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
    console.log(`🌐 Testing base URL: ${baseUrl}`);
    
    // Test all possible API endpoints
    const endpointsToTest = [
      // User/Auth endpoints
      { path: '/user', method: 'GET', description: 'User profile' },
      { path: '/me', method: 'GET', description: 'Current user' },
      
      // Contact/Customer endpoints
      { path: '/contacts', method: 'GET', description: 'Contacts list' },
      { path: '/customers', method: 'GET', description: 'Customers list' },
      { path: '/suppliers', method: 'GET', description: 'Suppliers list' },
      
      // Invoice endpoints
      { path: '/invoices', method: 'GET', description: 'Invoices list' },
      { path: '/sales-invoices', method: 'GET', description: 'Sales invoices' },
      { path: '/bills', method: 'GET', description: 'Bills/Purchase invoices' },
      
      // Product endpoints
      { path: '/products', method: 'GET', description: 'Products list' },
      { path: '/items', method: 'GET', description: 'Items list' },
      
      // Payment endpoints
      { path: '/payments', method: 'GET', description: 'Payments list' },
      { path: '/transactions', method: 'GET', description: 'Transactions' },
      
      // Company/Settings
      { path: '/companies', method: 'GET', description: 'Companies' },
      { path: '/settings', method: 'GET', description: 'Settings' },
      
      // Chart of accounts
      { path: '/accounts', method: 'GET', description: 'Chart of accounts' },
      { path: '/coa', method: 'GET', description: 'Chart of accounts (COA)' }
    ];

    const results = [];
    
    for (const endpoint of endpointsToTest) {
      try {
        const url = `${baseUrl}${endpoint.path}`;
        console.log(`🔍 Testing: ${endpoint.method} ${url}`);
        
        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        let responseData = null;
        let responseText = '';
        
        try {
          responseText = await response.text();
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        } catch (e) {
          responseData = { raw: responseText };
        }

        const result = {
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          hasData: responseData && (responseData.data || responseData.length > 0),
          dataStructure: responseData ? Object.keys(responseData).slice(0, 5) : null,
          sampleData: responseData && response.ok ? 
            (responseData.data ? responseData.data.slice(0, 2) : responseData) : null,
          error: !response.ok ? responseData : null
        };

        results.push(result);
        
        // Log important findings
        if (response.ok) {
          console.log(`✅ ${endpoint.path}: ${response.status} - Available`);
          if (responseData && responseData.data) {
            console.log(`   📊 Has ${Array.isArray(responseData.data) ? responseData.data.length : 'data'} records`);
          }
        } else if (response.status === 401) {
          console.log(`🔑 ${endpoint.path}: ${response.status} - Unauthorized (token issue)`);
        } else if (response.status === 403) {
          console.log(`🚫 ${endpoint.path}: ${response.status} - Forbidden (no permission)`);
        } else if (response.status === 404) {
          console.log(`❌ ${endpoint.path}: ${response.status} - Not Found`);
        } else {
          console.log(`❓ ${endpoint.path}: ${response.status} - ${response.statusText}`);
        }
        
      } catch (error) {
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: 0,
          statusText: 'Network Error',
          success: false,
          hasData: false,
          dataStructure: null,
          sampleData: null,
          error: error.message
        });
        console.log(`❌ ${endpoint.path}: Network Error - ${error.message}`);
      }
    }

    // Categorize results
    const workingEndpoints = results.filter(r => r.success);
    const unauthorizedEndpoints = results.filter(r => r.status === 401);
    const forbiddenEndpoints = results.filter(r => r.status === 403);
    const notFoundEndpoints = results.filter(r => r.status === 404);
    const errorEndpoints = results.filter(r => !r.success && r.status !== 401 && r.status !== 403 && r.status !== 404);

    return new Response(JSON.stringify({
      success: true,
      baseUrl: baseUrl,
      accessToken: 'Present',
      summary: {
        total: results.length,
        working: workingEndpoints.length,
        unauthorized: unauthorizedEndpoints.length,
        forbidden: forbiddenEndpoints.length,
        notFound: notFoundEndpoints.length,
        errors: errorEndpoints.length
      },
      workingEndpoints: workingEndpoints.map(r => ({
        endpoint: r.endpoint,
        description: r.description,
        hasData: r.hasData,
        dataStructure: r.dataStructure
      })),
      allResults: results,
      recommendations: {
        contactsEndpoint: workingEndpoints.find(r => r.endpoint.includes('contact') || r.endpoint.includes('customer'))?.endpoint,
        invoicesEndpoint: workingEndpoints.find(r => r.endpoint.includes('invoice'))?.endpoint,
        paymentsEndpoint: workingEndpoints.find(r => r.endpoint.includes('payment'))?.endpoint
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ API endpoint discovery failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
