/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx is server-only; keep it out of client bundles
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
  // Include data files in Vercel serverless function bundle
  outputFileTracingIncludes: {
    '/industry/**': ['./data/industry/**/*'],
    '/energy/**': ['./data/energy/**/*'],
    '/transport/**': ['./data/transport/**/*'],
    '/building/**': ['./data/building/**/*'],
    '/integrated/**': ['./data/integrated/**/*'],
    '/forestry/**': ['./data/forest/**/*'],
  },
};

export default nextConfig;
