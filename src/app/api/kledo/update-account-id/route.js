// API endpoint to update the fixed finance account ID
import { getKledoAccessToken } from '@/lib/kledo-service';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return Response.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔧 Updating fixed finance account ID to: ${accountId}`);
    
    // Validate the account ID exists in Kledo first
    const accessToken = await getKledoAccessToken();
    if (!accessToken) {
      return Response.json(
        { success: false, error: "No Kledo access token available" },
        { status: 401 }
      );
    }

    // Validate the account exists
    const validateResponse = await fetch(`${process.env.KLEDO_API_BASE_URL}/finance/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*',
        'X-APP': 'finance',
      },
    });

    if (!validateResponse.ok) {
      return Response.json(
        { success: false, error: `Account ID ${accountId} does not exist in Kledo` },
        { status: 400 }
      );
    }

    const accountData = await validateResponse.json();
    console.log(`✅ Account validated: ${accountData.data?.name}`);

    // Update the code file
    const kledoServicePath = path.join(process.cwd(), 'src', 'lib', 'kledo-service.js');
    const kledoServiceContent = fs.readFileSync(kledoServicePath, 'utf8');
    
    // Replace the fixed account ID in the getDefaultFinanceAccountId function
    const updatedContent = kledoServiceContent.replace(
      /const fixedAccountId = "[^"]*";/,
      `const fixedAccountId = "${accountId}";`
    );
    
    if (updatedContent === kledoServiceContent) {
      return Response.json(
        { success: false, error: "Could not find the fixed account ID line to update" },
        { status: 500 }
      );
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(kledoServicePath, updatedContent, 'utf8');
    
    console.log(`✅ Successfully updated finance account ID to: ${accountId}`);
    
    return Response.json({
      success: true,
      message: `Finance account ID updated to ${accountId}`,
      accountName: accountData.data?.name,
      previousId: kledoServiceContent.match(/const fixedAccountId = "([^"]*)";/)?.[1] || 'unknown'
    });

  } catch (error) {
    console.error('❌ Error updating finance account ID:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
