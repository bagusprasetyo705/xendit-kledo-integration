// Simple health check endpoint
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Xendit-Kledo Integration API is running'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const dynamic = 'force-dynamic';
