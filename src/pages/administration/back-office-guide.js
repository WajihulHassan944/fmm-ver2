import React from 'react';
import Link from 'next/link';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';

// Plain-language guide to the major administrator tools. Static content only.
const GUIDE = [
  { group: 'Fights', tools: [
    ['Create fight', '/administration/AddNewMatch', 'Builds a new fight card and its prediction setup.', 'When a new fight is confirmed and ready to open for entries.'],
    ['Fight calendar and upcoming fights', '/administration/upcomingFights', 'Lists fights and lets you submit final scores.', 'After a fight ends, to enter the result and settle the contest.'],
    ['Shadow fights', '/administration/ShadowFightsLibrary', 'The library of approved fight templates affiliates can promote.', 'To review or add templates that affiliates choose from.'],
    ['Affiliate fights', '/administration/AffiliateMatches', 'Fights promoted by affiliates.', 'To see what affiliates are promoting and how those cards are doing.'],
    ['Homepage posters', '/administration/homepage-content', 'Chooses which fight posters and videos appear on the homepage.', 'Before an event, to feature the main card.'],
  ]},
  { group: 'People', tools: [
    ['Registered users', '/administration/RegisteredUsers', 'All player accounts.', 'To look up a player or check an account.'],
    ['Affiliate users', '/administration/AffiliateUsers', 'All affiliates. Each row has a View (Manage Affiliate) button and a Back office link.', 'To manage an affiliate or see their private dashboard.'],
    ['Manage Affiliate', '/administration/AffiliateUsers', 'One affiliate’s account, links, QR code, promoted fights and payouts. Has two buttons: View Public Affiliate Page (what visitors see) and View Affiliate Back Office (what the affiliate sees, read only).', 'When an affiliate asks for help or you need to check their numbers.'],
  ]},
  { group: 'Money', tools: [
    ['Payment health', '/administration/payment-health', 'Checks which Authorize.Net mode is live and whether the gateway accepts the stored credentials. Makes no charge and shows no keys.', 'If customers say checkout fails, or after anyone changes payment settings.'],
    ['Payouts', '/administration/payouts', 'Affiliate payout requests.', 'To review and process affiliate payout requests.'],
    ['Revenue Command Center', '/administration/revenue', 'Fight views, prediction starts, paid entries, referrals and revenue reporting.', 'To review how the business is performing.'],
    ['Apparel orders', '/administration/apparel-orders', 'Guest orders, shipping details and fulfilment status.', 'To fulfil or look up an apparel order.'],
  ]},
  { group: 'Growth and content', tools: [
    ['Fight Launch Desk', '/administration/growth', 'Prepares fight posts, QR images and an affiliate announcement from open fights.', 'When a fight opens and you want to promote it.'],
    ['Fan acquisition', '/administration/fan-acquisition', 'Researches public fight-fan audiences and manages outreach drafts.', 'To plan outreach. Drafts need your approval.'],
    ['Swarm automation and SEO growth', '/administration/swarm', 'Generates blog, SEO and social drafts for review.', 'To prepare content. Review before publishing.'],
    ['Founder page uploads', '/administration/founder-media', 'Upload the Ring Magazine article and Founder page photographs.', 'To update Founder page media.'],
    ['Manage FAQs', '/administration/faqs', 'Support answers shown on the site.', 'To add or fix a support answer.'],
  ]},
  { group: 'Watching the platform', tools: [
    ['Notifications and action alerts', '/administration/notifications', 'Actionable problems and alerts.', 'Check daily, and before and during an event.'],
    ['Jarvis action center', '/administration/jarvis', 'System health and incident triage.', 'When something looks wrong with the platform.'],
  ]},
];

const BackOfficeGuide = () => (
  <AdminPrivateRoute>
    <main style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
      <h1>Back office tools guide</h1>
      <p>A short map of the main administrator tools. Each name opens the tool.</p>
      {GUIDE.map((section) => (
        <section key={section.group} style={{ margin: '28px 0' }}>
          <h2>{section.group}</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
            {section.tools.map(([name, href, what, when]) => (
              <li key={name} style={{ border: '1px solid #2a3340', borderRadius: 10, padding: '12px 14px' }}>
                <h3 style={{ margin: '0 0 6px' }}><Link href={href}>{name}</Link></h3>
                <p style={{ margin: '0 0 4px' }}><strong>What it does:</strong> {what}</p>
                <p style={{ margin: 0 }}><strong>Use it when:</strong> {when}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  </AdminPrivateRoute>
);

export default BackOfficeGuide;
