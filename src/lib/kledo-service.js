// lib/kledo-service.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    // Implement your transfer logic here
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Map Xendit invoice to Kledo format
        invoice_number: xenditInvoice.external_id,
        amount: xenditInvoice.amount,
        // ... other required fields
      }),
    });

    if (!response.ok) {
      throw new Error(`Kledo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Transfer failed:", error);
    throw error;
  }
}

export async function fetchRecentTransfers() {
  // Implement database query or API call to get recent transfers
  // Example:
  return [
    {
      id: 1,
      date: new Date(),
      invoice_id: "inv_12345",
      amount: 250000,
      status: "success"
    },
    // ...more records
  ];
}