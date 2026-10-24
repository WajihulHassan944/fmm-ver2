/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(process.env.NEXT_PUBLIC_SITE_URL)
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://www.fantasymmadness.com',
  },

  webpack: (config) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'fantasymmadness-game-server-three.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'fantasymmadness-game-server-three-taupe.vercel.app',
      },
    ],
  },

  // Compatibility for links/QR codes that were already handed out.
  async redirects() {
    return [
      {
        // Named league links from Oct 18-24 used ?affiliateId=<id>. On Vercel the
        // path name hides that value, so carry the same id as ?ref= (which the league
        // page reads). Same affiliate, same fight; other query values pass through.
        source: '/league/:slug',
        has: [{ type: 'query', key: 'affiliateId', value: '(?<aid>[a-fA-F0-9]{24})' }],
        missing: [{ type: 'query', key: 'ref' }],
        destination: '/league/:slug?ref=:aid',
        permanent: false,
      },
      {
        // Old league-invite QR codes pointed at /my-fantasy-team?referenceId=<id>.
        // Send them to that affiliate's public league page (by unique account id).
        source: '/my-fantasy-team',
        has: [{ type: 'query', key: 'referenceId', value: '(?<rid>[a-fA-F0-9]{24})' }],
        destination: '/affiliate/:rid?affiliateId=:rid',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/Fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
