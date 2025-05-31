/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Remove serverActions if not needed, or configure properly
    optimizePackageImports: ['@xendit/xendit-node']
  }
};

export default nextConfig;