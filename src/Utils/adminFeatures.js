// Admin back-office feature switches.
// GROWTH_ENGINE_V2 (default ON): the working Growth Engine command center replaces the
// retired growth screens (Fight Launch Desk / "This Week's Three Fights", Fan
// Acquisition command center, July 10K growth). Rollback: set
// NEXT_PUBLIC_GROWTH_ENGINE_V2=off and redeploy — the previous menu and screens return
// unchanged (nothing was deleted, and no backend or data is affected either way).
export const GROWTH_ENGINE_V2 = String(process.env.NEXT_PUBLIC_GROWTH_ENGINE_V2 || 'on').toLowerCase() !== 'off';

// Sections of the Growth Engine command center (slugs match the console's own routes).
export const GROWTH_SECTIONS = [
  { slug: 'overview', label: 'Dashboard' },
  { slug: 'approvals', label: 'Campaign approvals' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'pr', label: 'Public relations' },
  { slug: 'affiliates', label: 'Affiliate recruitment' },
  { slug: 'publishing', label: 'Publishing' },
  { slug: 'automation', label: 'Automation' },
  { slug: 'analytics', label: 'Analytics' },
  { slug: 'revenue', label: 'Revenue attribution' },
  { slug: 'connections', label: 'Connections' },
];

// Legacy automation screens, classified by the functional audit (Nov 2026).
// V2 hides HIDDEN_FROM_MENU items from navigation; the pages and their data stay.
// REDIRECT_TO_GROWTH sends a retired/broken screen to the Growth Engine section that
// replaces it. Fight Launch Desk (affiliate posters & QR) is WORKING and kept.
export const HIDDEN_FROM_MENU = new Set([
  '/administration/swarm',        // PARTIALLY WORKING: template drafts only (no AI/IONOS configured)
  '/administration/seo-growth',   // PARTIALLY WORKING: agent buttons = template text; page metadata not read by the site
  '/administration/july-growth',  // OBSOLETE: July 2026 campaign
  '/administration/BlogsAiBot',   // DISPLAY ONLY: redirect into Swarm
  '/administration/MakePost',     // BROKEN: X posting not connected; Make.com result unchecked
]);
export const REDIRECT_TO_GROWTH = {
  '/administration/fan-acquisition': 'pr',      // replaced by PR + Affiliate recruitment
  '/administration/july-growth': 'overview',    // obsolete
  '/administration/MakePost': 'publishing',     // replaced by approval-gated Publishing
  '/administration/tweet': 'publishing',
  '/administration/tiktok': 'publishing',
};

// Staging review mode (test previews only; never set on the live site).
// The test back office signs in with the Growth Engine owner password against the
// isolated staging engine and never sends live admin credentials or tokens anywhere.
// Screens that read or change live data (fights, players, payouts, payments) are not
// opened here, so staging is never connected to production admin write operations.
export const ADMIN_STAGING_REVIEW = String(process.env.NEXT_PUBLIC_ADMIN_STAGING_REVIEW || '').trim().toLowerCase() === 'on';
export const isStagingReviewPath = (path = '') => {
  const p = String(path || '').split(/[?#]/)[0].replace(/\/+$/, '');
  return p === '/administration/growth-engine' || p.startsWith('/administration/growth-engine/') || p === '/administration/back-office-guide';
};
