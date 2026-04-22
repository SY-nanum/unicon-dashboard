/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**': ['./data/**/*', './data-cache/**/*'],
  },
};

export default nextConfig;
