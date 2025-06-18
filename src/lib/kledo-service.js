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
    
    // Map Xendit invoice data to Kledo format
    const kledoInvoiceData = {
      date: new Date().toISOString().split('T')[0], // Invoice date
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      contact_id: customerData.id, // Customer ID from Kledo
      items: [
        {
          name: xenditInvoice.description || "Payment via Xendit",
          price: xenditInvoice.amount,
          qty: 1,
        }
      ],
      notes: `Automatically created from Xendit payment.\nOriginal ID: ${xenditInvoice.id}\nExternal ID: ${xenditInvoice.external_id}`,
      tags: ["xendit", "auto-import"],
    };

    console.log(`📋 Invoice data to send:`, kledoInvoiceData);

    // Test different possible invoice endpoints
    const possibleInvoiceEndpoints = [
      '/invoices',
      '/sales-invoices', 
      '/api/invoices',
      '/api/sales-invoices'
    ];

    let createResult = null;
    let workingInvoiceEndpoint = null;

    for (const endpoint of possibleInvoiceEndpoints) {
      try {
        const createUrl = `${process.env.KLEDO_API_BASE_URL}${endpoint}`;
        console.log(`🔍 Trying invoice endpoint: ${createUrl}`);
        
        const response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(kledoInvoiceData),
        });

        console.log(`📊 ${endpoint}: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Invoice created successfully with endpoint: ${endpoint}`, result);
          createResult = result;
          workingInvoiceEndpoint = endpoint;
          break;
        } else {
          const errorText = await response.text();
          console.log(`❌ ${endpoint} failed: ${response.status} ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} error: ${error.message}`);
      }
    }

    if (!createResult) {
      throw new Error("All invoice creation endpoints failed. Please check Kledo API documentation.");
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
    // Return default customer or create anonymous customer
    return { id: null, name: "Anonymous Customer" };
  }

  try {
    // Test different possible contact endpoints
    const possibleEndpoints = [
      '/contacts',
      '/customers',
      '/api/contacts',
      '/api/customers'
    ];

    let searchResult = null;
    let workingEndpoint = null;

    // Try to find existing customer using different endpoints
    for (const endpoint of possibleEndpoints) {
      try {
        const searchUrl = `${process.env.KLEDO_API_BASE_URL}${endpoint}?search=${encodeURIComponent(email)}`;
        console.log(`🔍 Trying endpoint: ${searchUrl}`);
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        });

        console.log(`📊 ${endpoint}: ${searchResponse.status} ${searchResponse.statusText}`);

        if (searchResponse.ok) {
          const result = await searchResponse.json();
          console.log(`✅ Found working endpoint: ${endpoint}`, result);
          
          if (result.data && result.data.length > 0) {
            console.log(`🎯 Customer found: ${result.data[0].name}`);
            return result.data[0]; // Return first matching customer
          }
          
          searchResult = result;
          workingEndpoint = endpoint;
          break; // Found working endpoint, use it for creation
        } else {
          const errorText = await searchResponse.text();
          console.log(`❌ ${endpoint} failed: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} error: ${error.message}`);
      }
    }

    // If we found a working endpoint but no customer, create new one
    if (workingEndpoint) {
      console.log(`📝 Creating new customer using endpoint: ${workingEndpoint}`);
      
      const customerData = {
        name: email.split('@')[0], // Use email prefix as name
        email: email,
        type: "customer",
      };

      const createResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}${workingEndpoint}`, {
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
      }
    }

    // If customer creation fails, return null (will create invoice without specific customer)
    console.warn("Failed to create customer in Kledo, proceeding without customer link");
    return { id: null, name: email };

  } catch (error) {
    console.warn("Customer lookup/creation failed:", error);
    return { id: null, name: email || "Anonymous Customer" };
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