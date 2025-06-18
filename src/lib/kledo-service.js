// lib/kledo-service.js
import { Xendit } from "xendit-node";

// Initialize Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

export async function getKledoAccessToken() {
  // For now, return null - in production you'd implement proper token storage
  // This could be enhanced to use cookies, database, or other secure storage
  console.warn("Kledo access token not implemented in simplified version");
  return null;
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
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      throw new Error("No Kledo access token available. Please authenticate with Kledo first.");
    }

    // First, let's check if we need to create a customer/contact
    const customerData = await createOrGetKledoCustomer(xenditInvoice.payer_email, accessToken);
    
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

    // Create invoice in Kledo
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(kledoInvoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kledo API Error:", errorText);
      throw new Error(`Kledo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    // If invoice created successfully, mark it as paid
    if (result.data && result.data.id) {
      await markKledoInvoiceAsPaid(result.data.id, xenditInvoice.amount, accessToken);
    }
    
    // Log successful transfer
    console.log(`✅ Successfully transferred Xendit invoice ${xenditInvoice.external_id} to Kledo invoice ${result.data?.id}`);
    
    return result;
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw error;
  }
}

// Helper function to create or get customer in Kledo
async function createOrGetKledoCustomer(email, accessToken) {
  if (!email) {
    // Return default customer or create anonymous customer
    return { id: null, name: "Anonymous Customer" };
  }

  try {
    // First, try to find existing customer
    const searchResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/contacts?search=${encodeURIComponent(email)}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.data && searchResult.data.length > 0) {
        return searchResult.data[0]; // Return first matching customer
      }
    }

    // Customer not found, create new one
    const customerData = {
      name: email.split('@')[0], // Use email prefix as name
      email: email,
      type: "customer",
    };

    const createResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/contacts`, {
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
      return result.data;
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
  try {
    const paymentData = {
      invoice_id: invoiceId,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      method: "transfer", // or other payment method
      notes: "Payment received via Xendit",
    };

    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Marked Kledo invoice ${invoiceId} as paid`);
      return result;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Failed to mark invoice as paid: ${errorText}`);
    }
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
    // Fetch recent transactions from Xendit
    const { Invoice } = xenditClient;
    const invoices = await Invoice.getInvoices({
      limit: limit,
      statuses: ['PAID']
    });
    
    return invoices;
  } catch (error) {
    console.error("Failed to fetch Xendit transactions:", error);
    throw error;
  }
}