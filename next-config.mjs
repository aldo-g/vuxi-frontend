/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow prod builds to succeed even if you have TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during `next build`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
