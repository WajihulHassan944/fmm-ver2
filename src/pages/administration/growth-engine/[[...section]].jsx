import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';

// Production integration is OFF until the owner approves the isolated Growth Engine
// connection. The Growth Engine is a separate service, with separate sign-in, Atlas
// database, publishing/email providers, and payment boundaries.
const ENABLED = process.env.NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED === 'true';
// TEST PREVIEW ONLY: use the Growth Engine's separate owner-password protection
// instead of sending reviewers to the live-site administrator login. NEVER set
// this variable on production; production continues to require AdminPrivateRoute.
const PREVIEW_REVIEW_ONLY = process.env.NEXT_PUBLIC_FMM_GROWTH_REVIEW_ONLY === 'true';
const CONSOLE_ORIGIN = 'https://fantasymmadness-growth-isolated-tes.vercel.app';
const SECTIONS = [
  ['overview', 'Dashboard'],
  ['approvals', 'Campaign approvals'],
  ['marketing', 'Marketing & posters'],
  ['pr', 'Public relations'],
  ['affiliates', 'Affiliate recruitment'],
  ['publishing', 'Social publishing'],
  ['automation', 'Automation'],
  ['analytics', 'Analytics'],
  ['revenue', 'Revenue attribution'],
  ['connections', 'Connections'],
];
const slugs = new Set(SECTIONS.map(([slug]) => slug));

export default function IsolatedGrowthEngineAdmin() {
  const router = useRouter();
  const part = Array.isArray(router.query.section) ? router.query.section[0] : null;
  const section = slugs.has(part) ? part : 'overview';
  const consoleUrl = `${CONSOLE_ORIGIN}/api/growth/console?embed=1#/${section}`;
  const AccessBoundary = PREVIEW_REVIEW_ONLY ? React.Fragment : AdminPrivateRoute;
  return (
    <AccessBoundary>
      <Head><title>Growth Engine | FANTASY MMADNESS Administration</title></Head>
      <main style={{ padding: '24px', background: '#0d111a', color: '#f4f5f7', minHeight: '90vh' }}>
        <header style={{ maxWidth: 1500, margin: '0 auto 16px' }}>
          <p style={{ margin: '0 0 8px', color: '#b6bdcb' }}>FANTASY MMADNESS / ADMINISTRATION</p>
          <h1 style={{ fontSize: '1.6rem', margin: '0 0 8px' }}>Growth Engine</h1>
          {!ENABLED ? (
            <section role="status" style={{ background: '#202735', border: '1px solid #4e5969', borderRadius: 10, padding: 20 }}>
              <h2 style={{ marginTop: 0 }}>Integration awaiting approval</h2>
              <p>The separate Growth Engine remains in isolated staging. No live emails, social posts, payments, or production database changes are enabled.</p>
              <Link href="/administration">Return to administration</Link>
            </section>
          ) : (
            <>
              <p style={{ color: '#b6bdcb' }}>Isolated Growth Engine. Its own owner sign-in is required. Real social posting, outbound email and payments remain disabled until separately authorized.</p>
              <nav aria-label="Growth Engine sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
                {SECTIONS.map(([slug, label]) => (
                  <Link key={slug} href={slug === 'overview' ? '/administration/growth-engine' : `/administration/growth-engine/${slug}`}
                    style={{ padding: '8px 12px', color: '#fff', background: section === slug ? '#ba101f' : '#242c3a', borderRadius: 8, textDecoration: 'none' }}>
                    {label}
                  </Link>
                ))}
              </nav>
              <iframe title={`FANTASY MMADNESS Growth Engine — ${section}`} src={consoleUrl}
                style={{ width: '100%', minHeight: 'calc(100vh - 240px)', border: '1px solid #323b4b', background: '#fff', borderRadius: 12 }}
                referrerPolicy="strict-origin-when-cross-origin" />
              <p style={{ paddingTop: 12 }}><a href={consoleUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#f9bdc4' }}>Open the secure Growth Engine in a new tab</a></p>
            </>
          )}
        </header>
      </main>
    </AccessBoundary>
  );
}
