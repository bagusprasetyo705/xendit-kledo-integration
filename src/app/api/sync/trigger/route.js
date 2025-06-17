// app/api/sync/trigger/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    // Mock response for demo - in production this would:
    // 1. Fetch recent paid transactions from Xendit
    // 2. Transfer each transaction to Kledo
    // 3. Return real results
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResult = {
      success: true,
      processed: 3,
      successful: 2,
      errors: [
        {
          transaction_id: "txn_error_example",
          error: "Kledo API rate limit exceeded"
        }
      ]
    };
    
    return new Response(JSON.stringify(mockResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Manual sync failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}