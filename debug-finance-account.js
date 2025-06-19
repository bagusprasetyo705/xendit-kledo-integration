// Debug script to check finance account ID
import { getKledoAccessToken } from './src/lib/kledo-service.js';

async function debugFinanceAccount() {
  try {
    console.log('🔍 Testing finance account ID logic...');
    
    const accessToken = await getKledoAccessToken();
    if (!accessToken) {
      console.error('❌ No access token available');
      return;
    }

    // Test the same logic as in getDefaultFinanceAccountId
    console.log('Environment variable KLEDO_FINANCE_ACCOUNT_ID:', process.env.KLEDO_FINANCE_ACCOUNT_ID);
    
    const configuredAccountId = process.env.KLEDO_FINANCE_ACCOUNT_ID || '1';
    const fixedAccountId = parseInt(configuredAccountId);
    
    console.log('Configured account ID (string):', configuredAccountId);
    console.log('Fixed account ID (number):', fixedAccountId);
    console.log('Type of fixed account ID:', typeof fixedAccountId);
    
    // Test validation API call
    console.log('\n🔍 Testing account validation...');
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts/${fixedAccountId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "X-APP": "finance",
      },
    });

    console.log('Validation response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Account validation successful:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Account validation failed:', errorText);
    }
    
    // Test what would be sent in invoice creation
    console.log('\n📋 Testing invoice item structure...');
    const invoiceItem = {
      finance_account_id: fixedAccountId,
      tax_id: 0,
      desc: "Test item",
      qty: 1,
      price: 100000,
      amount: 100000,
    };
    
    console.log('Invoice item that would be sent:', JSON.stringify(invoiceItem, null, 2));
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugFinanceAccount();
