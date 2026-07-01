import { SITE_URL } from './seoConfig';

export const SPORT_LANDING_CONFIG = {
  mma: {
    slug: 'fantasy-mma',
    sport: 'MMA',
    eyebrow: 'Fantasy MMA contests',
    title: 'Play Fantasy MMA Prediction Contests With Real Fight-Night Energy',
    description: 'Build picks for MMA fight cards, follow live fight opportunities, and compete on Fantasy MMAdness with a premium fight-night experience.',
    keywords: 'fantasy MMA, MMA prediction contests, UFC fantasy picks, fantasy fight games, MMA fight card predictions',
    heroImage: '/images/fmm-experience/homepage-fight-hero.webp',
    accent: 'red',
    categoryAliases: ['MMA', 'UFC', 'Combat', 'Mixed Martial Arts'],
    bullets: ['Pick winners and fight outcomes', 'Track upcoming and live cards', 'Use fantasy scoring to climb leaderboards'],
    faqs: [
      ['What is Fantasy MMA?', 'Fantasy MMA lets users make fight predictions, follow fight cards, and compete using platform scoring instead of simply watching the event.'],
      ['Can I play upcoming MMA fights?', 'Yes. Upcoming and active fights can be shown on the site when they are added and opened from the admin side.'],
      ['Does Fantasy MMAdness support content around MMA fights?', 'Yes. Fight pages, blogs, social drafts, and SEO suggestions can all support MMA campaigns.'],
    ],
  },
  boxing: {
    slug: 'fantasy-boxing',
    sport: 'Boxing',
    eyebrow: 'Fantasy boxing contests',
    title: 'Fantasy Boxing Contests For Fight-Night Picks, Previews & Predictions',
    description: 'Enter boxing-focused prediction contests, discover fresh fight opportunities, and follow boxing cards with a premium fantasy combat-sports experience.',
    keywords: 'fantasy boxing, boxing prediction contests, boxing fight picks, fantasy boxing game, boxing fight card',
    heroImage: '/images/fmm-pages/player-fight-night-premium.webp',
    accent: 'gold',
    categoryAliases: ['Boxing', 'BOXING'],
    bullets: ['Boxing-specific campaign pages', 'Manual fight scoring support', 'Blog and social draft support for fight promotion'],
    faqs: [
      ['Is Boxing separate from MMA?', 'Yes. Boxing is treated as its own user-facing sport option so boxing campaigns do not feel hidden under generic combat wording.'],
      ['Can boxing fights be promoted?', 'Yes. A boxing fight can trigger content, SEO, social, newsletter, and homepage-feature style campaign drafts.'],
      ['Can total punches be entered manually?', 'Yes. Total punches are treated as a separate manual scoring value rather than being auto-added from head and body punches.'],
    ],
  },
  kickboxing: {
    slug: 'fantasy-kickboxing',
    sport: 'Kickboxing',
    eyebrow: 'Fantasy kickboxing contests',
    title: 'Fantasy Kickboxing Predictions For Striking-Focused Fight Cards',
    description: 'Create prediction opportunities for kickboxing cards, highlight striking matchups, and connect fight-night content with Fantasy MMAdness campaigns.',
    keywords: 'fantasy kickboxing, kickboxing predictions, kickboxing fight card, combat sports fantasy',
    heroImage: '/images/fmm-pages/premium-arena-banner.webp',
    accent: 'orange',
    categoryAliases: ['Kickboxing', 'KICKBOXING'],
    bullets: ['Striking-card presentation', 'Sport-specific landing content', 'Related fight and blog modules'],
    faqs: [
      ['Can kickboxing have its own SEO page?', 'Yes. This landing page creates a dedicated search-friendly destination for kickboxing fantasy content.'],
      ['Can kickboxing fights use the same platform engine?', 'Yes. The website can present kickboxing as a dedicated sport while still using the shared fight infrastructure.'],
      ['What should appear on this page?', 'Fresh fights, explainers, FAQs, related blogs, and calls to join active fight opportunities.'],
    ],
  },
  'bare-knuckle': {
    slug: 'fantasy-bare-knuckle',
    sport: 'Bare-Knuckle',
    eyebrow: 'Fantasy bare-knuckle contests',
    title: 'Fantasy Bare-Knuckle Fight Contests With Fresh Fight Opportunities',
    description: 'Promote bare-knuckle fight cards with dedicated fantasy prediction content, public fight opportunities, and SEO-ready landing content.',
    keywords: 'fantasy bare knuckle, bare-knuckle predictions, bare knuckle fight cards, combat sports contests',
    heroImage: '/images/fmm-pages/premium-duel-banner.webp',
    accent: 'steel',
    categoryAliases: ['Bare Knuckle', 'Bare-Knuckle', 'Bareknuckle', 'BKFC'],
    bullets: ['Dedicated bare-knuckle traffic page', 'Fight-card CTA sections', 'Content bridge to blogs and fight details'],
    faqs: [
      ['Why add a bare-knuckle page?', 'It gives Google and new users a dedicated landing page for bare-knuckle fantasy contests.'],
      ['Can admins add bare-knuckle fights?', 'When fight records use a bare-knuckle category, this page can surface relevant cards and content.'],
      ['Does this replace MMA or Boxing?', 'No. It adds a new traffic doorway while preserving the existing fight system.'],
    ],
  },
  'pro-wrestling': {
    slug: 'fantasy-pro-wrestling',
    sport: 'Pro Wrestling',
    eyebrow: 'Fantasy pro wrestling',
    title: 'Fantasy Pro Wrestling Match Predictions, Scorecards & Leaderboards',
    description: 'Play Fantasy MMAdness Pro Wrestling with match predictions, scorecards, wrestler profiles, and a premium wrestling-style contest experience.',
    keywords: 'fantasy pro wrestling, wrestling predictions, pro wrestling scorecards, wrestler profiles, wrestling fantasy game',
    heroImage: '/images/pro-wrestling/pro-wrestling-hero.webp',
    accent: 'purple',
    categoryAliases: ['Pro Wrestling', 'Wrestling', 'PRO_WRESTLING'],
    bullets: ['Wrestling-specific match cards', 'Wrestler profile SEO paths', 'Leaderboards and scoring explainers'],
    faqs: [
      ['How is Pro Wrestling handled?', 'Pro Wrestling has dedicated pages, match flows, wrestler profiles, and scoring language separate from MMA and Boxing.'],
      ['Can wrestling matches have SEO pages?', 'Yes. Match pages and wrestler profile pages can build long-tail search visibility.'],
      ['Is the design consistent with the site?', 'Yes. The page uses the same premium Fantasy MMAdness theme with wrestling-oriented backgrounds and gradients.'],
    ],
  },
};

export const SPORT_SLUG_TO_KEY = Object.values(SPORT_LANDING_CONFIG).reduce((acc, item) => {
  acc[item.slug] = Object.keys(SPORT_LANDING_CONFIG).find((key) => SPORT_LANDING_CONFIG[key] === item);
  return acc;
}, {});

export const getSportConfigByKey = (key = 'mma') => SPORT_LANDING_CONFIG[key] || SPORT_LANDING_CONFIG.mma;

export const normalizeSlug = (value = '') => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const cleanText = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const getMatchTitle = (match = {}) => match.matchName || match.title || `${match.matchFighterA || match.fighterAName || 'Fighter A'} vs ${match.matchFighterB || match.fighterBName || 'Fighter B'}`;

export const getMatchSport = (match = {}) => match.matchCategoryTwo || match.matchCategory || match.sport || match.category || 'Combat Sports';

export const getMatchImage = (match = {}) => match.fightImage || match.matchImage || match.heroImage || match.fighterAImage || match.fighterBImage || '/images/fmm-pages/premium-duel-banner.webp';

export const getMatchDateLabel = (match = {}) => {
  const raw = match.matchDate || match.date || match.scheduledAt || match.createdAt;
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return 'Schedule pending';
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const getEntityName = (entity = {}) => entity.name || entity.fullName || entity.fighterName || entity.wrestlerName || entity.matchFighterA || entity.title || 'Fantasy MMAdness profile';

export const getEntityImage = (entity = {}) => entity.image || entity.profileImage || entity.avatar || entity.fighterImage || entity.wrestlerImage || entity.fighterAImage || '/images/fmm-pages/our-fighters-featured-sharp.webp';

export const getBlogTitle = (blog = {}) => blog.metaTitle || blog.header || blog.title || 'Fantasy MMAdness fight story';

export const getBlogDescription = (blog = {}) => cleanText(blog.metaDescription || blog.description || blog.sections?.[0]?.content || blog.content || '').slice(0, 210);

export const buildSportsEventSchema = (match = {}, path = '/') => ({
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: getMatchTitle(match),
  url: `${SITE_URL}${path}`,
  startDate: match.matchDate || match.date || match.scheduledAt || undefined,
  image: getMatchImage(match).startsWith('http') ? getMatchImage(match) : `${SITE_URL}${getMatchImage(match)}`,
  sport: getMatchSport(match),
  eventStatus: 'https://schema.org/EventScheduled',
  description: cleanText(match.description || `${getMatchTitle(match)} fantasy prediction contest on Fantasy MMAdness.`),
});

export const buildPersonSchema = (entity = {}, path = '/', type = 'Person') => ({
  '@context': 'https://schema.org',
  '@type': type,
  name: getEntityName(entity),
  url: `${SITE_URL}${path}`,
  image: getEntityImage(entity).startsWith('http') ? getEntityImage(entity) : `${SITE_URL}${getEntityImage(entity)}`,
  description: cleanText(entity.description || entity.bio || `${getEntityName(entity)} profile on Fantasy MMAdness.`),
});

export const buildArticleSchema = (blog = {}, path = '/') => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: getBlogTitle(blog),
  description: getBlogDescription(blog),
  url: `${SITE_URL}${path}`,
  image: blog.blogHeaderImage || blog.image || `${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`,
  datePublished: blog.createdAt || undefined,
  dateModified: blog.updatedAt || blog.createdAt || undefined,
  publisher: {
    '@type': 'Organization',
    name: 'Fantasy MMAdness',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/fmm-experience/fantasy-mmadness-logo.webp` },
  },
});
