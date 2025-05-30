// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";

export const authOptions = {
  providers: [
    {
      id: "kledo",
      name: "Kledo",
      type: "oauth",
      clientId: process.env.KLEDO_CLIENT_ID,
      clientSecret: process.env.KLEDO_CLIENT_SECRET,
      authorization: {
        url: `${process.env.KLEDO_API_BASE_URL}/oauth/authorize`,
        params: {
          scope: "invoice:write invoice:read",
          redirect_uri: process.env.KLEDO_REDIRECT_URI,
        },
      },
      token: {
        url: `${process.env.KLEDO_API_BASE_URL}/oauth/token`,
        async request(context) {
          // Your token request implementation
        },
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + account.expires_in;
      }
      return token;
    },
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };