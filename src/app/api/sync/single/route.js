// API route to sync a single transaction to Kledo
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    console.log('🔄 Starting single transaction sync...');
    
    const { transaction } = await request.json();
    
    if (!transaction) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No transaction provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate transaction status
    if (transaction.status !== 'SETTLED' && transaction.status !== 'PAID') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Transaction must be PAID or SETTLED to sync'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔄 Processing single transaction: ${transaction.id}`);
    
    // Dynamic import to avoid build-time issues
    const { transferXenditToKledo } = await import("@/lib/kledo-service");
    
    try {
      const result = await transferXenditToKledo(transaction);
      
      console.log(`✅ Successfully synced transaction ${transaction.id}`);
      
      return new Response(JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        result: result,
        message: 'Transaction synced successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (syncError) {
      console.error(`❌ Failed to sync transaction ${transaction.id}:`, syncError);
      
      return new Response(JSON.stringify({
        success: false,
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        error: syncError.message,
        message: 'Failed to sync transaction'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Single transaction sync failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
