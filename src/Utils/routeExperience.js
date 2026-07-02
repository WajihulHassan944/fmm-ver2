const CORE_ROUTES = new Set([
  '/',
  '/home',
  '/auth',
  '/login',
  '/CreateAccount',
  '/AffiliateCreateAccount',
  '/affiliate-create-account',
  '/leaderboard',
  '/mock-game',
  '/fights',
  '/upcomingfights',
  '/past-fights',
  '/fight/[matchId]',
  '/our-fighters',
  '/Sponsors',
  '/faqs',
  '/UserDashboard',
  '/myLeagueRecords',
  '/FantasyLeagues',
  '/AffiliateDashboard',
  '/HowItWorks',
  '/affiliate-league',
  '/past-promotions',
  '/AffiliateProfile',
  '/AffiliateAccountSettings',
  '/profile',
  '/account-settings',
  '/YourFights',
  '/trashed-fights',
  '/checkout',
  '/fights-rewards',
  '/my-fantasy-team',
  '/fighter-performance-tracker',
  '/referral-leaderboard',
  '/pro-wrestling',
  '/pro-wrestling/how-to-play',
  '/pro-wrestling/history',
  '/pro-wrestling/wrestlers',
  '/pro-wrestling/wrestlers/[idOrSlug]',
  '/pro-wrestling/matches/[matchId]',
  '/pro-wrestling/play/[matchId]',
  '/pro-wrestling/live/[matchId]',
  '/pro-wrestling/leaderboard',
  '/pro-wrestling/leaderboard/[matchId]',
]);

export const shouldUseRouteExperienceFrame = (pathname) => {
  if (!pathname || pathname.startsWith('/administration')) return false;
  if (pathname.startsWith('/pro-wrestling')) return false;
  return !CORE_ROUTES.has(pathname);
};

export default shouldUseRouteExperienceFrame;
