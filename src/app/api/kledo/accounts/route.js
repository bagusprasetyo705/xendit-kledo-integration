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
    // Handle both array and object responses
    let accountsArray = [];
    if (Array.isArray(accountsData.data)) {
      accountsArray = accountsData.data;
    } else if (Array.isArray(accountsData)) {
      accountsArray = accountsData;
    } else if (accountsData.data && typeof accountsData.data === 'object') {
      // If data is an object with accounts inside
      accountsArray = Object.values(accountsData.data);
    }

    const formattedAccounts = accountsArray.map(account => ({
      id: account.id,
      name: account.name,
      code: account.code,
      type: account.type,
      balance: account.balance,
      active: account.active,
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
