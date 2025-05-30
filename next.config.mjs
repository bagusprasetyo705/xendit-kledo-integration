/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For proper serverless function packaging
  // Optional: Add experimental features if needed
  experimental: {
    serverActions: true,
    optimizePackageImports: ['@xendit/xendit-node']
  },
  // Enable React Strict Mode
  reactStrictMode: true
};

export default nextConfig;