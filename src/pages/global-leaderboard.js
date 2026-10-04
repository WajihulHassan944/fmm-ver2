export async function getServerSideProps() {
  return { redirect: { destination: '/leaderboard', permanent: false } };
}

export default function LegacyLeaderboardRedirect() { return null; }
