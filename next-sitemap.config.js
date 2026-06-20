/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.fantasymmadness.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/administration/**',
    '/api/**',
    '/UserDashboard',
    '/AffiliateDashboard',
    '/sponsor-dashboard',
    '/profile',
    '/checkout',
    '/login',
    '/CreateAccount',
    '/AffiliateCreateAccount',
    '/affiliate-create-account',
    '/upcomingfights',
    '/past-fights',
    '/global-leaderboard',
  ],
};
