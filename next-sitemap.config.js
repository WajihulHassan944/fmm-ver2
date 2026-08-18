/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.fantasymmadness.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/administration/*',
    '/UserDashboard',
    '/YourFights',
    '/profile',
    '/account-settings',
    '/checkout',
    '/my-fantasy-team/*',
    '/AffiliateDashboard',
    '/AffiliateProfile',
    '/AffiliateAccountSettings',
    '/sponsor-dashboard',
    '/api/*',
  ],
  additionalSitemaps: [
    'https://www.fantasymmadness.com/server-sitemap.xml',
  ],
};
