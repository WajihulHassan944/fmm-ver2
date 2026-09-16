import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { FaArrowRight, FaBell, FaCoins, FaCrown, FaFistRaised, FaGift, FaHistory, FaIdBadge, FaMobileAlt, FaShareAlt, FaShieldAlt, FaTrophy, FaUserCog, FaUsers } from 'react-icons/fa';
import UserWorkspaceNav from './UserWorkspaceNav';

const tools = [
  ['/fights', 'Play', 'Enter a fight', 'Browse playable cards and submit predictions before they lock.', FaFistRaised, 'red'],
  ['/YourFights', 'Track', 'My fights', 'Review active entries, predictions, results and fight history.', FaHistory, 'blue'],
  ['/global-leaderboard', 'Compete', 'Leaderboards', 'See global rankings, fight standings and your position.', FaTrophy, 'gold'],
  ['/FantasyLeagues', 'Community', 'Find a league', 'Discover affiliate communities and compete together.', FaUsers, 'blue'],
  ['/myLeagueRecords', 'Records', 'My leagues', 'Open joined leagues, community records and activity.', FaShieldAlt, 'red'],
  ['/pro-wrestling', 'Game mode', 'Pro Wrestling', 'Enter the wrestling lobby and follow wrestling standings.', FaCrown, 'gold'],
  ['/checkout', 'Wallet', 'Fight wallet', 'Review your balance, purchase tokens and manage entry access.', FaCoins, 'gold'],
  ['/fights-rewards', 'Rewards', 'Rewards center', 'Open rewards, streaks and promotional opportunities.', FaGift, 'red'],
  ['/profile', 'Identity', 'Player profile', 'Update your fight identity, image and referral link.', FaIdBadge, 'blue'],
  ['/account-settings', 'Manage', 'Account settings', 'Control notifications, security and payment details.', FaUserCog, 'red'],
  ['/referral-leaderboard', 'Invite', 'Referral rewards', 'Invite players and track referral competition.', FaShareAlt, 'blue'],
  ['/home', 'Application', 'Open the full app', 'Launch the immersive phone-style fight application.', FaMobileAlt, 'gold'],
];

export default function PlayerFightCenter() {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (!user) return (
    <div className="player-fight-center-auth"><FaShieldAlt /><h1>{loading ? 'Preparing your Fight Center…' : 'Player sign-in required'}</h1>
      {!loading && <Link href="/auth?mode=login&role=player&next=/UserDashboard">Sign in as a player <FaArrowRight /></Link>}
    </div>
  );

  const name = user.playerName || user.firstName || 'Player';
  const avatar = user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg';
  const fightCount = Array.isArray(user.fights) ? user.fights.length : Number(user.totalFights || 0);
  const leagueCount = Array.isArray(user.leagues) ? user.leagues.length : Number(user.totalLeagues || 0);

  return <><Head><title>Player Fight Center | FANTASY MMADNESS</title></Head><div className="player-fight-center-page">
    <section className="player-fight-center-hero"><div className="theme-container player-fight-center-hero-grid">
      <div className="player-fight-center-intro"><p><FaFistRaised /> Player command center</p><h1>Your fights. <span>Your predictions.</span> Your climb.</h1>
        <p>Welcome back, {name}. Everything your player account can do is organized here—play, score, compete, earn rewards and manage your fight identity.</p>
        <div><Link href="/fights">Enter a fight <FaArrowRight /></Link><Link href="/home">Open full app <FaMobileAlt /></Link></div>
      </div>
      <aside className="player-fight-center-card"><img src={avatar} alt={name} /><div><small>Player profile</small><strong>{name}</strong><span>{user.currentPlan || 'Active'} membership</span></div><Link href="/profile">Edit profile <FaArrowRight /></Link></aside>
    </div></section>
    <UserWorkspaceNav />
    <main className="theme-container player-fight-center-main">
      <section className="player-fight-center-stats" aria-label="Player account summary">
        <article><FaCoins /><span><strong>{Number(user.tokens || 0).toLocaleString()}</strong><small>Wallet tokens</small></span></article>
        <article><FaFistRaised /><span><strong>{fightCount}</strong><small>Fight entries</small></span></article>
        <article><FaTrophy /><span><strong>{Number(user.totalPoints || user.points || 0).toLocaleString()}</strong><small>Total points</small></span></article>
        <article><FaUsers /><span><strong>{leagueCount}</strong><small>Joined leagues</small></span></article>
      </section>
      <section className="player-fight-center-suite"><header><div><p><FaBell /> Player experience</p><h2>Everything in one Fight Center.</h2><span>No dead ends. Every card opens a working player route or the full application.</span></div><em><i /> Account connected</em></header>
        <div className="player-fight-center-tools">{tools.map(([href,group,title,copy,Icon,tone]) => <Link href={href} className={`is-${tone}`} key={href}><Icon /><span><small>{group}</small><strong>{title}</strong><em>{copy}</em></span><FaArrowRight /></Link>)}</div>
      </section>
    </main>
  </div></>;
}
