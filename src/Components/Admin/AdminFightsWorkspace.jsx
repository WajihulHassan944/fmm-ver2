import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaChartBar,
  FaEdit,
  FaEye,
  FaFistRaised,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrophy,
  FaTrashAlt,
  FaVideo,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import AdminPredictions from './AdminPredictions';
import ShowScores from './ShowScores';
import MatchDetailsPromotion from './MatchDetailsPromotion';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.jpg';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.jpg';

const getId = (fight) => fight?._id || fight?.id;
const getSport = (fight) => fight?.matchCategoryTwo || fight?.matchCategory || 'combat';
const getTitle = (fight) => fight?.matchName || `${fight?.matchFighterA || 'Fighter A'} vs ${fight?.matchFighterB || 'Fighter B'}`;
const formatDate = (fight) => fight?.matchDate?.split?.('T')?.[0] || 'Date pending';
const formatTime = (fight) => fight?.matchTime || 'Time pending';

const TAB_COPY = [
  { key: 'all', label: 'All fights' },
  { key: 'ongoing', label: 'Active scoring' },
  { key: 'finished', label: 'Completed' },
  { key: 'live', label: 'Promote live' },
  { key: 'shadow', label: 'Shadow templates' },
];

const normalizeRows = (matches, shadowTemplates) => [
  ...(Array.isArray(matches) ? matches.map((fight) => ({ ...fight, __source: 'normal' })) : []),
  ...(Array.isArray(shadowTemplates) ? shadowTemplates.map((fight) => ({ ...fight, __source: 'shadowTemplate', matchType: fight.matchType || 'SHADOW' })) : []),
];

export default function AdminFightsWorkspace({ initialTab = 'all', mode = 'registry' }) {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [shadowTemplates, setShadowTemplates] = useState([]);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedScoresView, setSelectedScoresView] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ includeDrafts: true }));
  }, [dispatch, matchStatus]);

  const loadShadowTemplates = async () => {
    setShadowLoading(true);
    try {
      const response = await fetch(`${API_BASE}/shadow`);
      const data = await response.json();
      setShadowTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shadow templates:', error);
    } finally {
      setShadowLoading(false);
    }
  };

  useEffect(() => { loadShadowTemplates(); }, []);

  const allRows = useMemo(() => normalizeRows(matches, shadowTemplates), [matches, shadowTemplates]);
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allRows.filter((fight) => {
      const status = String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase();
      const type = String(fight.matchType || '').toLowerCase();
      const source = fight.__source;
      const tabMatch = activeTab === 'all'
        || (activeTab === 'ongoing' && status === 'ongoing')
        || (activeTab === 'finished' && status === 'finished')
        || (activeTab === 'live' && type === 'live')
        || (activeTab === 'shadow' && source === 'shadowTemplate');
      if (!tabMatch) return false;
      if (!normalizedSearch) return true;
      return [fight.matchName, fight.matchFighterA, fight.matchFighterB, getSport(fight), fight.matchDescription]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeTab, allRows, search]);

  const metrics = useMemo(() => ({
    total: allRows.length,
    active: allRows.filter((fight) => String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase() === 'ongoing').length,
    finished: allRows.filter((fight) => String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase() === 'finished').length,
    shadows: allRows.filter((fight) => fight.__source === 'shadowTemplate').length,
  }), [allRows]);

  const openScoring = (fight) => setSelectedScore({ id: getId(fight), filter: fight.__source === 'shadowTemplate' ? 'shadowTemplate' : 'normal' });
  const openScores = (fight) => setSelectedScoresView({ id: getId(fight), filter: fight.__source === 'shadowTemplate' ? 'shadowTemplate' : 'normal' });
  const openPromotion = (fight) => setSelectedPromotion(fight);

  const deleteFight = async (fight) => {
    const id = getId(fight);
    if (!id) return;
    const title = getTitle(fight);
    const isShadowTemplate = fight.__source === 'shadowTemplate';
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    const endpoint = isShadowTemplate
      ? `${API_BASE}/shadowfighttodelete/${id}`
      : `${API_BASE}/api/matches/${id}?updateWallet=false`;

    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete fight');
      toast.success(isShadowTemplate ? 'Shadow fight deleted.' : 'Fight deleted.');
      dispatch(fetchMatches({ includeDrafts: true }));
      loadShadowTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to delete fight.');
    }
  };

  if (selectedScore?.id) {
    return (
      <div className="admin-workspace admin-score-workspace-shell">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Official scoring</span><h2>Submit fight scores</h2><p>All original score buttons, round controls, finish fight action, video URL submission, and endpoints are still active.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedScore(null)}>Back to fight registry</button>
        </section>
        <AdminPredictions matchId={selectedScore.id} filter={selectedScore.filter} />
      </div>
    );
  }

  if (selectedScoresView?.id) {
    return (
      <div className="admin-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Results archive</span><h2>View submitted scores</h2><p>Review the original score output for this fight.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedScoresView(null)}>Back to fight registry</button>
        </section>
        <ShowScores matchId={selectedScoresView.id} filter={selectedScoresView.filter} />
      </div>
    );
  }

  if (selectedPromotion) {
    return (
      <div className="admin-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Promotion builder</span><h2>{getTitle(selectedPromotion)}</h2><p>Promote this live fight through the existing promotional module.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedPromotion(null)}>Back to fight registry</button>
        </section>
        <MatchDetailsPromotion matchId={getId(selectedPromotion)} />
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-fights-workspace">
      <section className="admin-page-heading">
        <div>
          <span>Fight operations</span>
          <h2>{mode === 'score' ? 'Score center and fight tables' : 'Unified fight registry'}</h2>
          <p>Search, filter, promote, inspect, score, and view completed fights from one source-style administration table while preserving the existing match and shadow APIs.</p>
        </div>
        <div className="admin-heading-actions">
          <Link href="/administration/AddNewMatch" className="admin-primary-action"><FaPlus /> Create fight</Link>
          <button type="button" className="admin-action-secondary" onClick={() => { dispatch(fetchMatches({ includeDrafts: true })); loadShadowTemplates(); }}><FaSyncAlt className={matchStatus === 'loading' || shadowLoading ? 'xp-spin' : ''} /> Refresh</button>
        </div>
      </section>

      <section className="admin-inline-metrics">
        <article><span>Total loaded</span><strong>{metrics.total}</strong><small>Live + shadow records</small></article>
        <article><span>Active scoring</span><strong>{metrics.active}</strong><small>Open result workflows</small></article>
        <article><span>Completed</span><strong>{metrics.finished}</strong><small>Score review available</small></article>
        <article><span>Shadow templates</span><strong>{metrics.shadows}</strong><small>Affiliate-ready cards</small></article>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar admin-fight-toolbar">
          <label className="admin-table-search"><FaSearch /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fight, fighter, description, or sport" /></label>
          <div className="admin-filter-tabs">
            {TAB_COPY.map((tab) => <button key={tab.key} type="button" className={`admin-filter-tab ${activeTab === tab.key ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
          </div>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table admin-fights-table">
            <thead>
              <tr><th>Fight</th><th>Sport</th><th>Schedule</th><th>Status</th><th>Entry</th><th>Prize</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredRows.length ? filteredRows.map((fight, index) => {
                const id = getId(fight);
                const status = fight.matchStatus || fight.matchShadowStatus || (fight.__source === 'shadowTemplate' ? 'Template' : 'Draft');
                const isFinished = String(status).toLowerCase() === 'finished';
                const isLive = String(fight.matchType || '').toUpperCase() === 'LIVE';
                return (
                  <tr key={`${fight.__source}-${id || index}`}>
                    <td>
                      <div className="admin-fight-cell">
                        <span><img src={fight.fighterAImage || FALLBACK_A} alt="" /><img src={fight.fighterBImage || FALLBACK_B} alt="" /></span>
                        <div><strong>{getTitle(fight)}</strong><small>{fight.matchFighterA || 'Fighter A'} vs {fight.matchFighterB || 'Fighter B'}</small></div>
                      </div>
                    </td>
                    <td>{getSport(fight)}</td>
                    <td><span className="admin-cell-stack"><strong>{fight.__source === 'shadowTemplate' ? 'Reusable template' : formatDate(fight)}</strong><small>{fight.__source === 'shadowTemplate' ? 'No lock time' : formatTime(fight)}</small></span></td>
                    <td><span className={`admin-status-badge ${isFinished ? 'is-success' : status === 'Ongoing' ? 'is-warning' : ''}`}>{status}</span></td>
                    <td>{fight.__source === 'shadowTemplate' ? 'Template' : `${Number(fight.matchTokens || 0).toLocaleString()} tokens`}</td>
                    <td>{fight.__source === 'shadowTemplate' ? '—' : Number(fight.pot || 0) ? `$${Number(fight.pot).toLocaleString()}` : '—'}</td>
                    <td>
                      <div className="admin-row-actions admin-table-actions">
                        {isFinished ? <button type="button" onClick={() => openScores(fight)}><FaEye /> Scores</button> : <button type="button" onClick={() => openScoring(fight)}><FaTrophy /> Score</button>}
                        {isFinished && <button type="button" onClick={() => openScoring(fight)}><FaEdit /> Edit scores</button>}
                        {isLive && <button type="button" onClick={() => openPromotion(fight)}><FaVideo /> Promote</button>}
                        <Link href={`/administration/DeleteUpdateMatches?matchId=${id}`}><FaEdit /> Edit fight</Link>
                        <button type="button" className="is-danger" onClick={() => deleteFight(fight)}><FaTrashAlt /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="7"><div className="admin-empty-table"><FaFistRaised /><strong>No fights found</strong><span>Try another search term or filter tab.</span></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
