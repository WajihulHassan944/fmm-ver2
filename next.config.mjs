
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },

  images: {
    domains: [
      'res.cloudinary.com',
      'cdn-icons-png.flaticon.com',
    ],
  },
};


export default nextConfig;
