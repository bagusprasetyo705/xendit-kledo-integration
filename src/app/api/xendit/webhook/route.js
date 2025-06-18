// app/api/xendit/webhook/route.js
export async function POST(request) {
  const signature = request.headers.get("x-callback-token");
  
  // Verify webhook signature
  if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    console.log("Webhook signature verification failed");
    console.log("Expected:", process.env.XENDIT_WEBHOOK_TOKEN);
    console.log("Received:", signature);
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await request.json();
    console.log("✅ Received Xendit webhook:", JSON.stringify(payload, null, 2));

    // Log transaction details
    console.log("📄 Transaction Details:");
    console.log("- ID:", payload.id);
    console.log("- External ID:", payload.external_id);
    console.log("- Status:", payload.status);
    console.log("- Amount:", payload.amount, payload.currency);
    console.log("- Payer Email:", payload.payer_email);
    console.log("- Payment Method:", payload.payment_method);
    console.log("- Created:", payload.created);
    console.log("- Updated:", payload.updated);

    // Check if this is a successful payment
    if (payload.status === "PAID" || payload.status === "SETTLED") {
      console.log("🎉 SUCCESSFUL PAYMENT RECEIVED!");
      console.log(`Payment of ${payload.amount} ${payload.currency} has been completed`);
      
      // Here you could:
      // 1. Store in database
      // 2. Send notifications
      // 3. Update application state
      // 4. Trigger other business logic
      
      return new Response(JSON.stringify({
        success: true,
        message: "Payment processed successfully",
        transaction_id: payload.id,
        amount: payload.amount,
        status: payload.status
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log("ℹ️ Transaction status:", payload.status);
      return new Response(JSON.stringify({
        success: true,
        message: `Transaction status: ${payload.status}`,
        transaction_id: payload.id
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = "force-dynamic"; // Ensure Vercel doesn't cache this