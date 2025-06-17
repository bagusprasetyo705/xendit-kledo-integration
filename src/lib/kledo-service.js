// lib/kledo-service.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Xendit } from "xendit-node";

// Initialize Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

export async function getKledoAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

export async function transferXenditToKledo(xenditInvoice) {
  try {
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      throw new Error("No Kledo access token available");
    }

    // Map Xendit invoice data to Kledo format
    const kledoInvoiceData = {
      invoice_number: xenditInvoice.external_id,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      contact: {
        name: xenditInvoice.payer_email || "Xendit Customer",
        email: xenditInvoice.payer_email || "",
      },
      items: [
        {
          product_name: xenditInvoice.description || "Payment via Xendit",
          quantity: 1,
          unit_price: xenditInvoice.amount,
          total: xenditInvoice.amount,
        }
      ],
      subtotal: xenditInvoice.amount,
      total: xenditInvoice.amount,
      status: "paid", // Mark as paid since Xendit webhook confirms payment
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Automatically created from Xendit payment. Original ID: ${xenditInvoice.id}`,
    };

    // Create invoice in Kledo
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/api/invoices`, {
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
      throw new Error(`Kledo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    // Log successful transfer (you might want to store this in a database)
    console.log(`Successfully transferred Xendit invoice ${xenditInvoice.external_id} to Kledo invoice ${result.data?.id}`);
    
    return result;
  } catch (error) {
    console.error("Transfer failed:", error);
    throw error;
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