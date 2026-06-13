/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint errors during build
  },
  experimental: {
    appDir: true, // Ensure Next.js recognizes the custom structure
  },
  images: {
    domains: ['res.cloudinary.com', 'cdn-icons-png.flaticon.com'],
  },
};

export default nextConfig;
