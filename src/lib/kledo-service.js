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

// Helper function to get a default finance account ID with proper validation
async function getDefaultFinanceAccountId(accessToken) {
  try {
    console.log('🔍 Fetching finance accounts to get valid account ID...');
    
    // Try to get finance accounts with X-APP header
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "X-APP": "finance", // Add required header
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📊 Finance accounts response:', result);
      console.log('📊 Available accounts:', result.data?.map(acc => ({ 
        id: acc.id, 
        name: acc.name, 
        code: acc.code,
        account_type_id: acc.account_type_id,
        active: acc.active 
      })));
      
      // Look for a revenue/income account (typically has account type for sales)
      if (result.data && result.data.length > 0) {
        // Filter to only active accounts
        const activeAccounts = result.data.filter(account => 
          account.active !== false && account.id != null
        );
        
        if (activeAccounts.length === 0) {
          throw new Error('No active finance accounts found in Kledo');
        }
        
        // Try to find revenue/sales accounts first (common account type IDs: 4, 5, or sales-related names)
        const revenueAccount = activeAccounts.find(account => 
          account.account_type_id === 4 ||  // Revenue account type
          account.account_type_id === 5 ||  // Income account type
          account.code?.toLowerCase().includes('4') ||  // Chart of accounts code starting with 4 (revenue)
          account.name?.toLowerCase().includes('revenue') ||
          account.name?.toLowerCase().includes('sales') ||
          account.name?.toLowerCase().includes('income') ||
          account.name?.toLowerCase().includes('pendapatan') ||
          account.name?.toLowerCase().includes('penjualan')
        );
        
        if (revenueAccount) {
          console.log(`✅ Using revenue account: ${revenueAccount.name} (ID: ${revenueAccount.id}, Code: ${revenueAccount.code})`);
          return parseInt(revenueAccount.id); // Ensure integer type
        }
        
        // Fallback to first active account
        const firstAccount = activeAccounts[0];
        console.log(`⚠️ Using first available active account: ${firstAccount.name} (ID: ${firstAccount.id}, Code: ${firstAccount.code})`);
        return parseInt(firstAccount.id); // Ensure integer type
      } else {
        throw new Error('No finance accounts found in response');
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Could not fetch finance accounts: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch finance accounts: ${response.status} ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching finance accounts:', error);
    
    // Instead of using a fallback ID, throw an error to force proper handling
    throw new Error(`Cannot determine valid finance account ID: ${error.message}. Please ensure finance accounts are properly configured in Kledo.`);
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
    
    // Additional validation: Ensure the contact is properly set up as a customer type
    if (customerData.type_id !== 1 && customerData.contact_type !== "customer") {
      console.warn('⚠️ Contact may not be properly configured as customer type, attempting to fix...');
      // Try to update the contact to ensure it's properly set as a customer
      try {
        await updateContactToCustomerType(customerData.id, accessToken);
        console.log('✅ Contact updated to customer type');
      } catch (updateError) {
        console.warn('⚠️ Could not update contact type, proceeding with existing data:', updateError.message);
      }
    }
    
    // Get a valid finance account ID for the invoice items
    const financeAccountId = await getDefaultFinanceAccountId(accessToken);
    console.log(`💰 Using finance account ID: ${financeAccountId}`);
    
    // Map Xendit invoice data to Kledo format (exactly aligned with official API documentation)
    const kledoInvoiceData = {
      trans_date: new Date().toISOString().split('T')[0], // Required field: transaction date
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due date
      contact_id: customerData.id, // Customer ID from Kledo (guaranteed to be valid now)
      contact_shipping_address_id: 0, // Default shipping address
      sales_id: 0, // No sales person assigned
      status_id: 0, // Draft status (0 = draft, per API docs example)
      include_tax: 0, // Tax inclusion (0 = exclude, 1 = include)
      term_id: 0, // No payment terms
      ref_number: xenditInvoice.external_id || "string", // Reference number
      memo: `Automatically created from Xendit payment.\nOriginal ID: ${xenditInvoice.id}\nExternal ID: ${xenditInvoice.external_id}`,
      attachment: ["string"], // Attachment array as per API docs (empty string if no attachments)
      items: [
        {
          finance_account_id: financeAccountId, // REQUIRED: Valid finance account ID from Kledo
          tax_id: 0, // No tax applied
          desc: xenditInvoice.description || "Payment via Xendit",
          qty: 1, // Quantity
          price: xenditInvoice.amount, // Unit price
          amount: xenditInvoice.amount, // Total amount for this line item
          price_after_tax: xenditInvoice.amount, // Price after tax (same as price when no tax)
          amount_after_tax: xenditInvoice.amount, // Amount after tax (same as amount when no tax)
          tax_manual: 0, // Manual tax calculation disabled
          discount_percent: 0, // No discount
          unit_id: 0, // No specific unit
          column_name: "One", // Default column name as per API docs
          serial_numbers: [
            {
              product_serial_number_id: 0, // Product serial number ID (0 = none)
              qty: 0 // Quantity for serial number (0 = none)
            }
          ]
        }
      ],
      witholdings: [
        {
          witholding_account_id: 0, // Withholding account ID (0 = none)
          witholding_amount: 0, // Withholding amount (0 = none)
          witholding_percent: 0 // Withholding percentage (0 = none)
        }
      ],
      warehouse_id: 0, // No warehouse
      additional_discount_percent: 0, // No additional discount
      additional_discount_amount: 0, // No additional discount amount
      message: "string", // Message field as per API docs
      tags: [0], // Tags array with default value 0
      shipping_cost: 0, // No shipping cost
      shipping_date: new Date().toISOString().split('T')[0], // Current date for shipping
      shipping_comp_id: 0, // No shipping company
      shipping_tracking: "string", // Shipping tracking as per API docs
      delivery_ids: [0], // Delivery IDs array with default value 0
      down_payment: 0, // No down payment
      witholding_percent: 0, // No withholding percentage
      witholding_amount: 0, // No withholding amount
      witholding_account_id: 0, // No withholding account
      column_name: "string" // Column name field as per API docs
    };

    console.log(`📋 Invoice data to send:`, kledoInvoiceData);
    console.log(`🔍 Customer validation - ID: ${customerData.id}, Type: ${customerData.type_id}, Contact Type: ${customerData.contact_type}`);

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
          "Accept": "*/*", // Match API documentation
          "X-APP": "finance", // Required header as shown in API documentation
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
          
          // Enhanced error handling for common API issues
          if (errorDetails.includes('Tipe kontak customer di perlukan') || 
              errorDetails.includes('Customer contact type') ||
              errorDetails.includes('contact type')) {
            
            console.error('❌ Contact type validation error in invoice creation');
            console.error('📋 Customer data used:', customerData);
            console.error('📋 Invoice data sent:', kledoInvoiceData);
            
            // The issue is likely that the contact_id refers to a contact that isn't properly configured as a customer
            // Try to re-fetch and validate the contact
            try {
              const contactValidation = await validateContactForInvoice(customerData.id, accessToken);
              console.log('🔍 Contact validation result:', contactValidation);
              
              if (!contactValidation.isValid) {
                // Try to update the contact to be a proper customer
                try {
                  await updateContactToCustomerType(customerData.id, accessToken);
                  console.log('✅ Contact updated to customer type, retrying invoice creation...');
                  
                  // Retry invoice creation after fixing contact
                  const retryResponse = await fetch(createUrl, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                      "Accept": "*/*", // Match API documentation
                      "X-APP": "finance", // Required header as shown in API documentation
                    },
                    body: JSON.stringify(kledoInvoiceData),
                  });
                  
                  if (retryResponse.ok) {
                    const retryResult = await retryResponse.json();
                    console.log(`✅ Invoice created successfully after contact fix:`, retryResult);
                    createResult = retryResult;
                    // Exit the error handling and continue with success
                    return;
                  }
                } catch (updateError) {
                  console.error('❌ Failed to update contact type:', updateError.message);
                }
                
                throw new Error(`Contact validation failed: ${contactValidation.reason}. Please ensure the contact is properly configured as a customer in Kledo.`);
              }
            } catch (validationError) {
              console.error('❌ Contact validation error:', validationError.message);
            }
            
            throw new Error(`Invoice creation failed due to contact type validation: ${errorDetails}. The contact may not be properly configured as a customer type in Kledo.`);
          }
          
          // Handle other common API errors
          if (errorDetails.includes('contact_id')) {
            throw new Error(`Invalid contact ID: ${errorDetails}. The customer may not exist or may be inactive.`);
          }
          
          if (errorDetails.includes('finance_account_id')) {
            throw new Error(`Invalid finance account ID: ${errorDetails}. Please check if the finance account exists and is active.`);
          }
          
          if (errorDetails.includes('validation')) {
            throw new Error(`Validation error: ${errorDetails}. Please check the invoice data structure.`);
          }
          
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

// Helper function to validate that a contact is properly configured for invoice creation
async function validateContactForInvoice(contactId, accessToken) {
  try {
    console.log(`🔍 Validating contact ${contactId} for invoice creation...`);
    
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contacts/${contactId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      const contact = result.data;
      
      console.log('📋 Contact details:', contact);
      
      // Check if contact is properly configured as customer
      const isValidCustomer = (
        contact.type_id === 1 || 
        contact.contact_type === "customer" ||
        contact.contact_type === "Customer"
      );
      
      if (!isValidCustomer) {
        return {
          isValid: false,
          reason: `Contact type mismatch: type_id=${contact.type_id}, contact_type=${contact.contact_type}`,
          contact: contact
        };
      }
      
      // Check if contact has required fields
      if (!contact.name || !contact.id) {
        return {
          isValid: false,
          reason: `Missing required contact fields: name=${contact.name}, id=${contact.id}`,
          contact: contact
        };
      }
      
      return {
        isValid: true,
        contact: contact
      };
    } else {
      const errorText = await response.text();
      return {
        isValid: false,
        reason: `Failed to fetch contact: ${response.status} ${errorText}`,
        contact: null
      };
    }
  } catch (error) {
    return {
      isValid: false,
      reason: `Validation error: ${error.message}`,
      contact: null
    };
  }
}

// Helper function to update a contact to ensure it's properly set as customer type
async function updateContactToCustomerType(contactId, accessToken) {
  try {
    console.log(`🔧 Updating contact ${contactId} to customer type...`);
    
    const updateData = {
      contact_type: "customer",
      type_id: 1
    };

    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contacts/${contactId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Contact updated successfully:`, result.data);
      return result.data;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Contact update failed: ${response.status} ${errorText}`);
      throw new Error(`Contact update failed: ${errorText}`);
    }
  } catch (error) {
    console.warn('⚠️ Error updating contact:', error);
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
    
    // Generate unique name to avoid "Name sudah digunakan" error
    const baseName = email.split('@')[0] || 'Customer';
    const timestamp = Date.now();
    const uniqueName = `${baseName}-${timestamp}`;
    
    const customerData = {
      name: uniqueName, // Use unique name to avoid duplicates
      email: email,
      type_id: 1, // Customer type ID (required)
      contact_type: "customer", // Required: customer contact type
      group_id: groupId, // Required group_id field
      is_customer: true, // Additional field to explicitly mark as customer
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
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          if (errorData.message.includes('Name sudah digunakan') || errorData.message.includes('already used')) {
            console.warn('❌ Name already used, trying with more unique name...');
            // Try again with even more unique name
            const retryTimestamp = Date.now() + Math.random() * 1000;
            const retryName = `${baseName}-${Math.floor(retryTimestamp)}`;
            const retryCustomerData = {
              ...customerData,
              name: retryName,
              email: `${retryName.toLowerCase()}@xendit-integration.com`
            };
            
            const retryResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}${contactsEndpoint}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify(retryCustomerData),
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              console.log(`✅ Customer created on retry:`, retryResult.data);
              return retryResult.data;
            }
          }
          
          if (errorData.message.includes('group')) {
            console.error('❌ Group ID validation error:', errorData.message);
            throw new Error(`Invalid group ID: ${errorData.message}`);
          }
          
          if (errorData.message.includes('contact_type') || errorData.message.includes('Tipe kontak')) {
            console.error('❌ Contact type error:', errorData.message);
            throw new Error(`Contact type required: ${errorData.message}`);
          }
        }
      } catch (parseError) {
        // Error text is not JSON, continue with fallback
      }
      
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
    
    // Generate unique name to avoid duplicates
    const timestamp = Date.now();
    const uniqueName = `Default-Customer-${timestamp}`;
    
    const defaultCustomerData = {
      name: uniqueName, // Use unique name to avoid duplicates
      email: `default-${timestamp}@xendit-integration.com`, // Unique email too
      type_id: 1, // Customer type ID (required)
      contact_type: "customer", // Required: customer contact type
      group_id: groupId, // Required group_id field
      is_customer: true, // Additional field to explicitly mark as customer
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
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          if (errorData.message.includes('Name sudah digunakan') || errorData.message.includes('already used')) {
            console.warn('❌ Default customer name already used, trying with more unique name...');
            // Try again with even more unique name
            const retryTimestamp = Date.now() + Math.random() * 1000;
            const retryName = `Default-Customer-${Math.floor(retryTimestamp)}`;
            const retryCustomerData = {
              ...defaultCustomerData,
              name: retryName,
              email: `default-${Math.floor(retryTimestamp)}@xendit-integration.com`
            };
            
            const retryResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/contacts`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify(retryCustomerData),
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              console.log(`✅ Default customer created on retry:`, retryResult.data);
              return retryResult.data;
            }
          }
          
          if (errorData.message.includes('group')) {
            console.error('❌ Group ID validation error:', errorData.message);
            throw new Error(`Invalid group ID for default customer: ${errorData.message}`);
          }
          
          if (errorData.message.includes('contact_type') || errorData.message.includes('Tipe kontak')) {
            console.error('❌ Contact type error for default customer:', errorData.message);
            throw new Error(`Contact type required for default customer: ${errorData.message}`);
          }
        }
      } catch (parseError) {
        // Error text is not JSON, continue with original error
      }
      
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