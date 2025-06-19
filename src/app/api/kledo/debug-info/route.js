// API endpoint to get debug information for frontend
import { getKledoAccessToken } from '@/lib/kledo-service';

export async function GET() {
  try {
    console.log('🔍 Fetching debug information...');
    
    const accessToken = await getKledoAccessToken();
    
    const debugInfo = {
      apiUrl: process.env.KLEDO_API_BASE_URL,
      currentAccountId: process.env.KLEDO_FINANCE_ACCOUNT_ID || '1',
      isConnected: !!accessToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
      accessToken: accessToken, // Full token for debugging
      timestamp: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      ...debugInfo
    });

  } catch (error) {
    console.error('❌ Error fetching debug info:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
