import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCoins,
  FaEdit,
  FaEye,
  FaFistRaised,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { WrestlingStatusBadge } from './WrestlingPrimitives';
import { formatTokenAmount, formatWrestlingDate, getWrestlerImage, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingAdminDashboard = () => {
  const [matches, setMatches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [wrestlers, setWrestlers] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [matchPayload, analyticsPayload, wrestlerPayload] = await Promise.all([
        wrestlingRequest('/api/admin/wrestling/matches?limit=100', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/analytics', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/wrestlers?limit=100', { admin: true }),
      ]);
      setMatches(safeWrestlingArray(matchPayload?.data || matchPayload));
      setAnalytics(analyticsPayload);
      setWrestlers(safeWrestlingArray(wrestlerPayload?.data));
    } catch (requestError) {
      setError(requestError.message || 'The Pro Wrestling command center could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return matches.filter((match) => {
      const statusMatch = status === 'ALL' || match.status === status;
      const searchMatch = !normalized || [match.matchTitle, match.eventName, match.promotionName, match.competitorA?.displayName, match.competitorB?.displayName].filter(Boolean).join(' ').toLowerCase().includes(normalized);
      return statusMatch && searchMatch;
    });
  }, [matches, query, status]);

  const deleteDraft = async (match) => {
    if (!window.confirm(`Delete draft "${match.matchTitle}"? This cannot be undone.`)) return;
    try {
      await wrestlingRequest(`/api/admin/wrestling/matches/${match._id}`, { admin: true, method: 'DELETE' });
      toast.success('Draft wrestling match deleted.');
      load();
    } catch (requestError) { toast.error(requestError.message); }
  };

  const openCount = analytics?.matchesByStatus?.OPEN || 0;
  const liveCount = (analytics?.matchesByStatus?.LIVE || 0) + (analytics?.matchesByStatus?.SCORING || 0);

  return <>
    <Head><title>Pro Wrestling Command Center | FMM Administration</title></Head>
    <div className="pw-admin-page">
      <section className="pw-admin-hero">
        <div><p><FaFistRaised /> Additional game mode</p><h1>Pro Wrestling <span>command center.</span></h1><p>Create wrestling cards, manage the roster, open predictions, enter live action totals, monitor rankings, and finalize the pot without touching the existing MMA and boxing workflows.</p><div><Link href="/administration/pro-wrestling/new" className="pw-admin-primary"><FaPlus /> Create wrestling contest</Link><Link href="/pro-wrestling" target="_blank" className="pw-admin-secondary"><FaEye /> View public game mode</Link></div></div>
        <aside><img src="/images/pro-wrestling/wrestling-match-premium.jpg" alt="Pro Wrestling arena" /><span><small>Backend mode</small><strong>PRO_WRESTLING</strong><em>Full-match predictions</em></span></aside>
      </section>

      <section className="pw-admin-metrics">
        <article><FaBolt /><span><small>Open contests</small><strong>{openCount}</strong></span></article>
        <article><FaChartLine /><span><small>Live / scoring</small><strong>{liveCount}</strong></span></article>
        <article><FaUsers /><span><small>Wrestling players</small><strong>{analytics?.uniquePlayers || 0}</strong></span></article>
        <article><FaCoins /><span><small>Gross token pot</small><strong>{formatTokenAmount(analytics?.pots?.grossPot)}</strong></span></article>
        <article><FaTrophy /><span><small>Roster profiles</small><strong>{wrestlers.length}</strong></span></article>
      </section>

      <section className="pw-admin-shortcuts">
        <Link href="/administration/pro-wrestling/new"><FaPlus /><span><strong>New contest</strong><small>Build and publish a wrestling card</small></span><FaArrowRight /></Link>
        <Link href="/administration/pro-wrestling/wrestlers"><FaUsers /><span><strong>Wrestler roster</strong><small>Create and maintain wrestler profiles</small></span><FaArrowRight /></Link>
        <Link href="/administration/pro-wrestling/rules"><FaTrophy /><span><strong>Scoring & payout rules</strong><small>Review versioned game-mode rules</small></span><FaArrowRight /></Link>
        <Link href="/administration/pro-wrestling/analytics"><FaChartLine /><span><strong>Analytics & ledger</strong><small>Entries, pots, scores, and wallet activity</small></span><FaArrowRight /></Link>
      </section>

      <section className="pw-admin-panel">
        <header><div><p>Wrestling registry</p><h2>Contest operations</h2><span>Every public and draft Pro Wrestling contest in one table.</span></div><Link href="/administration/pro-wrestling/new" className="pw-admin-primary"><FaPlus /> New contest</Link></header>
        <div className="pw-admin-toolbar"><label><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search event, wrestler, or promotion" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}>{['ALL','DRAFT','OPEN','LOCKED','LIVE','SCORING','FINALIZED','CANCELLED','NO_CONTEST'].map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All statuses' : value.replaceAll('_',' ')}</option>)}</select><button type="button" onClick={load}>Refresh</button></div>
        {error && <div className="pw-admin-error">{error}</div>}
        <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Contest</th><th>Status</th><th>Schedule</th><th>Players</th><th>Pot</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading wrestling contests…</td></tr> : visible.length ? visible.map((match) => <tr key={match._id}><td><div className="pw-admin-match-cell"><div><img src={getWrestlerImage(match.competitorA,'A')} alt="" /><img src={getWrestlerImage(match.competitorB,'B')} alt="" /></div><span><strong>{match.matchTitle}</strong><small>{match.eventName} · {match.promotionName || 'Pro Wrestling'}</small></span></div></td><td><WrestlingStatusBadge status={match.status} /></td><td><strong>{formatWrestlingDate(match.matchDate)}</strong><small>Locks {formatWrestlingDate(match.lockAt)}</small></td><td>{match.participantCount || 0}</td><td>{formatTokenAmount(match.currentPot)} tokens</td><td><div className="pw-admin-row-actions"><Link href={`/administration/pro-wrestling/${match._id}`} title="Edit contest"><FaEdit /></Link><Link href={`/administration/pro-wrestling/${match._id}/scoring`} title="Score contest"><FaBolt /></Link><Link href={`/pro-wrestling/matches/${match._id}`} target="_blank" title="View public contest"><FaEye /></Link>{match.status === 'DRAFT' && Number(match.participantCount || 0) === 0 && <button type="button" className="is-delete" onClick={() => deleteDraft(match)} title="Delete draft" aria-label={`Delete draft ${match.matchTitle}`}><FaTrash /></button>}</div></td></tr>) : <tr><td colSpan="6">No wrestling contests match the current filters.</td></tr>}</tbody></table></div>
      </section>
    </div>
  </>;
};
export default WrestlingAdminDashboard;
