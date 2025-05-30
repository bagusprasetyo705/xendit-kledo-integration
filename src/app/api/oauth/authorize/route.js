// app/api/oauth/authorize/route.js
import { redirect } from "next/navigation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  // Your authentication logic here
  // Then redirect back with code
  const authCode = generateAuthCode(); // Implement your code generation
  
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', authCode);
  redirectUrl.searchParams.set('state', state);
  
  return redirect(redirectUrl.toString());
}