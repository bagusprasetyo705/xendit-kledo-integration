// app/api/xendit/webhook/route.js
import { transferXenditToKledo } from "@/lib/kledo-service";

export async function POST(request) {
  const signature = request.headers.get("x-callback-token");
  
  // Verify webhook signature
  if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await request.json();

  // Only process paid invoices
  if (payload.status === "PAID") {
    try {
      await transferXenditToKledo(payload);
      console.log(`Successfully processed invoice ${payload.external_id}`);
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error(`Failed to process invoice ${payload.external_id}:`, error);
      return new Response("Processing failed", { status: 500 });
    }
  }

  return new Response("Ignored - not a paid invoice", { status: 200 });
}

export const dynamic = "force-dynamic"; // Ensure Vercel doesn't cache this