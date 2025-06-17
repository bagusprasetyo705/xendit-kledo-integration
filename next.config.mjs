/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['xendit-node']
  },
  env: {
    XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY,
    KLEDO_CLIENT_ID: process.env.KLEDO_CLIENT_ID,
    KLEDO_CLIENT_SECRET: process.env.KLEDO_CLIENT_SECRET,
    KLEDO_API_BASE_URL: process.env.KLEDO_API_BASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  }
};

export default nextConfig;