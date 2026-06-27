import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { FaFistRaised, FaShieldAlt } from 'react-icons/fa';

const ROUTE_COPY = {
  '/administration': {
    eyebrow: 'Command center',
    title: 'Operations dashboard',
    description: 'Monitor platform activity, fight operations, players, editorial content, payouts, and admin tools from one premium control room.',
  },
  '/administration/AddNewMatch': {
    eyebrow: 'Fight operations',
    title: 'Create match',
    description: 'Build live and shadow fight cards while keeping the existing addMatch and addShadow backend contracts intact.',
  },
  '/administration/upcomingFights': {
    eyebrow: 'Score operations',
    title: 'Submit & view scores',
    description: 'Manage upcoming cards, score submissions, and live fight administration using the original score workflows.',
  },
  '/administration/RegisteredUsers': {
    eyebrow: 'People',
    title: 'Registered users',
    description: 'Review player accounts, wallet activity, and user data in the redesigned admin workspace.',
  },
  '/administration/AffiliateUsers': {
    eyebrow: 'People',
    title: 'Affiliate users',
    description: 'Manage creator and affiliate records without changing any affiliate API behavior.',
  },
  '/administration/PreviousMatches': {
    eyebrow: 'Archive',
    title: 'Previous matches',
    description: 'Review existing match history and historical fight records inside the refreshed admin surface.',
  },
  '/administration/DeleteUpdateMatches': {
    eyebrow: 'Fight operations',
    title: 'Delete / update matches',
    description: 'Edit, remove, and maintain fight cards using the same production endpoints as before.',
  },
  '/administration/Calendar': {
    eyebrow: 'Schedule',
    title: 'Match calendar',
    description: 'View fight scheduling and calendar operations in a premium command-center layout.',
  },
  '/administration/adminRecords': {
    eyebrow: 'Records',
    title: 'Fight records',
    description: 'Audit official records, stats, and admin-maintained historical data.',
  },
  '/administration/payouts': {
    eyebrow: 'Finance',
    title: 'Affiliate payouts',
    description: 'Track payout operations and affiliate finance workflows without altering requests or payloads.',
  },
  '/administration/sponsors': {
    eyebrow: 'Partners',
    title: 'Sponsors',
    description: 'Manage sponsor records and visual partner assets in the redesigned admin workspace.',
  },
  '/administration/blogs': {
    eyebrow: 'Editorial',
    title: 'Blogs',
    description: 'Create, inspect, and manage article content while preserving the existing blog API flow.',
  },
  '/administration/news': {
    eyebrow: 'Editorial',
    title: 'News',
    description: 'Maintain public news content in the refreshed editorial operations area.',
  },
  '/administration/faqs': {
    eyebrow: 'Support',
    title: 'FAQs',
    description: 'Manage frequently asked questions for players, affiliates, sponsors, and fight operations.',
  },
  '/administration/Email': {
    eyebrow: 'Messaging',
    title: 'Email templates',
    description: 'Maintain platform communication templates without changing the original email module behavior.',
  },
  '/administration/Community': {
    eyebrow: 'Community',
    title: 'Forum moderation',
    description: 'Moderate community content and forum activity from the command center.',
  },
  '/administration/notifications': {
    eyebrow: 'Messaging',
    title: 'Notifications',
    description: 'Review and publish notification content through the existing admin notification flow.',
  },
  '/administration/swarm': {
    eyebrow: 'Automation',
    title: 'Swarm command center',
    description: 'Submit MMA and pro-wrestling automation jobs, review generated artifacts, and publish approved blog drafts through the backend gateway.',
  },
  '/administration/BlogsAiBot': {
    eyebrow: 'Automation',
    title: 'Blog AI bot',
    description: 'Generate editorial support content in the refreshed automation workspace.',
  },
  '/administration/SocialAiBot': {
    eyebrow: 'Automation',
    title: 'Social AI bot',
    description: 'Create social content assets while keeping the current tool behavior intact.',
  },
  '/administration/MakePost': {
    eyebrow: 'Publishing',
    title: 'Make AI post',
    description: 'Compose and prepare social posts in the redesigned publishing surface.',
  },
  '/administration/YoutubeArchive': {
    eyebrow: 'Video',
    title: 'YouTube archive',
    description: 'Maintain video archive records and media entries in a premium admin layout.',
  },
};

const fallbackFromPath = (pathname) => {
  const segment = String(pathname || '/administration')
    .replace('/administration/', '')
    .replace('/administration', 'Command center')
    .split('/')[0]
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');

  const title = segment
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Command center';

  return {
    eyebrow: 'Administration',
    title,
    description: 'This administration module keeps its original data flow and API behavior, with a refreshed Fantasy MMAdness command-center presentation.',
  };
};

const AdminRouteFrame = ({ children, pathname }) => {
  const router = useRouter();
  const activePath = pathname || router.pathname || '/administration';
  const copy = useMemo(() => ROUTE_COPY[activePath] || fallbackFromPath(activePath), [activePath]);

  return (
    <div className="admin-route-frame">
      <section className="admin-route-hero" aria-label="Administration page overview">
        <div>
          <p className="admin-page-eyebrow"><FaShieldAlt /> {copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="admin-route-hero-art" aria-hidden="true">
          <span><FaFistRaised /> FMM</span>
          <strong>COMMAND</strong>
          <small>Fight-night operations</small>
        </div>
      </section>


      <div className="admin-route-content">
        {children}
      </div>
    </div>
  );
};

export default AdminRouteFrame;
