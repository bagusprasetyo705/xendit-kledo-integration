// API route to get all transactions for dashboard display
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log("🔍 Fetching all Xendit transactions for dashboard...");
    
    if (!process.env.XENDIT_SECRET_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Xendit API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch more transactions for dashboard display
    const response = await fetch('https://api.xendit.co/v2/invoices?limit=50', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Xendit API error:', response.status, errorText);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Xendit API error: ${response.status} ${response.statusText}`,
        details: errorText
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const invoices = await response.json();
    console.log(`📊 Retrieved ${invoices.length} total invoices`);
    
    // Enhance invoice data with better formatting
    const enhancedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      external_id: invoice.external_id,
      user_id: invoice.user_id,
      status: invoice.status,
      merchant_name: invoice.merchant_name,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      created: invoice.created,
      updated: invoice.updated,
      paid_at: invoice.paid_at,
      customer_email: invoice.payer_email,
      customer_name: invoice.customer?.given_names || 'N/A',
      payment_method: invoice.payment_method,
      payment_channel: invoice.payment_channel,
      payment_destination: invoice.payment_destination,
      // Add sync status (this would come from database in real app)
      sync_status: invoice.status === 'SETTLED' || invoice.status === 'PAID' ? 'pending' : 'not_applicable',
      sync_date: null
    }));
    
    // Separate by status for better display
    const paidInvoices = enhancedInvoices.filter(invoice => 
      invoice.status === 'SETTLED' || invoice.status === 'PAID'
    );
    
    const pendingInvoices = enhancedInvoices.filter(invoice => 
      invoice.status === 'PENDING'
    );
    
    const expiredInvoices = enhancedInvoices.filter(invoice => 
      invoice.status === 'EXPIRED'
    );

    return new Response(JSON.stringify({
      success: true,
      data: enhancedInvoices,
      summary: {
        total: invoices.length,
        paid: paidInvoices.length,
        pending: pendingInvoices.length,
        expired: expiredInvoices.length
      },
      categories: {
        paid: paidInvoices,
        pending: pendingInvoices,
        expired: expiredInvoices
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
