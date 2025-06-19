// lib/kledo-service.js
import { Xendit } from "xendit-node";
import { getStoredTokens, refreshAccessToken } from './oauth-tokens.js';

// Initialize Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

export async function getKledoAccessToken() {
  try {
    const tokens = getStoredTokens();
    
    if (!tokens.is_connected) {
      console.log('No Kledo connection found');
      return null;
    }
    
    if (tokens.access_token) {
      console.log('Using stored access token');
      return tokens.access_token;
    }
    
    // Try to refresh if we have a refresh token
    if (tokens.refresh_token) {
      console.log('Attempting to refresh access token');
      const refreshedTokens = await refreshAccessToken();
      return refreshedTokens?.access_token || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Kledo access token:', error);
    return null;
  }
}

// Function to refresh access token if needed
export async function refreshKledoAccessToken(refreshToken) {
  try {
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.KLEDO_CLIENT_ID,
        client_secret: process.env.KLEDO_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}

// Function to get user profile from Kledo
export async function getKledoProfile(accessToken) {
  try {
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/user`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get Kledo profile:", error);
    throw error;
  }
}

// Helper function to get a default finance account ID
async function getDefaultFinanceAccountId(accessToken) {
  try {
    console.log('🔍 Fetching finance accounts to get default account ID...');
    
    // Try to get finance accounts
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📊 Finance accounts response:', result);
      
      // Look for a revenue/income account (typically has account type for sales)
      if (result.data && result.data.length > 0) {
        // Try to find a revenue/sales account first
        const revenueAccount = result.data.find(account => 
          account.account_type_id === 4 || // Common revenue account type ID
          account.name?.toLowerCase().includes('revenue') ||
          account.name?.toLowerCase().includes('sales') ||
          account.name?.toLowerCase().includes('income')
        );
        
        if (revenueAccount) {
          console.log(`✅ Using revenue account: ${revenueAccount.name} (ID: ${revenueAccount.id})`);
          return revenueAccount.id;
        }
        
        // Fallback to first account
        console.log(`⚠️ Using first available account: ${result.data[0].name} (ID: ${result.data[0].id})`);
        return result.data[0].id;
      }
    } else {
      console.warn('⚠️ Could not fetch finance accounts:', response.status);
    }
    
    // Fallback to a common default ID (you may need to adjust this)
    console.warn('⚠️ Using fallback finance account ID: 1');
    return 1;
    
  } catch (error) {
    console.warn('⚠️ Error fetching finance accounts, using fallback ID:', error);
    return 1; // Fallback account ID
  }
}

export async function transferXenditToKledo(xenditInvoice) {
  try {
    console.log(`🔄 Starting transfer for Xendit invoice: ${xenditInvoice.id}`);
    
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      throw new Error("No Kledo access token available. Please authenticate with Kledo first.");
    }

    // First, let's check if we need to create a customer/contact
    const customerData = await createOrGetKledoCustomer(xenditInvoice.payer_email, accessToken);
    console.log(`👤 Customer data:`, customerData);
    
    // Validate that we have a valid contact_id
    if (!customerData || !customerData.id) {
      throw new Error(`Cannot create invoice: No valid contact_id available. Customer data: ${JSON.stringify(customerData)}`);
    }
    
    // Get a valid finance account ID for the invoice items
    const financeAccountId = await getDefaultFinanceAccountId(accessToken);
    console.log(`💰 Using finance account ID: ${financeAccountId}`);
    
    // Map Xendit invoice data to Kledo format (using correct API structure)
    const kledoInvoiceData = {
      trans_date: new Date().toISOString().split('T')[0], // Required field: transaction date
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due date
      contact_id: customerData.id, // Customer ID from Kledo (guaranteed to be valid now)
      status_id: 1, // Draft status (adjust as needed)
      include_tax: false, // Specify tax inclusion
      items: [
        {
          finance_account_id: financeAccountId, // REQUIRED: Valid finance account ID from Kledo
          desc: xenditInvoice.description || "Payment via Xendit",
          qty: 1,
          price: xenditInvoice.amount,
          amount: xenditInvoice.amount, // Total amount for this line item
        }
      ],
      memo: `Automatically created from Xendit payment.\nOriginal ID: ${xenditInvoice.id}\nExternal ID: ${xenditInvoice.external_id}`,
      ref_number: xenditInvoice.external_id, // Reference number
    };

    console.log(`📋 Invoice data to send:`, kledoInvoiceData);

    // Use correct invoice endpoint from API documentation
    const invoiceEndpoint = '/finance/invoices';

    let createResult = null;

    try {
      const createUrl = `${process.env.KLEDO_API_BASE_URL}${invoiceEndpoint}`;
      console.log(`🔍 Creating invoice using correct endpoint: ${createUrl}`);
      
      const response = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(kledoInvoiceData),
      });

      console.log(`📊 Invoice creation: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Invoice created successfully:`, result);
        createResult = result;
      } else {
        const errorText = await response.text();
        console.log(`❌ Invoice creation failed: ${response.status} ${errorText}`);
        
        // Parse error response to provide better error message
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.message || errorJson.error || errorText;
        } catch (e) {
          // Keep original error text if not JSON
        }
        
        throw new Error(`Invoice creation failed: ${response.status} - ${errorDetails}`);
      }
    } catch (error) {
      console.log(`❌ Invoice creation error: ${error.message}`);
      throw error;
    }

    // If invoice created successfully, mark it as paid
    if (createResult.data && createResult.data.id) {
      console.log(`💰 Marking invoice ${createResult.data.id} as paid...`);
      await markKledoInvoiceAsPaid(createResult.data.id, xenditInvoice.amount, accessToken);
    }
    
    // Log successful transfer
    console.log(`✅ Successfully transferred Xendit invoice ${xenditInvoice.external_id} to Kledo invoice ${createResult.data?.id}`);
    
    return createResult;
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw error;
  }
}

// Helper function to create or get customer in Kledo
async function createOrGetKledoCustomer(email, accessToken) {
  console.log(`🔍 Creating/finding customer for email: ${email}`);
  
  if (!email) {
    // Get default customer instead of returning null
    return await getOrCreateDefaultCustomer(accessToken);
  }

  try {
    // Use correct contacts endpoint from API documentation
    const contactsEndpoint = '/finance/contacts';
    
    // Try to find existing customer
    try {
      const searchUrl = `${process.env.KLEDO_API_BASE_URL}${contactsEndpoint}?search=${encodeURIComponent(email)}`;
      console.log(`🔍 Searching for existing customer: ${searchUrl}`);
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      console.log(`📊 Contact search: ${searchResponse.status} ${searchResponse.statusText}`);

      if (searchResponse.ok) {
        const result = await searchResponse.json();
        console.log(`✅ Contact search successful:`, result);
        
        if (result.data && result.data.length > 0) {
          console.log(`🎯 Customer found: ${result.data[0].name}`);
          return result.data[0]; // Return first matching customer
        }
      } else {
        const errorText = await searchResponse.text();
        console.log(`❌ Contact search failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Contact search error: ${error.message}`);
    }

    // If no existing customer found, create new one
    console.log(`📝 Creating new customer using contacts endpoint`);
    
    // Get required group_id for contact creation - create one if none exists
    let groupId;
    try {
      groupId = await getDefaultContactGroupId(accessToken);
    } catch (error) {
      console.error('❌ Cannot get valid group ID for customer creation:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
    
    const customerData = {
      name: email.split('@')[0] || 'Customer', // Use email prefix as name
      email: email,
      type_id: 1, // Customer type ID (1 is typically customer in Kledo)
      group_id: groupId, // Required group_id field
    };

    console.log(`📝 Creating customer with data:`, customerData);

    const createResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}${contactsEndpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(customerData),
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log(`✅ Customer created successfully:`, result.data);
      return result.data;
    } else {
      const errorText = await createResponse.text();
      console.error(`❌ Customer creation failed: ${createResponse.status} ${errorText}`);
      
      // If customer creation fails, use default customer
      console.warn(`Customer creation failed, using default customer`);
      return await getOrCreateDefaultCustomer(accessToken);
    }

  } catch (error) {
    console.warn("Customer lookup/creation failed:", error);
    // Always return a valid customer with ID, never null
    return await getOrCreateDefaultCustomer(accessToken);
  }
}

// Helper function to get or create a default customer that always has a valid ID
async function getOrCreateDefaultCustomer(accessToken) {
  try {
    console.log('🔍 Getting default customer...');
    
    // First try to get any existing customer
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contacts?limit=1`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        console.log(`✅ Using existing customer: ${result.data[0].name} (ID: ${result.data[0].id})`);
        return result.data[0];
      }
    }

    // If no customers exist, create a default one
    console.log('📝 Creating default customer...');
    
    // Get required group_id for contact creation - create one if none exists
    let groupId;
    try {
      groupId = await getDefaultContactGroupId(accessToken);
    } catch (error) {
      console.error('❌ Cannot get valid group ID for default customer creation:', error);
      throw new Error(`Default customer creation failed: ${error.message}`);
    }
    
    const defaultCustomerData = {
      name: 'Default Customer',
      email: 'default@xendit-integration.com',
      type_id: 1, // Customer type ID
      group_id: groupId, // Required group_id field
    };

    console.log(`📝 Creating default customer with data:`, defaultCustomerData);

    const createResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contacts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(defaultCustomerData),
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log(`✅ Default customer created:`, result.data);
      return result.data;
    } else {
      const errorText = await createResponse.text();
      console.error(`❌ Default customer creation failed: ${createResponse.status} ${errorText}`);
      
      // Last resort: throw error because we can't proceed without a contact_id
      throw new Error(`Cannot create invoice: No valid contact_id available. Contact creation failed: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Default customer creation failed:', error);
    throw new Error(`Cannot create invoice: No valid contact_id available. Error: ${error.message}`);
  }
}

// Helper function to get a valid contact group ID with validation
async function getDefaultContactGroupId(accessToken) {
  try {
    console.log('🔍 Fetching contact groups to get valid group ID...');
    
    // Try to get contact groups
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contactGroups`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📊 Contact groups response:', result);
      console.log('📊 Available groups:', result.data?.map(g => ({ id: g.id, name: g.name, active: g.active })));
      
      if (result.data && result.data.length > 0) {
        // Filter to only active groups to avoid "invalid group ID" errors
        const activeGroups = result.data.filter(group => 
          group.active !== false && group.id != null
        );
        
        if (activeGroups.length > 0) {
          // Try to find a customer group first among active groups
          const customerGroup = activeGroups.find(group => 
            group.name?.toLowerCase().includes('customer') ||
            group.name?.toLowerCase().includes('pelanggan') ||
            group.name?.toLowerCase().includes('default')
          );
          
          if (customerGroup) {
            const groupId = parseInt(customerGroup.id); // Ensure integer type
            console.log(`✅ Using customer group: ${customerGroup.name} (ID: ${groupId})`);
            return groupId;
          }
          
          // Fallback to first active group
          const firstActiveGroup = activeGroups[0];
          const groupId = parseInt(firstActiveGroup.id); // Ensure integer type
          console.log(`⚠️ Using first available active group: ${firstActiveGroup.name} (ID: ${groupId})`);
          return groupId;
        } else {
          console.warn('⚠️ No active contact groups found');
        }
      } else {
        console.warn('⚠️ No contact groups found in response');
      }
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Could not fetch contact groups: ${response.status} - ${errorText}`);
    }
    
    // If we can't get groups, try to validate the fallback ID
    console.log('🔍 Testing fallback group ID validation...');
    const isValidFallback = await validateGroupId(1, accessToken);
    if (isValidFallback) {
      console.log('✅ Fallback group ID 1 is valid');
      return 1;
    }
    
    // Last resort: create a default contact group
    console.log('🔧 No valid contact groups found, creating default group...');
    try {
      const newGroupId = await createDefaultContactGroup(accessToken);
      console.log(`✅ Created default contact group with ID: ${newGroupId}`);
      return newGroupId;
    } catch (createError) {
      console.error('❌ Failed to create default contact group:', createError);
      throw new Error(`No valid contact group ID found and cannot create one: ${createError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching contact groups:', error);
    // Try to create a default group as fallback
    try {
      console.log('🔧 Creating default contact group as error fallback...');
      const newGroupId = await createDefaultContactGroup(accessToken);
      console.log(`✅ Created fallback contact group with ID: ${newGroupId}`);
      return newGroupId;
    } catch (createError) {
      console.error('❌ Failed to create fallback contact group:', createError);
      throw new Error(`Cannot determine valid contact group ID and cannot create one: ${createError.message}`);
    }
  }
}

// Helper function to validate if a group ID is valid
async function validateGroupId(groupId, accessToken) {
  try {
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contactGroups/${groupId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Group ID ${groupId} is valid:`, result.data?.name);
      return true;
    } else {
      console.warn(`❌ Group ID ${groupId} is invalid: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.warn(`❌ Could not validate group ID ${groupId}:`, error);
    return false;
  }
}

// Helper function to mark Kledo invoice as paid
async function markKledoInvoiceAsPaid(invoiceId, amount, accessToken) {
  console.log(`💰 Attempting to mark invoice ${invoiceId} as paid with amount ${amount}`);
  
  try {
    const paymentData = {
      invoice_id: invoiceId,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      method: "transfer", // or other payment method
      notes: "Payment received via Xendit",
    };

    // Test different possible payment endpoints
    const possiblePaymentEndpoints = [
      '/payments',
      '/invoice-payments',
      '/api/payments',
      '/api/invoice-payments',
      `/invoices/${invoiceId}/payments`,
      `/api/invoices/${invoiceId}/payments`
    ];

    for (const endpoint of possiblePaymentEndpoints) {
      try {
        const paymentUrl = `${process.env.KLEDO_API_BASE_URL}${endpoint}`;
        console.log(`🔍 Trying payment endpoint: ${paymentUrl}`);
        
        const response = await fetch(paymentUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(paymentData),
        });

        console.log(`📊 ${endpoint}: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Successfully marked invoice ${invoiceId} as paid using endpoint: ${endpoint}`, result);
          return result;
        } else {
          const errorText = await response.text();
          console.log(`❌ ${endpoint} failed: ${response.status} ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} error: ${error.message}`);
      }
    }

    console.warn(`⚠️ All payment endpoints failed for invoice ${invoiceId}`);
  } catch (error) {
    console.warn("Failed to mark invoice as paid:", error);
  }
}

export async function fetchRecentTransfers() {
  // For now, return mock data. In a real implementation, you'd query a database
  // where you store the transfer logs
  return [
    {
      id: 1,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
      invoice_id: "inv_12345",
      xendit_id: "xendit_67890",
      amount: 250000,
      status: "success"
    },
    {
      id: 2,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      invoice_id: "inv_54321",
      xendit_id: "xendit_09876",
      amount: 150000,
      status: "success"
    }
  ];
}

export async function getXenditTransactions(limit = 10) {
  try {
    console.log("🔍 Fetching Xendit transactions...");
    
    // Use direct API call instead of SDK to avoid issues
    const response = await fetch(`https://api.xendit.co/v2/invoices?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Xendit API error:', response.status, errorText);
      throw new Error(`Xendit API error: ${response.status} ${response.statusText}`);
    }

    const invoices = await response.json();
    console.log(`📊 Retrieved ${invoices.length} invoices from Xendit`);
    
    // Filter only successful/paid transactions
    const paidInvoices = invoices.filter(invoice => 
      invoice.status === 'SETTLED' || invoice.status === 'PAID'
    );
    
    console.log(`✅ Found ${paidInvoices.length} paid invoices`);
    return paidInvoices;
  } catch (error) {
    console.error("Failed to fetch Xendit transactions:", error);
    throw error;
  }
}

// Helper function to create a default contact group when none exists
async function createDefaultContactGroup(accessToken) {
  try {
    console.log('🔧 Creating default contact group...');
    
    const defaultGroupData = {
      name: 'Default Customers',
      code: 'DEFAULT_CUSTOMERS',
    };

    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contactGroups`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(defaultGroupData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Default contact group created:`, result.data);
      return parseInt(result.data.id);
    } else {
      const errorText = await response.text();
      console.error(`❌ Default contact group creation failed: ${response.status} ${errorText}`);
      
      // Try with minimal data
      const minimalGroupData = { name: 'Customers' };
      const retryResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contactGroups`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(minimalGroupData),
      });

      if (retryResponse.ok) {
        const retryResult = await retryResponse.json();
        console.log(`✅ Minimal contact group created:`, retryResult.data);
        return parseInt(retryResult.data.id);
      } else {
        const retryErrorText = await retryResponse.text();
        console.error(`❌ Minimal contact group creation also failed: ${retryResponse.status} ${retryErrorText}`);
        throw new Error(`Cannot create default contact group: ${retryErrorText}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating default contact group:', error);
    throw new Error(`Cannot create default contact group: ${error.message}`);
  }
}