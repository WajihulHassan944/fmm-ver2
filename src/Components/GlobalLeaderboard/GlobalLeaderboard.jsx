import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { FaBolt, FaChartLine, FaCrown, FaMedal, FaSearch, FaTrophy, FaUsers } from 'react-icons/fa';
import useLeaderboardData from '@/CustomFunctions/useLeaderboardData';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const getPlayerName = (player) => player?.playerName || player?.username || [player?.firstName, player?.lastName].filter(Boolean).join(' ') || player?.email?.split?.('@')?.[0] || 'Player';
const getPlayerId = (player) => player?._id || player?.id || player?.email || getPlayerName(player);
const FALLBACK_AVATARS = [
  `${FMM_ASSET_BASE}/fighter-jadden-addison.webp`,
  `${FMM_ASSET_BASE}/fighter-zaveer-davis.webp`,
  `${FMM_ASSET_BASE}/fighter-conor-benn.webp`,
  `${FMM_ASSET_BASE}/fighter-chris-eubank-jr.webp`,
  `${FMM_ASSET_BASE}/fighter-anthony-yarde.webp`,
  `${FMM_ASSET_BASE}/fighter-david-benavidez.webp`,
];

const GlobalLeaderboard = () => {
  const matches = useSelector((state) => state.matches.data);
  const currentUser = useSelector((state) => state.user);
  const { leaderboard, playerCount } = useLeaderboardData(matches);
  const [search, setSearch] = useState('');


  const rows = useMemo(() => (Array.isArray(leaderboard) ? leaderboard : []).map((player, index) => ({
    ...player,
    rank: index + 1,
    displayName: getPlayerName(player),
    avatar: player?.profileUrl || FALLBACK_AVATARS[index % FALLBACK_AVATARS.length],
    points: Number(player?.totalPoints || 0),
  })), [leaderboard]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((player) => `${player.displayName} ${player.email || ''}`.toLowerCase().includes(needle));
  }, [rows, search]);

  const podium = rows.slice(0, 3);
  const currentRank = rows.find((player) => String(getPlayerId(player)) === String(currentUser?._id || currentUser?.id))?.rank;
  const leadingScore = rows[0]?.points || 0;

  return (
    <>
      <Head>
        <title>Global Leaderboard | Fantasy MMAdness</title>
        <meta name="description" content="See the leading Fantasy MMAdness combat sports predictors, total points, rankings, and your current position." />
      </Head>
      <div className="experience-page leaderboard-experience-page">
        <ExperienceHero
          eyebrow="Global combat rankings"
          title="The table never lies."
          accent="Earn your place."
          description="Every scored round changes the order. Follow the community’s sharpest combat-sports predictors and turn accurate picks into a permanent place on the board."
          backgroundImage={`${FMM_ASSET_BASE}/fighter-action-blue.webp`}
          actions={[
            { href: '/upcomingfights', label: 'Enter an active fight' },
            { href: '/guides', label: 'Review scoring', variant: 'secondary' },
          ]}
          stats={[
            { value: playerCount || rows.length, label: 'Ranked players', icon: FaUsers },
            { value: leadingScore.toLocaleString(), label: 'Leading points', icon: FaTrophy },
            { value: currentRank ? `#${currentRank}` : '—', label: 'Your rank', icon: FaChartLine },
          ]}
        >
          <div className="xp-podium-card">
            <div className="xp-podium-header"><FaCrown /> All-time leaders <span>Live standings</span></div>
            <div className="xp-podium">
              {[podium[1], podium[0], podium[2]].map((player, visualIndex) => {
                if (!player) return <div className="xp-podium-slot is-empty" key={`empty-${visualIndex}`} />;
                const placement = visualIndex === 0 ? 2 : visualIndex === 1 ? 1 : 3;
                return (
                  <div className={`xp-podium-slot is-place-${placement}`} key={getPlayerId(player)}>
                    <span className="xp-podium-rank">#{placement}</span>
                    <div className="xp-podium-avatar"><img src={player.avatar} alt={player.displayName} /></div>
                    {placement === 1 && <FaCrown className="xp-podium-crown" />}
                    <strong>{player.displayName}</strong>
                    <small>{player.points.toLocaleString()} pts</small>
                    <i />
                  </div>
                );
              })}
            </div>
          </div>
        </ExperienceHero>

        <main className="xp-page-main">
          <div className="theme-container">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Official standings"
                title="Global leaderboard"
                description="All verified Fantasy MMAdness points across scored fight cards. Rankings update as fight results are processed."
              />

              <div className="xp-leaderboard-shell">
                <div className="xp-leaderboard-toolbar">
                  <div className="xp-leaderboard-context"><FaBolt /><span><strong>All-time standings</strong><small>Scored fights only</small></span></div>
                  <label className="xp-search-field">
                    <FaSearch aria-hidden="true" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player..." />
                  </label>
                </div>

                <div className="xp-leaderboard-table" role="table" aria-label="Global leaderboard">
                  <div className="xp-leaderboard-table-head" role="row">
                    <span>Rank</span><span>Player</span><span>Fight points</span><span>Status</span>
                  </div>
                  {filteredRows.map((player, index) => {
                    const isCurrent = String(getPlayerId(player)) === String(currentUser?._id || currentUser?.id);
                    const rankIcon = player.rank === 1 ? <FaCrown /> : player.rank <= 3 ? <FaMedal /> : null;
                    return (
                      <div className={`xp-leaderboard-table-row ${isCurrent ? 'is-current' : ''}`} role="row" key={getPlayerId(player)}>
                        <div className="xp-rank-cell">{rankIcon}<strong>{player.rank}</strong></div>
                        <div className="xp-player-cell">
                          <img src={player.avatar || FALLBACK_AVATARS[index % FALLBACK_AVATARS.length]} alt={player.displayName} loading="lazy" />
                          <span><strong>{player.displayName}</strong><small>{isCurrent ? 'You' : player.rank <= 3 ? 'Title contender' : 'Fantasy contender'}</small></span>
                        </div>
                        <div className="xp-points-cell"><strong>{player.points.toLocaleString()}</strong><small>points</small></div>
                        <div className="xp-status-cell"><i /> {player.rank <= 10 ? 'Top 10' : 'Ranked'}</div>
                      </div>
                    );
                  })}
                </div>

                {filteredRows.length === 0 && (
                  <ExperienceEmptyState
                    title={rows.length ? 'No player matches that search' : 'Standings are being calculated'}
                    description={rows.length ? 'Try another player name.' : 'The table will populate after completed fights have verified scores.'}
                  />
                )}
              </div>
            </section>

            <section className="xp-rank-cta">
              <div className="xp-rank-cta-art"><img src={`${FMM_ASSET_BASE}/fighter-duel-panel.webp`} alt="Fantasy combat arena" /></div>
              <div>
                <p className="xp-eyebrow">Your next score starts now</p>
                <h2>Great picks are remembered. Perfect rounds are ranked.</h2>
                <p>Open an upcoming card, submit before the lock, and follow your position as the fight unfolds.</p>
                <Link className="theme-btn theme-btn-primary" href="/upcomingfights">Find your next fight</Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default GlobalLeaderboard;
