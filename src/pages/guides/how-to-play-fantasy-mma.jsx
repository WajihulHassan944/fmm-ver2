import { GuideSeoPage } from '@/Components/SEO/PremiumSeoBlocks';

const guide = {
  title: 'How To Play Fantasy MMA On Fantasy MMAdness',
  description: 'A search-friendly guide explaining how users join MMA fight opportunities, submit picks, follow results, and return for fresh cards.',
  image: '/images/fmm-pages/league-arena-hd.webp',
  steps: [
    { title: 'Find an active fight', copy: 'Start from upcoming fights, the homepage, or dashboard opportunities and choose the card you want to play.' },
    { title: 'Review the matchup', copy: 'Use fight details, related blogs, and scoring context before submitting predictions.' },
    { title: 'Submit picks', copy: 'Enter predictions before the fight locks, then follow results and leaderboard movement.' },
    { title: 'Return for fresh cards', copy: 'New, live, tonight, and recently updated fights are prioritized so the site keeps feeling current.' },
  ],
  faqs: [
    ['Do I need to know every fighter?', 'No. Fight detail pages, blogs, and guides help users understand the matchup before making picks.'],
    ['Where do I find active fights?', 'Use the homepage, upcoming fights page, fight calendar, or user dashboard opportunities.'],
    ['Can the site promote new fights?', 'Yes. Admin-side automation can create campaign drafts, SEO plans, and social drafts around fresh fights.'],
  ],
};

export default function HowToPlayFantasyMmaGuide() { return <GuideSeoPage guide={guide} />; }
