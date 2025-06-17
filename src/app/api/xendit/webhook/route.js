// app/api/xendit/webhook/route.js
export async function POST(request) {
  const signature = request.headers.get("x-callback-token");
  
  // Verify webhook signature
  if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    console.log("Webhook signature verification failed");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await request.json();
    console.log("Received Xendit webhook:", payload);

    // Only process paid invoices
    if (payload.status === "PAID") {
      // Mock processing - in production this would:
      // 1. Authenticate with Kledo
      // 2. Create invoice in Kledo
      // 3. Log the transfer
      
      console.log(`Processing paid invoice ${payload.external_id}`);
      console.log(`Amount: ${payload.amount}`);
      console.log(`Payer: ${payload.payer_email}`);
      
      // Mock Kledo invoice creation
      const mockKledoInvoice = {
        id: "kledo_" + Date.now(),
        invoice_number: payload.external_id,
        amount: payload.amount,
        status: "paid"
      };
      
      console.log(`Successfully created Kledo invoice:`, mockKledoInvoice);
      
      return new Response(JSON.stringify({
        success: true,
        kledo_invoice: mockKledoInvoice
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response("Ignored - not a paid invoice", { status: 200 });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new Response("Processing failed", { status: 500 });
  }
}

export const dynamic = "force-dynamic"; // Ensure Vercel doesn't cache this