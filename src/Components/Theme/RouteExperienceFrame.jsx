import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  FaArrowRight,
  FaBolt,
  FaChevronRight,
  FaHome,
  FaLayerGroup,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';

const BACKGROUNDS = {
  editorial: '/images/fmm-pages/editorial-arena-hd.webp',
  community: '/images/fmm-pages/community-arena-hd.webp',
  profile: '/images/fmm-pages/profile-arena-hd.webp',
  rewards: '/images/fmm-pages/rewards-arena-hd.webp',
  affiliate: '/images/fmm-pages/league-arena-hd.webp',
  legal: '/images/fmm-pages/legal-arena-hd.webp',
};


const ROUTE_BACKGROUNDS = {
  '/blogs': '/images/fmm-pages/premium-arena-banner.png',
  '/fights-news': '/images/fmm-pages/premium-affiliate-banner.png',
  '/fantasy-tips': '/images/fmm-pages/premium-duel-banner.png',
  '/calendar-of-fights': '/images/fmm-pages/premium-arena-banner.png',
};

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
]);

const ROUTE_META = {

  '/upcomingfights': {
    group: 'editorial', eyebrow: 'Upcoming fight cards', title: 'Find your next prediction.',
    description: 'Browse the scheduled cards and enter prediction contests using the existing fight flow.',
  },
  '/past-fights': {
    group: 'editorial', eyebrow: 'Completed fight cards', title: 'Review finished contests.',
    description: 'Explore past cards, completed outcomes, and historical Fantasy MMAdness fight activity.',
  },
  '/about': {
    group: 'legal', eyebrow: 'Inside Fantasy MMAdness', title: 'Built for combat sports fans.',
    description: 'Meet the platform, principles, and fight-night vision behind every prediction experience.',
  },
  '/contact': {
    group: 'legal', eyebrow: 'Contact the corner', title: 'Start the conversation.',
    description: 'Questions about leagues, sponsorships, support, or fight cards are routed to the right team.',
  },
  '/faqs': {
    group: 'legal', eyebrow: 'Support center', title: 'Answers before the bell.',
    description: 'Understand accounts, predictions, scoring, tokens, leagues, and platform operations.',
  },
  '/privacy-policy': {
    group: 'legal', eyebrow: 'Platform standards', title: 'Privacy policy.',
    description: 'Review how account information and platform activity are handled.', compact: true,
  },
  '/terms-of-service': {
    group: 'legal', eyebrow: 'Platform standards', title: 'Terms of service.',
    description: 'The rules and responsibilities governing Fantasy MMAdness participation.', compact: true,
  },
  '/testimonials': {
    group: 'legal', eyebrow: 'From the community', title: 'Fight-night stories.',
    description: 'Hear how players, creators, and partners experience the platform.',
  },
  '/guides': {
    group: 'legal', eyebrow: 'Player playbook', title: 'Master every round.',
    description: 'Step-by-step guidance for accounts, predictions, scoring, wallets, and public profiles.',
  },
  '/forum-rules': {
    group: 'legal', eyebrow: 'Community standards', title: 'Keep the corner respectful.',
    description: 'The rules that protect constructive fight discussion and fair participation.', compact: true,
  },
  '/blogs': {
    group: 'editorial', eyebrow: 'Fight intelligence', title: 'Stories beyond the scorecard.',
    description: 'Analysis, previews, platform updates, and combat-sports editorial from the Fantasy MMAdness team.',
  },
  '/blog-details/[blogId]': {
    group: 'editorial', eyebrow: 'Fight intelligence', title: 'Inside the story.',
    description: 'Long-form fight analysis and platform editorial.', compact: true,
  },
  '/fights-news': {
    group: 'editorial', eyebrow: 'Latest from the arena', title: 'Fight news, sharpened.',
    description: 'Stay current with combat-sports headlines, event movement, and relevant platform updates.',
  },
  '/fantasy-tips': {
    group: 'editorial', eyebrow: 'Prediction lab', title: 'Think one round ahead.',
    description: 'Practical strategy for reading matchups, methods, rounds, and scoring opportunities.',
  },
  '/past-fights-records': {
    group: 'editorial', eyebrow: 'Fight archive', title: 'Replay the moments.',
    description: 'Browse completed cards, archived videos, and historical outcomes.',
  },
  '/past-fight/[matchId]': {
    group: 'editorial', eyebrow: 'Fight archive', title: 'Official fight record.',
    description: 'Review the matchup, result, scoring context, and archived fight details.', compact: true,
  },
  '/calendar-of-fights': {
    group: 'editorial', eyebrow: 'Event calendar', title: 'Never miss the bell.',
    description: 'Track upcoming combat-sports dates and plan your next predictions.',
  },
  '/community-forum': {
    group: 'community', eyebrow: 'Community corner', title: 'Where fight opinions collide.',
    description: 'Start threads, compare predictions, and discuss every card with the Fantasy MMAdness community.',
  },
  '/create-thread': {
    group: 'community', eyebrow: 'Community corner', title: 'Open a new discussion.',
    description: 'Create a focused thread and invite the community into the conversation.', compact: true,
  },
  '/threads/[threadId]': {
    group: 'community', eyebrow: 'Community corner', title: 'Inside the thread.',
    description: 'Follow the discussion, reply, and keep the conversation moving.', compact: true,
  },
  '/fantasy-chatroom': {
    group: 'community', eyebrow: 'Live community', title: 'Talk fights in real time.',
    description: 'A live room for predictions, reactions, and fight-night conversation.', compact: true,
  },
  '/profile': {
    group: 'profile', eyebrow: 'Player account', title: 'Your public fight identity.',
    description: 'Manage profile details, payout preferences, sharing, and account settings.',
  },
  '/account/settings': {
    group: 'profile', eyebrow: 'Player account', title: 'Account settings.',
    description: 'Manage notifications, communication preferences, and payout identity separately from your public profile.', compact: true,
  },
  '/account/security': {
    group: 'profile', eyebrow: 'Player security', title: 'Secure every session.',
    description: 'Change your password and review or revoke active account sessions.', compact: true,
  },
  '/account/wallet': {
    group: 'rewards', eyebrow: 'Fight wallet', title: 'Every token movement.',
    description: 'Review the authoritative wallet ledger for entries, rewards, refunds, purchases, and adjustments.', compact: true,
  },
  '/[userId]': {
    group: 'profile', eyebrow: 'Player profile', title: 'Competitor record.',
    description: 'View a public player profile, completed fights, and leaderboard performance.', compact: true,
  },
  '/YourFights': {
    group: 'profile', eyebrow: 'Your fight room', title: 'Every prediction. One place.',
    description: 'Track active entries, pending outcomes, completed fights, and contest history.',
  },
  '/trashed-fights': {
    group: 'profile', eyebrow: 'Fight room archive', title: 'Removed fight entries.',
    description: 'Review fights moved out of the primary dashboard.', compact: true,
  },
  '/myLeagueRecords': {
    group: 'profile', eyebrow: 'League records', title: 'Your league footprint.',
    description: 'Review league participation, results, and performance history.',
  },
  '/my-fantasy-team': {
    group: 'profile', eyebrow: 'Fantasy roster', title: 'Build your fight team.',
    description: 'Assemble and manage a roster designed around upcoming combat-sports events.',
  },
  '/fighter-performance-tracker': {
    group: 'profile', eyebrow: 'Performance data', title: 'Track the fighter curve.',
    description: 'Compare records, recent form, and performance indicators before making a prediction.',
  },
  '/referral-leaderboard': {
    group: 'rewards', eyebrow: 'Referral standings', title: 'Bring the loudest corner.',
    description: 'Track referral momentum and see who is growing the community fastest.',
  },
  '/invite/[referrerId]': {
    group: 'rewards', eyebrow: 'You have been invited', title: 'Enter the fight room.',
    description: 'Join through a community invitation and start your Fantasy MMAdness account.', compact: true,
  },
  '/playforfree': {
    group: 'rewards', eyebrow: 'Free fight experience', title: 'Predict without hesitation.',
    description: 'Explore the platform and learn the prediction flow before entering larger contests.',
  },
  '/spin-wheel': {
    group: 'rewards', eyebrow: 'Reward activation', title: 'Take your spin.',
    description: 'Use the reward wheel and discover your next platform bonus.', compact: true,
  },
  '/mock-game': {
    group: 'rewards', eyebrow: 'Prediction simulator', title: 'Practice the scorecard.',
    description: 'Test round-by-round prediction logic in a no-pressure mock fight.', compact: true,
  },
  '/checkout': {
    group: 'rewards', eyebrow: 'Secure checkout', title: 'Complete your corner.',
    description: 'Confirm your membership or token purchase through the existing secure checkout flow.', compact: true,
  },
  '/AffiliateAccountSettings': {
    group: 'affiliate', eyebrow: 'Creator account', title: 'Affiliate account settings.',
    description: 'Manage private payment details and payout requests separately from the public creator profile.', compact: true,
  },
  '/AffiliateProfile': {
    group: 'affiliate', eyebrow: 'Creator account', title: 'Your affiliate identity.',
    description: 'Manage creator details, payment preferences, distinctions, and public league information.',
  },
  '/AffiliatePromotion': {
    group: 'affiliate', eyebrow: 'Creator campaigns', title: 'Grow every promotion.',
    description: 'Review fight promotions, audience activity, and creator campaign performance.',
  },
  '/affiliate-guides': {
    group: 'affiliate', eyebrow: 'Creator playbook', title: 'Run a stronger fight community.',
    description: 'Guidance for leagues, promotions, payouts, profile setup, and creator operations.',
  },
  '/affiliate-league': {
    group: 'affiliate', eyebrow: 'Creator leagues', title: 'Your audience. Your standings.',
    description: 'Launch and manage a branded fight-prediction league for your community.',
  },
  '/affiliate/[affiliateName]': {
    group: 'affiliate', eyebrow: 'Creator promotion', title: 'Enter the creator fight room.',
    description: 'A dedicated promotion and prediction experience built around this creator community.', compact: true,
  },
  '/past-promotions': {
    group: 'affiliate', eyebrow: 'Campaign archive', title: 'Past creator promotions.',
    description: 'Review completed campaigns, fight cards, audience activity, and historical outcomes.',
  },
  '/HowItWorks': {
    group: 'affiliate', eyebrow: 'Affiliate program', title: 'Create. Promote. Earn.',
    description: 'Understand the full creator workflow from account approval through promotion and payout.',
  },
  '/shadow/[matchName]/[fullName]': {
    group: 'affiliate', eyebrow: 'Shadow fight', title: 'Creator prediction card.',
    description: 'A branded fight experience for this creator-led contest.', compact: true,
  },
};

const humanize = (pathname = '') => {
  const segment = pathname.split('/').filter(Boolean).pop() || 'Experience';
  return segment
    .replace(/\[|\]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveMeta = (pathname) => {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];

  if (pathname?.startsWith('/administration')) return null;
  if (pathname?.startsWith('/resetPassword')) {
    return {
      group: 'profile',
      eyebrow: 'Account recovery',
      title: 'Return to your corner.',
      description: 'Create a new password and restore secure access to your account.',
      compact: true,
    };
  }

  return {
    group: 'profile',
    eyebrow: 'Fantasy MMAdness',
    title: humanize(pathname),
    description: 'A consistent fight-night experience connected to the existing Fantasy MMAdness platform.',
    compact: true,
  };
};

export const shouldUseRouteExperienceFrame = (pathname) => {
  if (!pathname || pathname.startsWith('/administration')) return false;
  return !CORE_ROUTES.has(pathname);
};

const RouteExperienceFrame = ({ pathname, children }) => {
  const isPlayerAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isAffiliateAuthenticated = useSelector((state) => state.affiliateAuth.isAuthenticatedAffiliate);
  const meta = resolveMeta(pathname);
  if (!meta) return children;

  const background = ROUTE_BACKGROUNDS[pathname] || BACKGROUNDS[meta.group] || BACKGROUNDS.profile;
  const routeClassName = pathname.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'home';
  const accountAction = isPlayerAuthenticated
    ? { href: '/UserDashboard', label: 'Player dashboard' }
    : isAffiliateAuthenticated
      ? { href: '/AffiliateDashboard', label: 'Affiliate dashboard' }
      : { href: '/auth?mode=signup&role=player', label: 'Join free' };
  const proof = meta.group === 'affiliate'
    ? [['Creator ready', 'League and promotion tools'], ['Audience first', 'Community-led fight cards'], ['Existing flows', 'Production APIs preserved']]
    : meta.group === 'community'
      ? [['Live discussion', 'Fight-night conversation'], ['Built for fans', 'Prediction-focused topics'], ['Clear standards', 'Moderated community space']]
      : [['Fight-night UI', 'Homepage design language'], ['Responsive', 'Desktop through mobile'], ['Production connected', 'Existing workflows retained']];

  return (
    <div
      className={`route-experience-page route-experience-${meta.group} route-experience-path-${routeClassName} ${meta.compact ? 'is-compact' : ''}`}
      style={{ '--route-experience-bg': `url(${background})` }}
    >
      <section className="route-experience-hero">
        <div className="route-experience-grid" aria-hidden="true" />
        <div className="theme-container route-experience-hero-inner">
          <div className="route-experience-copy">
            <nav className="route-experience-breadcrumb" aria-label="Breadcrumb">
              <Link href="/home"><FaHome aria-hidden="true" /> Home</Link>
              <FaChevronRight aria-hidden="true" />
              <span>{humanize(pathname)}</span>
            </nav>
            <p className="route-experience-eyebrow"><FaBolt aria-hidden="true" /> {meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            <p className="route-experience-description">{meta.description}</p>
            <div className="route-experience-actions">
              <Link href="/upcomingfights" className="theme-btn theme-btn-primary">Explore fights <FaArrowRight aria-hidden="true" /></Link>
              <Link href={accountAction.href} className="theme-btn theme-btn-secondary">{accountAction.label}</Link>
            </div>
          </div>

          <aside className="route-experience-proof" aria-label="Experience highlights">
            <div className="route-experience-proof-header">
              <FaLayerGroup aria-hidden="true" />
              <span>Experience standard</span>
            </div>
            {proof.map(([title, copy], index) => (
              <div className="route-experience-proof-row" key={title}>
                <span className="route-experience-proof-index">0{index + 1}</span>
                <div><strong>{title}</strong><small>{copy}</small></div>
                {index === 0 ? <FaTrophy aria-hidden="true" /> : <FaShieldAlt aria-hidden="true" />}
              </div>
            ))}
          </aside>
        </div>
      </section>
      <section className="route-experience-content">{children}</section>
    </div>
  );
};

export default RouteExperienceFrame;
