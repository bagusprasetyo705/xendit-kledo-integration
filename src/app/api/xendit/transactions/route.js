// API route to fetch Xendit transactions
export async function GET() {
  try {
    if (!process.env.XENDIT_SECRET_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Xendit API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch invoices from Xendit API
    const response = await fetch('https://api.xendit.co/v2/invoices', {
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
    
    // Filter only successful/paid transactions
    const successfulTransactions = invoices.filter(invoice => 
      invoice.status === 'SETTLED' || invoice.status === 'PAID'
    );

    return new Response(JSON.stringify({
      success: true,
      data: invoices, // Return all invoices for debugging
      successful_only: successfulTransactions,
      total: invoices.length,
      successful_count: successfulTransactions.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to fetch Xendit transactions:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = 'force-dynamic';
