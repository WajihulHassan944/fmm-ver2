import { safeFetchJson } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';

const staticRoutes = [
  '/',
  '/fantasy-mma',
  '/fantasy-boxing',
  '/fantasy-kickboxing',
  '/fantasy-bare-knuckle',
  '/fantasy-pro-wrestling',
  '/upcomingfights',
  '/fights',
  '/past-fights',
  '/blogs',
  '/blogs/mma',
  '/blogs/boxing',
  '/blogs/pro-wrestling',
  '/fights-news',
  '/fantasy-tips',
  '/guides',
  '/guides/how-to-play-fantasy-mma',
  '/guides/how-to-play-fantasy-boxing',
  '/guides/pro-wrestling-scoring',
  '/our-fighters',
  '/fighter-performance-tracker',
  '/leaderboard',
  '/global-leaderboard',
  '/calendar-of-fights',
  '/FantasyLeagues',
  '/pro-wrestling',
  '/pro-wrestling/how-to-play',
  '/pro-wrestling/history',
  '/playforfree',
  '/about',
  '/contact',
  '/faqs',
];

const toIsoDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const normalizeUrl = (entry) => {
  const loc = entry?.loc || entry?.url || entry?.path || entry?.route;
  if (!loc) return null;
  const absolute = String(loc).startsWith('http') ? loc : `${SITE_URL}${String(loc).startsWith('/') ? loc : `/${loc}`}`;
  return {
    loc: absolute,
    lastmod: toIsoDate(entry?.lastmod || entry?.updatedAt || entry?.createdAt),
    priority: entry?.priority || '0.70',
    changefreq: entry?.changefreq || entry?.changeFrequency || 'daily',
  };
};

const buildXml = (urls) => {
  const unique = new Map();
  urls.filter(Boolean).forEach((entry) => unique.set(entry.loc, entry));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(unique.values()).map((entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

export const getServerSideProps = async ({ res }) => {
  let dynamicEntries = [];

  try {
    const payload = await safeFetchJson('/api/public/seo/sitemap-data', { limit: 5000 }, { timeoutMs: 10000 });
    dynamicEntries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.entries)
          ? payload.entries
          : Array.isArray(payload?.urls)
            ? payload.urls
            : [];
  } catch (error) {
    console.warn('Dynamic sitemap data unavailable, serving static SEO sitemap:', error.message);
  }

  const urls = [
    ...staticRoutes.map((path) => ({ path, priority: path === '/' ? '1.00' : '0.80', changefreq: 'daily' })),
    ...dynamicEntries,
  ].map(normalizeUrl);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(buildXml(urls));
  res.end();

  return { props: {} };
};

export default function ServerSitemap() {
  return null;
}
