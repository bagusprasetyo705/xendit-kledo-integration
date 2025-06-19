// Debug endpoint to show raw Kledo API response
import { getKledoAccessToken } from '@/lib/kledo-service';

export async function GET() {
  try {
    console.log('🔍 Debug: Fetching raw Kledo finance accounts response...');
    
    const accessToken = await getKledoAccessToken();
    
    if (!accessToken) {
      return Response.json(
        { 
          success: false, 
          error: "No Kledo access token available",
          debug: "Make sure you're connected to Kledo first"
        },
        { status: 401 }
      );
    }

    // Fetch finance accounts using the exact curl example provided
    const response = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`,
        'X-APP': 'finance',
      },
    });

    console.log(`📊 Raw API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      return Response.json({
        success: false,
        error: `API returned ${response.status}`,
        raw_error: errorText,
        headers: Object.fromEntries(response.headers.entries()),
        debug: {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        }
      });
    }

    // Get the raw response text first
    const rawText = await response.text();
    console.log('📋 Raw Response Text:', rawText);

    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
      console.log('✅ Parsed JSON:', parsedData);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return Response.json({
        success: false,
        error: "Response is not valid JSON",
        raw_response: rawText,
        parse_error: parseError.message
      });
    }

    // Return detailed debug information
    return Response.json({
      success: true,
      debug: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        content_type: response.headers.get('content-type'),
        response_size: rawText.length
      },
      raw_response: rawText,
      parsed_data: parsedData,
      data_structure: {
        type: typeof parsedData,
        is_array: Array.isArray(parsedData),
        has_data_property: parsedData && typeof parsedData === 'object' && 'data' in parsedData,
        data_type: parsedData && parsedData.data ? typeof parsedData.data : 'undefined',
        data_is_array: parsedData && Array.isArray(parsedData.data),
        data_length: parsedData && Array.isArray(parsedData.data) ? parsedData.data.length : 'N/A',
        keys: parsedData && typeof parsedData === 'object' ? Object.keys(parsedData) : []
      }
    });

  } catch (error) {
    console.error('❌ Debug Error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
