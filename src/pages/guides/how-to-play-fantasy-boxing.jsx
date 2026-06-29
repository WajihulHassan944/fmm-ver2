import { GuideSeoPage } from '@/Components/SEO/PremiumSeoBlocks';

const guide = {
  title: 'How To Play Fantasy Boxing Contests',
  description: 'Learn how Fantasy MMAdness presents boxing as a dedicated sport with fight pages, manual scoring context, and promotional campaign paths.',
  image: '/images/fmm-pages/player-fight-night-premium.webp',
  steps: [
    { title: 'Choose Boxing', copy: 'Open the Fantasy Boxing landing page or filtered fight cards to see boxing-specific opportunities.' },
    { title: 'Read the fight context', copy: 'Use the fight page, related blogs, and campaign content to understand the card.' },
    { title: 'Score manually where needed', copy: 'Total punches are handled as a separate field so admin scoring remains accurate.' },
    { title: 'Follow updates', copy: 'Recent boxing fights and results can be surfaced higher for fresh user attention.' },
  ],
  faqs: [
    ['Is Boxing separate from MMA?', 'Yes. The user-facing flow now supports Boxing as a distinct sport path.'],
    ['Can boxing fights get blogs and social drafts?', 'Yes. Boxing campaign packs can produce blog, SEO, social, newsletter, and homepage-feature drafts.'],
    ['Can total punches be entered manually?', 'Yes. Total punches are not automatically calculated from head and body punches.'],
  ],
};

export default function HowToPlayFantasyBoxingGuide() { return <GuideSeoPage guide={guide} />; }
