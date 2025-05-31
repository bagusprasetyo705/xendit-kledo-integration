// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import KledoProvider from "./kledo-provider"; // Create this file

export const authOptions = {
  providers: [
    KledoProvider({
      clientId: process.env.KLEDO_CLIENT_ID,
      clientSecret: process.env.KLEDO_CLIENT_SECRET,
      authorization: {
        url: `${process.env.KLEDO_API_BASE_URL}/oauth/authorize`,
        params: {
          scope: "invoice:write invoice:read",
          redirect_uri: process.env.KLEDO_REDIRECT_URI,
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };