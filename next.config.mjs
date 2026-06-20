/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Keep production builds deterministic on CI hosts that expose many CPUs.
    cpus: 2,
  },

  async redirects() {
    return [
      { source: '/upcomingfights', destination: '/fights?status=upcoming', permanent: true },
      { source: '/past-fights', destination: '/fights?status=past', permanent: true },
      { source: '/past-fights-records', destination: '/fights?status=past', permanent: true },
      { source: '/global-leaderboard', destination: '/leaderboard', permanent: true },
      { source: '/login', destination: '/auth?mode=login', permanent: false },
      { source: '/CreateAccount', destination: '/auth?mode=signup&role=player', permanent: false },
      { source: '/AffiliateCreateAccount', destination: '/auth?mode=signup&role=affiliate', permanent: false },
      { source: '/affiliate-create-account', destination: '/auth?mode=signup&role=affiliate', permanent: false },
    ];
  },

  webpack: (config) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
    ],
  },
};

export default nextConfig;
