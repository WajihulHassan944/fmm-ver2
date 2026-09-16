import dynamic from 'next/dynamic';

const PlayerFightCenter = dynamic(
  () => import('@/Components/UserProfile/PlayerFightCenter'),
  { loading: () => <div className="player-fight-center-loading">Preparing your Fight Center…</div> },
);

export default function UserDashboard() {
  return <PlayerFightCenter />;
}
