// API endpoint to update the fixed finance account ID using environment variables
import { getKledoAccessToken } from '@/lib/kledo-service';

export async function POST(request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return Response.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔧 Updating fixed finance account ID to: ${accountId}`);
    
    // Validate the account ID exists in Kledo first
    const accessToken = await getKledoAccessToken();
    if (!accessToken) {
      return Response.json(
        { success: false, error: "No Kledo access token available" },
        { status: 401 }
      );
    }

    // Validate the account exists
    const validateResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*',
        'X-APP': 'finance',
      },
    });

    if (!validateResponse.ok) {
      return Response.json(
        { success: false, error: `Account ID ${accountId} does not exist in Kledo` },
        { status: 400 }
      );
    }

    const accountData = await validateResponse.json();
    console.log(`✅ Account validated: ${accountData.data?.name}`);

    // Store the account ID in runtime environment (this will persist for the current session)
    // Note: In production, you'd want to store this in a database or use a proper configuration management system
    process.env.KLEDO_FINANCE_ACCOUNT_ID = accountId.toString();
    
    console.log(`✅ Successfully updated finance account ID to: ${accountId}`);
    
    return Response.json({
      success: true,
      message: `Finance account ID updated to ${accountId}`,
      accountName: accountData.data?.name,
      previousId: process.env.KLEDO_FINANCE_ACCOUNT_ID || '1',
      note: "Account ID updated for current session. For permanent changes, update your environment variables."
    });

  } catch (error) {
    console.error('❌ Error updating finance account ID:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
