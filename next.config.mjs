/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
    ],
  },
};

export default nextConfig;
