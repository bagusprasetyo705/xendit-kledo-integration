// app/api/kledo/test/route.js
export async function GET() {
  try {
    // Dynamic imports to avoid build-time circular dependencies
    const { getKledoAccessToken, getKledoProfile } = await import("@/lib/kledo-service");
    
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: "No Kledo access token available. Please authenticate first."
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test the connection by getting user profile
    const profile = await getKledoProfile(accessToken);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Successfully connected to Kledo API",
      user: {
        id: profile.data?.id,
        name: profile.data?.name,
        email: profile.data?.email,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Kledo API test failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = 'force-dynamic';
