export const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fantasymmadness.com').replace(/\/$/, '');
export const SITE_NAME = 'Fantasy MMAdness';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/fmm-pages/premium-duel-banner.webp`;

const baseDescription = 'Play fantasy MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests. Pick fights, climb leaderboards, and compete for fantasy rewards.';

export const SEO_ROUTE_MAP = {
  '/': {
    title: 'Fantasy MMAdness | Fantasy MMA, Boxing & Pro Wrestling Contests',
    description: baseDescription,
    keywords: 'fantasy MMA, fantasy boxing, fantasy combat sports, UFC predictions, boxing predictions, pro wrestling fantasy, fight contests',
    image: `${SITE_URL}/images/fmm-experience/homepage-fight-hero.webp`,
  },
  '/home': {
    title: 'Fantasy MMAdness | Fresh Fight Contests & Prediction Games',
    description: baseDescription,
    keywords: 'fantasy fight contests, MMA prediction game, boxing prediction game, pro wrestling predictions',
    image: `${SITE_URL}/images/fmm-pages/player-fight-night-premium.webp`,
  },

  '/fantasy-mma': {
    title: 'Fantasy MMA Prediction Contests | Fantasy MMAdness',
    description: 'Play Fantasy MMA prediction contests with fight pages, upcoming cards, strategy guides, and premium fight-night experiences.',
    keywords: 'fantasy MMA, MMA prediction contests, UFC fantasy picks, MMA fight predictions',
    image: `${SITE_URL}/images/fmm-experience/homepage-fight-hero.webp`,
  },
  '/fantasy-boxing': {
    title: 'Fantasy Boxing Contests | Boxing Fight Predictions',
    description: 'Enter fantasy boxing prediction contests, discover boxing fight opportunities, and follow boxing campaigns on Fantasy MMAdness.',
    keywords: 'fantasy boxing, boxing prediction contests, boxing fight picks, boxing fantasy game',
    image: `${SITE_URL}/images/fmm-pages/player-fight-night-premium.webp`,
  },
  '/fantasy-kickboxing': {
    title: 'Fantasy Kickboxing Contests | Kickboxing Predictions',
    description: 'Find fantasy kickboxing fight cards, prediction opportunities, and dedicated combat-sports landing content.',
    keywords: 'fantasy kickboxing, kickboxing predictions, kickboxing fight cards',
    image: `${SITE_URL}/images/fmm-pages/premium-arena-banner.webp`,
  },
  '/fantasy-bare-knuckle': {
    title: 'Fantasy Bare-Knuckle Contests | Bare-Knuckle Predictions',
    description: 'Explore fantasy bare-knuckle fight opportunities, prediction content, and combat-sports campaign pages.',
    keywords: 'fantasy bare knuckle, bare-knuckle predictions, bare knuckle fight cards',
    image: `${SITE_URL}/images/fmm-pages/premium-duel-banner.webp`,
  },
  '/fantasy-pro-wrestling': {
    title: 'Fantasy Pro Wrestling | Match Predictions & Wrestler Profiles',
    description: 'Play Fantasy Pro Wrestling with match predictions, wrestler profiles, scorecards, and premium wrestling pages.',
    keywords: 'fantasy pro wrestling, wrestling predictions, wrestler profiles, pro wrestling fantasy game',
    image: `${SITE_URL}/images/pro-wrestling/pro-wrestling-hero.webp`,
  },
  '/guides/how-to-play-fantasy-mma': {
    title: 'How To Play Fantasy MMA | Fantasy MMAdness Guide',
    description: 'Learn how to play Fantasy MMA contests, find fight opportunities, submit picks, and follow results.',
    keywords: 'how to play fantasy MMA, MMA prediction guide, fantasy fight guide',
    image: `${SITE_URL}/images/fmm-pages/league-arena-hd.webp`,
  },
  '/guides/how-to-play-fantasy-boxing': {
    title: 'How To Play Fantasy Boxing | Fantasy MMAdness Guide',
    description: 'Learn how Fantasy Boxing contests work, how to find boxing fights, and how manual scoring context is handled.',
    keywords: 'how to play fantasy boxing, boxing prediction guide, fantasy boxing scoring',
    image: `${SITE_URL}/images/fmm-pages/player-fight-night-premium.webp`,
  },
  '/guides/pro-wrestling-scoring': {
    title: 'Fantasy Pro Wrestling Scoring Guide | Fantasy MMAdness',
    description: 'Learn Fantasy Pro Wrestling prediction categories, scorecard flow, and wrestler-focused contest context.',
    keywords: 'fantasy pro wrestling scoring, wrestling prediction guide, wrestling scorecard fantasy',
    image: `${SITE_URL}/images/pro-wrestling/wrestling-live-premium.webp`,
  },
  '/upcomingfights': {
    title: 'Upcoming Fight Contests | Fantasy MMA, Boxing & Combat Sports',
    description: 'Browse upcoming MMA, Boxing, Kickboxing, Bare-Knuckle, and fantasy fight prediction contests on Fantasy MMAdness.',
    keywords: 'upcoming fights, MMA contests, boxing contests, fantasy fight card, combat sports schedule',
    image: `${SITE_URL}/images/fmm-pages/premium-duel-banner.webp`,
  },
  '/fights': {
    title: 'Fight Hub | Live, Upcoming & Past Fantasy Fight Cards',
    description: 'Explore live, upcoming, and completed fight cards across MMA, Boxing, Kickboxing, Bare-Knuckle, and fantasy combat sports.',
    keywords: 'fight hub, fantasy fight cards, live fights, past fights, MMA leaderboard',
    image: `${SITE_URL}/images/fmm-pages/premium-duel-banner.webp`,
  },
  '/past-fights': {
    title: 'Past Fight Results & Fantasy Contest Archive | Fantasy MMAdness',
    description: 'Review completed Fantasy MMAdness fight cards, results, and fantasy fight archives.',
    keywords: 'past fight results, fantasy fight archive, MMA results, boxing results',
    image: `${SITE_URL}/images/fmm-pages/premium-arena-banner.webp`,
  },
  '/blogs': {
    title: 'Fight News, Previews & Fantasy Strategy | Fantasy MMAdness',
    description: 'Read fight previews, Fantasy MMAdness updates, combat-sports analysis, and prediction strategy for MMA, Boxing, and Pro Wrestling.',
    keywords: 'fight news, MMA previews, boxing previews, fantasy fight strategy, pro wrestling news',
    image: `${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`,
  },
  '/fights-news': {
    title: 'Combat Sports News & Fight Updates | Fantasy MMAdness',
    description: 'Stay updated with combat sports news, fight-night updates, and fantasy prediction opportunities.',
    keywords: 'combat sports news, fight updates, MMA news, boxing news, fantasy sports news',
    image: `${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`,
  },
  '/fantasy-tips': {
    title: 'Fantasy Fight Strategy Tips | MMA & Boxing Predictions',
    description: 'Improve your fantasy fight picks with strategy tips for MMA, Boxing, Kickboxing, and combat-sports prediction contests.',
    keywords: 'fantasy MMA tips, boxing prediction tips, fight prediction strategy, fantasy fight guide',
    image: `${SITE_URL}/images/fmm-pages/league-arena-hd.webp`,
  },
  '/guides': {
    title: 'How To Play Fantasy MMAdness | Rules, Tokens & Scoring Guide',
    description: 'Learn how to play Fantasy MMAdness, submit fight predictions, understand scoring, use tokens, and climb the leaderboard.',
    keywords: 'how to play fantasy MMA, fight scoring guide, Fantasy MMAdness rules, prediction contest guide',
    image: `${SITE_URL}/images/fmm-pages/rewards-arena-hd.webp`,
  },
  '/our-fighters': {
    title: 'Fighter Directory | MMA, Boxing & Combat Sports Profiles',
    description: 'Browse Fantasy MMAdness fighter profiles, combat-sports names, and fight-card participants.',
    keywords: 'fighter profiles, MMA fighters, boxing fighters, combat sports athletes',
    image: `${SITE_URL}/images/fmm-pages/our-fighters-featured-sharp.webp`,
  },
  '/fighter-performance-tracker': {
    title: 'Fighter Performance Tracker | Fantasy Fight Stats',
    description: 'Track fighter performance, combat-sports stats, and fight prediction context for Fantasy MMAdness contests.',
    keywords: 'fighter stats, fighter tracker, MMA performance, boxing performance',
    image: `${SITE_URL}/images/fmm-pages/our-fighters-featured-sharp.webp`,
  },
  '/leaderboard': {
    title: 'Fantasy Fight Leaderboard | Top Fantasy MMAdness Players',
    description: 'See top Fantasy MMAdness players, fight prediction rankings, and leaderboard performance.',
    keywords: 'fantasy fight leaderboard, MMA leaderboard, prediction rankings, fight contest winners',
    image: `${SITE_URL}/images/fmm-pages/rewards-fighter-panel.webp`,
  },
  '/global-leaderboard': {
    title: 'Global Fantasy Fight Leaderboard | Fantasy MMAdness',
    description: 'View global Fantasy MMAdness rankings across fight contests, prediction games, and combat sports challenges.',
    keywords: 'global leaderboard, fantasy sports rankings, fight prediction leaderboard',
    image: `${SITE_URL}/images/fmm-pages/rewards-fighter-panel.webp`,
  },
  '/calendar-of-fights': {
    title: 'Fight Calendar | MMA, Boxing & Pro Wrestling Schedule',
    description: 'View the Fantasy MMAdness fight calendar for upcoming MMA, Boxing, combat sports, and Pro Wrestling prediction opportunities.',
    keywords: 'fight calendar, MMA schedule, boxing schedule, combat sports calendar, pro wrestling schedule',
    image: `${SITE_URL}/images/fmm-pages/premium-arena-banner.webp`,
  },
  '/FantasyLeagues': {
    title: 'Fantasy Fight Leagues | MMA, Boxing & Combat Sports Contests',
    description: 'Join Fantasy MMAdness leagues and compete in premium fantasy fight contests across combat sports.',
    keywords: 'fantasy fight leagues, fantasy MMA leagues, boxing fantasy contests, combat sports fantasy',
    image: `${SITE_URL}/images/fmm-pages/league-arena-hd.webp`,
  },
  '/pro-wrestling': {
    title: 'Fantasy Pro Wrestling | Predict Matches & Climb Leaderboards',
    description: 'Play Fantasy MMAdness Pro Wrestling with match predictions, scorecards, leaderboards, and wrestling contest rewards.',
    keywords: 'fantasy pro wrestling, wrestling predictions, pro wrestling fantasy game, wrestling leaderboard',
    image: `${SITE_URL}/images/pro-wrestling/pro-wrestling-hero.webp`,
  },
  '/pro-wrestling/how-to-play': {
    title: 'How Fantasy Pro Wrestling Works | Rules & Scoring',
    description: 'Learn Fantasy MMAdness Pro Wrestling rules, scoring categories, predictions, and leaderboard mechanics.',
    keywords: 'fantasy pro wrestling rules, wrestling scoring, wrestling prediction game',
    image: `${SITE_URL}/images/pro-wrestling/wrestling-live-premium.webp`,
  },
  '/pro-wrestling/history': {
    title: 'My Pro Wrestling History | Fantasy MMAdness',
    description: 'Review your Fantasy MMAdness Pro Wrestling history, predictions, and completed wrestling contests.',
    keywords: 'pro wrestling history, fantasy wrestling results, wrestling contest history',
    image: `${SITE_URL}/images/pro-wrestling/wrestling-history-premium.webp`,
  },
  '/playforfree': {
    title: 'Play Fantasy Fight Contests Free | Fantasy MMAdness',
    description: 'Start playing Fantasy MMAdness free and enter fight prediction contests for MMA, Boxing, and combat sports.',
    keywords: 'play fantasy MMA free, free boxing contests, free fantasy fight game',
    image: `${SITE_URL}/images/fmm-pages/player-fight-night-premium.webp`,
  },
};

const PRIVATE_PREFIXES = [
  '/administration',
  '/UserDashboard',
  '/YourFights',
  '/profile',
  '/account-settings',
  '/checkout',
  '/my-fantasy-team',
  '/AffiliateDashboard',
  '/AffiliateProfile',
  '/AffiliateAccountSettings',
  '/sponsor-dashboard',
];

export const normalizePathForSeo = (path = '/') => {
  const clean = String(path || '/').split('?')[0].split('#')[0] || '/';
  return clean !== '/' && clean.endsWith('/') ? clean.slice(0, -1) : clean;
};

export const shouldNoIndexPath = (path = '/') => {
  const clean = normalizePathForSeo(path);
  if (PRIVATE_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))) return true;
  if (clean.includes('/resetPassword') || clean.includes('/invite/')) return true;
  return false;
};

export const getSeoConfigForPath = (path = '/') => {
  const clean = normalizePathForSeo(path);
  const exact = SEO_ROUTE_MAP[clean];
  if (exact) return { ...exact, path: clean };


  if (clean.startsWith('/fight/')) {
    return {
      title: 'Fight Prediction Page | Fantasy MMAdness',
      description: 'Open a Fantasy MMAdness fight page with prediction context, schedule details, related stories, and active fight calls to action.',
      keywords: 'fight prediction page, fantasy fight card, MMA boxing prediction contest',
      image: `${SITE_URL}/images/fmm-pages/premium-duel-banner.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/fighters/')) {
    return {
      title: 'Fighter Profile | Fantasy MMAdness',
      description: 'View a fighter profile with fantasy fight opportunities, related cards, and combat-sports context.',
      keywords: 'fighter profile, fantasy MMA fighter, boxing fighter profile, combat sports stats',
      image: `${SITE_URL}/images/fmm-pages/our-fighters-featured-sharp.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/wrestlers/')) {
    return {
      title: 'Wrestler Profile | Fantasy MMAdness',
      description: 'View a Fantasy MMAdness wrestler profile with match context and pro-wrestling prediction opportunities.',
      keywords: 'wrestler profile, fantasy pro wrestling, wrestling predictions',
      image: `${SITE_URL}/images/pro-wrestling/wrestling-roster-premium.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/blogs/')) {
    return {
      title: 'Fight Blog Category | Fantasy MMAdness',
      description: 'Browse Fantasy MMAdness fight blogs, fantasy strategy, previews, and combat-sports editorial content by category.',
      keywords: 'fight blogs, MMA blogs, boxing blogs, fantasy strategy',
      image: `${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/blog-details/')) {
    return {
      title: 'Fight Story | Fantasy MMAdness',
      description: 'Read the latest Fantasy MMAdness fight story, combat-sports analysis, and prediction context.',
      keywords: 'fight story, combat sports blog, fantasy MMA blog, boxing blog',
      image: `${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/past-fight/')) {
    return {
      title: 'Completed Fight Result | Fantasy MMAdness',
      description: 'Review a completed Fantasy MMAdness fight contest, result, and leaderboard details.',
      keywords: 'completed fight result, fantasy fight leaderboard, past MMA contest',
      image: `${SITE_URL}/images/fmm-pages/premium-arena-banner.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/pro-wrestling/matches/')) {
    return {
      title: 'Pro Wrestling Match | Fantasy MMAdness',
      description: 'Open a Fantasy MMAdness Pro Wrestling match card with prediction details and contest context.',
      keywords: 'pro wrestling match, fantasy wrestling prediction, wrestling contest',
      image: `${SITE_URL}/images/pro-wrestling/wrestling-match-premium.webp`,
      path: clean,
    };
  }

  if (clean.startsWith('/pro-wrestling/wrestlers/')) {
    return {
      title: 'Pro Wrestler Profile | Fantasy MMAdness',
      description: 'View a Fantasy MMAdness Pro Wrestling profile with match and prediction context.',
      keywords: 'pro wrestler profile, fantasy wrestling roster, wrestling stats',
      image: `${SITE_URL}/images/pro-wrestling/wrestling-roster-premium.webp`,
      path: clean,
    };
  }

  return {
    title: `${SITE_NAME} | Fantasy Combat Sports`,
    description: baseDescription,
    keywords: 'Fantasy MMAdness, fantasy combat sports, fantasy MMA, fantasy boxing, pro wrestling fantasy',
    image: DEFAULT_OG_IMAGE,
    path: clean,
  };
};

export const getCanonicalUrl = (path = '/') => {
  const clean = normalizePathForSeo(path);
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
};

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/fmm-experience/fantasy-mmadness-logo.webp`,
  sameAs: [
    'https://www.instagram.com/fantasymmadness',
    'https://x.com/FMmadness2024',
    'https://www.facebook.com/fantasymmadness',
    'https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg',
  ],
});

export const buildWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: baseDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/blogs?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildBreadcrumbSchema = (path = '/') => {
  const clean = normalizePathForSeo(path);
  const segments = clean.split('/').filter(Boolean);
  if (!segments.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      ...segments.map((segment, index) => {
        const partial = `/${segments.slice(0, index + 1).join('/')}`;
        return {
          '@type': 'ListItem',
          position: index + 2,
          name: segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          item: getCanonicalUrl(partial),
        };
      }),
    ],
  };
};
