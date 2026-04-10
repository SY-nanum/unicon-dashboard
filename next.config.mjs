/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**': ['./data/**/*'],
  },
};

export default nextConfig;
