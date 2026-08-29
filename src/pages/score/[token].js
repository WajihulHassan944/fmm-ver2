import dynamic from 'next/dynamic';
import React from 'react';
import { useRouter } from 'next/router';

// The scorer desk is deliberately outside the player app and the back office:
// a delegated scorer signs into neither. The one-time link in the URL is
// exchanged for a fight-scoped session on mount.
const ScorerDesk = dynamic(() => import('@/Components/Scorer/ScorerDesk'), {
  ssr: false,
  loading: () => <p style={{ padding: 24, color: '#fff' }}>Opening the scorecard…</p>,
});

const ScorePage = () => {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  if (!router.isReady) return <p style={{ padding: 24, color: '#fff' }}>Opening the scorecard…</p>;
  return <ScorerDesk token={token} />;
};

export default ScorePage;
