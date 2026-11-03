// Preview-only opt-in for the original FANTASY MMADNESS Growth Engine.
// Production is OFF by default; all other administration pages stay unchanged.
export const GROWTH_ENGINE_V2 = process.env.NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED === 'true';
export const GROWTH_SECTIONS = [
  { slug: 'overview', label: 'Overview' },
  { slug: 'approvals', label: 'Campaign approvals' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'pr', label: 'Public relations' },
  { slug: 'affiliates', label: 'Affiliate recruitment' },
  { slug: 'publishing', label: 'Social publishing' },
  { slug: 'posters', label: 'Poster generation', consoleSection: 'marketing', consoleQuery: 'view=posters' },
  { slug: 'automation', label: 'Automation' },
  { slug: 'analytics', label: 'Analytics' },
  { slug: 'revenue', label: 'Revenue attribution' },
  { slug: 'connections', label: 'Connections' },
];
