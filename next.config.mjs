/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true, // Remove if causing issues
    optimizePackageImports: ['@xendit/xendit-node']
  }
};

export default nextConfig;