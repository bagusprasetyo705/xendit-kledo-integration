// app/api/sync/trigger/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log("🔄 Starting manual sync...");
    
    // Dynamic imports to avoid build-time issues
    const { getXenditTransactions, transferXenditToKledo } = await import("@/lib/kledo-service");
    
    // Fetch recent paid transactions from Xendit
    const xenditTransactions = await getXenditTransactions(10); // Get last 10 paid transactions
    
    if (!xenditTransactions || xenditTransactions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        successful: 0,
        errors: [],
        message: "No paid transactions found to sync"
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Found ${xenditTransactions.length} transactions to process`);
    
    const results = {
      success: true,
      processed: xenditTransactions.length,
      successful: 0,
      errors: []
    };

    // Process each transaction
    for (const transaction of xenditTransactions) {
      try {
        console.log(`🔄 Processing transaction ${transaction.id}`);
        await transferXenditToKledo(transaction);
        results.successful++;
        console.log(`✅ Successfully transferred transaction ${transaction.id}`);
      } catch (error) {
        console.error(`❌ Failed to transfer transaction ${transaction.id}:`, error);
        results.errors.push({
          transaction_id: transaction.id,
          external_id: transaction.external_id,
          error: error.message
        });
      }
    }

    console.log(`✅ Manual sync completed: ${results.successful}/${results.processed} successful`);
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}