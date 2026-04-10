/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx is server-only; keep it out of client bundles
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
};

export default nextConfig;
