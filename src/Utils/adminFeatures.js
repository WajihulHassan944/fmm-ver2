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

// Old growth screens retired by V2 (pages stay in the codebase for rollback).
export const RETIRED_GROWTH_ROUTES = {
  '/administration/growth': 'marketing',
  '/administration/fan-acquisition': 'pr',
  '/administration/july-growth': 'overview',
};
