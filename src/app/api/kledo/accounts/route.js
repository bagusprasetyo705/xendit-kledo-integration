// API endpoint to fetch Kledo finance accounts
import { getKledoAccessToken } from '@/lib/kledo-service';

export async function GET() {
  try {
    console.log('🔍 Fetching Kledo finance accounts...');
    
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      return Response.json(
        { success: false, error: "No Kledo access token available. Please authenticate with Kledo first." },
        { status: 401 }
      );
    }

    // Fetch finance accounts using the exact curl example provided
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`, // Use Bearer token format
        'X-APP': 'finance',
        // Note: X-CSRF-TOKEN is not needed for server-to-server API calls
      },
    });

    console.log(`📊 Finance accounts API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch finance accounts:', response.status, errorText);
      return Response.json(
        { success: false, error: `Failed to fetch accounts: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const accountsData = await response.json();
    console.log('✅ Finance accounts fetched successfully:', accountsData);

    // Format the accounts data for easy display
    // Handle the nested structure: data.data.data
    let accountsArray = [];
    
    // Check the three-level nested structure first
    if (accountsData.data && accountsData.data.data && Array.isArray(accountsData.data.data)) {
      accountsArray = accountsData.data.data;
      console.log(`📋 Found ${accountsArray.length} accounts in data.data.data structure`);
    } 
    // Fallback to two-level nested structure
    else if (Array.isArray(accountsData.data)) {
      accountsArray = accountsData.data;
      console.log(`📋 Found ${accountsArray.length} accounts in data structure`);
    } 
    // Fallback to direct array
    else if (Array.isArray(accountsData)) {
      accountsArray = accountsData;
      console.log(`📋 Found ${accountsArray.length} accounts in direct array`);
    } 
    // Handle object with accounts inside
    else if (accountsData.data && typeof accountsData.data === 'object') {
      accountsArray = Object.values(accountsData.data);
      console.log(`📋 Found ${accountsArray.length} accounts in object structure`);
    }

    // Validate that we have an array before mapping
    if (!Array.isArray(accountsArray)) {
      console.error('❌ Could not find accounts array in response:', accountsData);
      return Response.json({
        success: false,
        error: 'Invalid accounts data structure received from Kledo API',
        debug: accountsData
      }, { status: 500 });
    }

    const formattedAccounts = accountsArray.map(account => ({
      id: account.id,
      name: account.name || 'Unknown',
      code: account.code || '',
      type: account.type || '',
      balance: account.balance || 0,
      active: account.active !== undefined ? account.active : true,
      description: account.description || '',
      category: account.category || '',
      parent_id: account.parent_id || null,
    }));

    return Response.json({
      success: true,
      accounts: formattedAccounts,
      total: formattedAccounts.length,
      message: `Found ${formattedAccounts.length} finance accounts`
    });

  } catch (error) {
    console.error('❌ Error fetching finance accounts:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
