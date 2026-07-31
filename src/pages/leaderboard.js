import React from 'react';
import GlobalLeaderboard from '@/Components/GlobalLeaderboard/GlobalLeaderboard';
import { fetchPublicLeaderboard } from '@/Utils/publicApi';

export default function LeaderboardPage({ initialLeaderboardData = null }) {
  return <GlobalLeaderboard initialLeaderboardData={initialLeaderboardData} />;
}

export async function getServerSideProps() {
  try {
    const payload = await fetchPublicLeaderboard({ limit: 100 });
    return { props: { initialLeaderboardData: JSON.parse(JSON.stringify(payload || null)) } };
  } catch (error) {
    console.error('Leaderboard SSR fetch failed:', error);
    return { props: { initialLeaderboardData: null } };
  }
}
