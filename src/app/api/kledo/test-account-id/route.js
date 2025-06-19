// Test endpoint to verify finance account ID logic
import { getKledoAccessToken } from '@/lib/kledo-service';

// Helper function to get the same logic as getDefaultFinanceAccountId
async function testFinanceAccountId(accessToken) {
  try {
    console.log('🔍 Testing finance account ID logic...');
    
    // Use environment variable if set, otherwise fallback to account ID 1
    const configuredAccountId = process.env.KLEDO_FINANCE_ACCOUNT_ID || '1';
    const fixedAccountId = parseInt(configuredAccountId); // Ensure it's a number
    
    console.log(`💡 Using finance account ID from config: ${fixedAccountId}`);
    
    // Test validation API call
    let validationResult = null;
    try {
      const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts/${fixedAccountId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "X-APP": "finance",
        },
      });

      validationResult = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };

      if (response.ok) {
        const result = await response.json();
        validationResult.data = result;
        console.log(`✅ Account validation successful:`, result);
      } else {
        const errorText = await response.text();
        validationResult.error = errorText;
        console.log(`❌ Account validation failed:`, errorText);
      }
    } catch (validationError) {
      validationResult = {
        error: validationError.message
      };
      console.warn(`⚠️ Account validation failed:`, validationError.message);
    }
    
    return {
      configuredAccountId,
      fixedAccountId,
      typeOfAccountId: typeof fixedAccountId,
      validation: validationResult
    };
    
  } catch (error) {
    console.error('❌ Error testing finance account ID:', error);
    return {
      error: error.message,
      fallbackAccountId: 1
    };
  }
}

export async function GET() {
  try {
    console.log('🔍 Testing finance account ID configuration...');
    
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      return Response.json({
        success: false,
        error: "No Kledo access token available. Please authenticate with Kledo first.",
        debug: {
          hasAccessToken: false,
          envVars: {
            KLEDO_FINANCE_ACCOUNT_ID: process.env.KLEDO_FINANCE_ACCOUNT_ID,
            KLEDO_API_BASE_URL: process.env.KLEDO_API_BASE_URL
          }
        }
      }, { status: 401 });
    }

    const testResult = await testFinanceAccountId(accessToken);
    
    // Test what would be sent in invoice creation
    const invoiceItem = {
      finance_account_id: testResult.fixedAccountId,
      tax_id: 0,
      desc: "Test item",
      qty: 1,
      price: 100000,
      amount: 100000,
    };

    return Response.json({
      success: true,
      test: testResult,
      sampleInvoiceItem: invoiceItem,
      debug: {
        hasAccessToken: true,
        accessTokenPreview: accessToken.substring(0, 20) + '...',
        envVars: {
          KLEDO_FINANCE_ACCOUNT_ID: process.env.KLEDO_FINANCE_ACCOUNT_ID,
          KLEDO_API_BASE_URL: process.env.KLEDO_API_BASE_URL
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in finance account test:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
