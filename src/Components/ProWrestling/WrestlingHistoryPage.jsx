import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaArrowRight, FaBell, FaBolt, FaCoins, FaHistory, FaLock, FaMedal, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { WrestlingEmptyState, WrestlingHero, WrestlingModeNav, WrestlingStatusBadge } from './WrestlingPrimitives';
import { formatTokenAmount, formatWrestlingDate, getWrestlerImage, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingHistoryPage = () => {
  const router = useRouter();
  const authenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const [history, setHistory] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('entries');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    let active = true;
    Promise.all([
      wrestlingRequest('/api/users/me/wrestling-history?limit=100', { auth: true }),
      wrestlingRequest('/api/users/me/wrestling-wallet-ledger?limit=100', { auth: true }),
      wrestlingRequest('/api/users/me/wrestling-notifications?limit=50', { auth: true }),
    ]).then(([historyPayload, ledgerPayload, notificationPayload]) => {
      if (!active) return;
      setHistory(safeWrestlingArray(historyPayload?.data));
      setLedger(safeWrestlingArray(ledgerPayload?.data));
      setNotifications(safeWrestlingArray(notificationPayload));
    }).catch((requestError) => { if (active) setError(requestError.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authenticated]);
  const metrics = useMemo(() => ({ entries: history.length, settled: history.filter((item) => item.match?.status === 'FINALIZED').length, live: history.filter((item) => ['LIVE', 'SCORING'].includes(item.match?.status)).length, winnings: ledger.filter((item) => item.type === 'WRESTLING_WINNING').reduce((sum, item) => sum + Number(item.amount || 0), 0) }), [history, ledger]);
  const markNotificationRead = async (notice) => {
    if (!notice?._id || notice.read) return;
    try {
      const updated = await wrestlingRequest(`/api/users/me/wrestling-notifications/${notice._id}/read`, { auth: true, method: 'PATCH' });
      setNotifications((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (requestError) {
      console.error('Unable to mark wrestling notification as read:', requestError);
    }
  };
  if (!authenticated) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaShieldAlt /><h1>Player login required</h1><p>Sign in to review wrestling entries, predictions, payouts, refunds, and notifications.</p><Link href={`/auth?mode=login&role=player&next=${encodeURIComponent(router.asPath)}`} className="pw-btn pw-btn-primary">Player login <FaArrowRight /></Link></div></div>;
  return <><Head><title>My Pro Wrestling | Fantasy MMADNESS</title></Head><div className="pw-page pw-history-page">
    <WrestlingHero compact eyebrow="Player wrestling command center" title="Your entries." accent="Your wrestling record." description="Track open predictions, live standings, completed scorecards, payouts, refunds, and game-mode notifications in one place." actions={[{ href: '/pro-wrestling', label: 'Enter another contest', icon: FaBolt }]} stats={[{ value: metrics.entries, label: 'Total entries', icon: FaHistory }, { value: metrics.settled, label: 'Finalized cards', icon: FaTrophy }, { value: formatTokenAmount(metrics.winnings), label: 'Tokens won', icon: FaCoins }]} background="/images/pro-wrestling/leaderboard-celebration.jpg" />
    <WrestlingModeNav active="history" />
    <main className="theme-container pw-main">
      <section className="pw-history-tabs"><button type="button" className={tab === 'entries' ? 'is-active' : ''} onClick={() => setTab('entries')}><FaHistory /> Entries</button><button type="button" className={tab === 'wallet' ? 'is-active' : ''} onClick={() => setTab('wallet')}><FaCoins /> Wallet ledger</button><button type="button" className={tab === 'notifications' ? 'is-active' : ''} onClick={() => setTab('notifications')}><FaBell /> Notifications</button></section>
      {loading ? <div className="pw-loading-grid"><div /><div /><div /></div> : error ? <WrestlingEmptyState title="Wrestling history unavailable" description={error} /> : tab === 'entries' ? (
        history.length ? <div className="pw-history-entry-list">{history.map(({ entry, match, prediction }) => {
          const actionHref = ['LIVE', 'SCORING'].includes(match.status) ? `/pro-wrestling/live/${match._id}` : match.status === 'FINALIZED' ? `/pro-wrestling/leaderboard/${match._id}` : entry.status === 'JOINED' || entry.status === 'PREDICTION_SUBMITTED' ? `/pro-wrestling/play/${match._id}` : `/pro-wrestling/matches/${match._id}`;
          return <article key={entry._id}><div className="pw-history-art"><img src={getWrestlerImage(match.competitorA, 'A')} alt="" /><span>VS</span><img src={getWrestlerImage(match.competitorB, 'B')} alt="" /></div><div><p>{match.eventName}</p><h2>{match.matchTitle}</h2><span>{formatWrestlingDate(match.matchDate)} · Entry {entry.entryFeeTokens} tokens</span><div><WrestlingStatusBadge status={match.status} /><em>{prediction?.predictionStatus || 'No prediction submitted'}</em>{prediction?.rank && <em>Rank #{prediction.rank}</em>}{prediction?.score !== undefined && <em>{Number(prediction.score || 0).toLocaleString()} pts</em>}</div></div><Link href={actionHref}>{match.status === 'FINALIZED' ? 'View result' : ['LIVE', 'SCORING'].includes(match.status) ? 'Open live scoring' : 'Open scorecard'} <FaArrowRight /></Link></article>;
        })}</div> : <WrestlingEmptyState title="No wrestling entries yet" description="Enter an open contest to begin building your Pro Wrestling history." action={{ href: '/pro-wrestling', label: 'Browse wrestling contests' }} />
      ) : tab === 'wallet' ? (
        ledger.length ? <div className="pw-wallet-ledger"><header><span>Transaction</span><span>Amount</span><span>Balance</span><span>Date</span></header>{ledger.map((item) => <article key={item._id}><span><FaCoins /><b>{String(item.type || '').replaceAll('_', ' ')}</b></span><strong className={Number(item.amount) >= 0 ? 'is-credit' : 'is-debit'}>{Number(item.amount) >= 0 ? '+' : ''}{item.amount}</strong><span>{item.balanceAfter ?? '—'}</span><time>{formatWrestlingDate(item.createdAt)}</time></article>)}</div> : <WrestlingEmptyState title="No wrestling wallet transactions" />
      ) : notifications.length ? <div className="pw-notification-list">{notifications.map((notice) => <article key={notice._id} className={notice.read ? '' : 'is-unread'} onClick={() => markNotificationRead(notice)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') markNotificationRead(notice); }} role={notice.read ? undefined : 'button'} tabIndex={notice.read ? undefined : 0}><FaBell /><div><small>{String(notice.type || '').replaceAll('_', ' ')}</small><h3>{notice.title}</h3><p>{notice.message}</p><time>{formatWrestlingDate(notice.createdAt)}{!notice.read ? ' · Click to mark read' : ''}</time></div></article>)}</div> : <WrestlingEmptyState title="No wrestling notifications" />}
    </main>
  </div></>;
};
export default WrestlingHistoryPage;
