import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaDatabase,
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
  FaBullhorn,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import { fightDataQualityApi } from '@/Utils/fightDataQualityApi';
import { getAdminToken } from '@/Utils/swarmApi';
import AdminPredictions from './AdminPredictions';
import ShowScores from './ShowScores';
import MatchDetailsPromotion from './MatchDetailsPromotion';
import FightDataQualityCenter from './FightDataQualityCenter';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import {
  getFighterImage,
  getFighterName,
  getPublicFightDuplicateKey,
} from '@/Utils/fightExperience';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.webp';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.webp';

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
];

const REGISTRY_VIEW_COPY = [
  { key: 'unique', label: 'Unique fights' },
  { key: 'all', label: 'All records' },
  { key: 'live', label: 'LIVE only' },
  { key: 'shadow', label: 'SHADOW only' },
];

const isRenderable = (value) => typeof value === 'string' && value.trim() && !['null', 'undefined'].includes(value.trim().toLowerCase());

const adminFightQualityScore = (fight = {}) => {
  const typeScore = String(fight?.matchType || '').toUpperCase() === 'LIVE' ? 10000 : 0;
  const status = String(fight?.matchStatus || fight?.matchShadowStatus || '').toLowerCase();
  const statusScore = status === 'ongoing' ? 600 : status === 'finished' ? 400 : 100;
  const imageScore = [getFighterImage(fight, 'A'), getFighterImage(fight, 'B'), fight?.promotionBackground].filter(isRenderable).length * 50;
  const statsScore = (Array.isArray(fight?.BoxingMatch?.fighterOneStats) && fight.BoxingMatch.fighterOneStats.length)
    || (Array.isArray(fight?.MMAMatch?.fighterOneStats) && fight.MMAMatch.fighterOneStats.length)
    ? 120 : 0;
  return typeScore + statusScore + imageScore + statsScore;
};

const dedupeAdminFightRows = (rows = []) => {
  const selected = new Map();
  (Array.isArray(rows) ? rows : []).forEach((fight) => {
    const key = getPublicFightDuplicateKey(fight) || String(getId(fight) || '');
    if (!key) return;
    const current = selected.get(key);
    if (!current || adminFightQualityScore(fight) > adminFightQualityScore(current)) {
      selected.set(key, fight);
    }
  });
  return Array.from(selected.values());
};

const normalizeRows = (matches) => (
  Array.isArray(matches) ? matches.map((fight) => ({ ...fight, __source: 'normal' })) : []
);

export default function AdminFightsWorkspace({ initialTab = 'all', mode = 'registry' }) {
  const dispatch = useDispatch();
  const matchStatus = useSelector((state) => state.matches.status);
  const [matches, setMatches] = useState([]);
  const [matchRowsLoading, setMatchRowsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [registryView, setRegistryView] = useState('unique');
  const [search, setSearch] = useState('');
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedScoresView, setSelectedScoresView] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedFightIds, setSelectedFightIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [promotionUpdatingId, setPromotionUpdatingId] = useState('');
  const [showDataQuality, setShowDataQuality] = useState(false);

  const normalizeMatchFeedRows = (payload) => (
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.rows)
            ? payload.rows
            : []
  );

  const loadLegacyMatchFeed = async () => {
    const response = await fetch(`${API_BASE}/match?limit=200&includeDrafts=true`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Legacy match feed failed with ${response.status}`);
    const data = await response.json();
    return normalizeMatchFeedRows(data);
  };

  const loadNormalMatches = async () => {
    setMatchRowsLoading(true);
    try {
      // /administration/fights is the fight registry for records stored in the legacy `/match` collection.
      // Do not filter by matchType here: some real fight records are stored with matchType=SHADOW,
      // while Shadow Fights Library is a separate template/library endpoint.
      const rows = await loadLegacyMatchFeed();
      if (rows.length) {
        setMatches(rows);
        return;
      }

      const payload = await fightDataQualityApi.adminFights({ limit: 200, includeDrafts: true });
      const adminRows = normalizeMatchFeedRows(payload);
      setMatches(adminRows);
    } catch (legacyError) {
      console.warn('Legacy match feed unavailable, trying admin fights endpoint:', legacyError.message);
      try {
        const payload = await fightDataQualityApi.adminFights({ limit: 200, includeDrafts: true });
        const rows = normalizeMatchFeedRows(payload);
        setMatches(rows);
      } catch (adminApiError) {
        console.error('Error fetching fight registry rows:', adminApiError);
        setMatches([]);
      }
    } finally {
      setMatchRowsLoading(false);
    }
  };

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ includeDrafts: true }));
    loadNormalMatches();
  }, [dispatch, matchStatus]);

  const allRows = useMemo(() => normalizeRows(matches), [matches]);

  const registryRows = useMemo(() => {
    const rows = registryView === 'unique' ? dedupeAdminFightRows(allRows) : allRows;
    if (registryView === 'live') return rows.filter((fight) => String(fight.matchType || '').toUpperCase() === 'LIVE');
    if (registryView === 'shadow') return rows.filter((fight) => String(fight.matchType || '').toUpperCase() === 'SHADOW');
    return rows;
  }, [allRows, registryView]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return registryRows.filter((fight) => {
      const status = String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase();
      const type = String(fight.matchType || '').toLowerCase();
      const tabMatch = activeTab === 'all'
        || (activeTab === 'ongoing' && status === 'ongoing')
        || (activeTab === 'finished' && status === 'finished')
        || (activeTab === 'live' && type === 'live');
      if (!tabMatch) return false;
      if (!normalizedSearch) return true;
      return [
        getId(fight),
        fight.id,
        fight.matchId,
        fight.fighterAId?._id || fight.fighterAId,
        fight.fighterBId?._id || fight.fighterBId,
        fight.matchName,
        getFighterName(fight, 'A'),
        getFighterName(fight, 'B'),
        fight.matchFighterA,
        fight.matchFighterB,
        getSport(fight),
        fight.matchDescription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeTab, registryRows, search]);

  useEffect(() => {
    setSelectedFightIds((current) => current.filter((id) => filteredRows.some((fight) => String(getId(fight)) === String(id))));
  }, [filteredRows]);

  const metrics = useMemo(() => ({
    total: registryRows.length,
    active: registryRows.filter((fight) => String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase() === 'ongoing').length,
    finished: registryRows.filter((fight) => String(fight.matchStatus || fight.matchShadowStatus || '').toLowerCase() === 'finished').length,
  }), [registryRows]);

  const getSourceType = (fight) => String(fight?.sourceType || fight?.__source || 'match').toLowerCase() === 'shadow' ? 'shadow' : 'match';

  const isHomepagePromoted = (fight) => Boolean(fight?.homepagePromoted || fight?.homepagePromotion?.isPromoted);

  const selectedFights = useMemo(() => (
    allRows.filter((fight) => selectedFightIds.includes(String(getId(fight))))
  ), [allRows, selectedFightIds]);

  const toggleFightSelection = (fight) => {
    const id = String(getId(fight) || '');
    if (!id) return;
    setSelectedFightIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleVisibleSelection = () => {
    const visibleIds = filteredRows.map((fight) => String(getId(fight) || '')).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedFightIds.includes(id));
    setSelectedFightIds((current) => allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...current, ...visibleIds]))
    );
  };

  const refreshFightRows = () => {
    dispatch(fetchMatches({ includeDrafts: true }));
    loadNormalMatches();
  };

  const bulkDeleteFights = async (fightsToDelete = selectedFights) => {
    const rows = fightsToDelete.filter((fight) => getId(fight));
    if (!rows.length) return;
    const confirmed = window.confirm(`Delete ${rows.length} selected fight${rows.length === 1 ? '' : 's'}? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/fights/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateWallet: false,
          items: rows.map((fight) => ({ id: getId(fight), sourceType: getSourceType(fight) })),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to delete selected fights');

      toast.success(payload?.message || `${rows.length} fight${rows.length === 1 ? '' : 's'} deleted.`);
      setSelectedFightIds([]);
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to delete selected fights.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const openScoring = (fight) => setSelectedScore({ id: getId(fight), filter: 'normal' });
  const openScores = (fight) => setSelectedScoresView({ id: getId(fight), filter: 'normal' });
  const openPromotion = (fight) => setSelectedPromotion(fight);

  const toggleHomepagePromotion = async (fight) => {
    const id = getId(fight);
    if (!id || promotionUpdatingId) return;
    const shouldPromote = !isHomepagePromoted(fight);
    setPromotionUpdatingId(String(id));
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(id)}/homepage-promotion`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          homepagePromoted: shouldPromote,
          sourceType: getSourceType(fight),
          homepagePromotionTitle: fight.matchName || getTitle(fight),
          homepagePromotionSubtitle: `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to update homepage banner.');
      toast.success(payload?.message || (shouldPromote ? 'Fight added to homepage banner.' : 'Fight removed from homepage banner.'));
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to update homepage banner.');
    } finally {
      setPromotionUpdatingId('');
    }
  };

  const deleteFight = async (fight) => {
    if (!getId(fight)) return;
    return bulkDeleteFights([fight]);
  };


  if (showDataQuality) {
    return (
      <div className="admin-workspace admin-fights-workspace">
        <FightDataQualityCenter
          onBack={() => setShowDataQuality(false)}
          onRefresh={refreshFightRows}
        />
      </div>
    );
  }

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
          <p>Search by fight name, fighter, sport, description, or fight ID. Unique view hides duplicated LIVE/SHADOW copies while the all-records filter remains available.</p>
        </div>
        <div className="admin-heading-actions">
          <Link href="/administration/AddNewMatch" className="admin-primary-action"><FaPlus /> Create fight</Link>
          <button type="button" className="admin-action-secondary" onClick={() => setShowDataQuality(true)}><FaDatabase /> Data quality</button>
          <button type="button" className="admin-action-secondary" onClick={refreshFightRows}><FaSyncAlt className={matchStatus === 'loading' || matchRowsLoading ? 'xp-spin' : ''} /> Refresh</button>
        </div>
      </section>

      <section className="admin-inline-metrics">
        <article><span>Total fights</span><strong>{metrics.total}</strong><small>{registryView === 'unique' ? 'unique display rows' : '/match registry records'}</small></article>
        <article><span>Active scoring</span><strong>{metrics.active}</strong><small>Open result workflows</small></article>
        <article><span>Completed</span><strong>{metrics.finished}</strong><small>Score review available</small></article>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar admin-fight-toolbar">
          <label className="admin-table-search"><FaSearch /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fight, fighter, sport, description, or ID" /></label>
          <div className="admin-filter-tabs">
            {TAB_COPY.map((tab) => <button key={tab.key} type="button" className={`admin-filter-tab ${activeTab === tab.key ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
          </div>
          <div className="admin-filter-tabs admin-registry-view-tabs">
            {REGISTRY_VIEW_COPY.map((view) => (
              <button
                key={view.key}
                type="button"
                className={`admin-filter-tab ${registryView === view.key ? 'is-active' : ''}`}
                onClick={() => setRegistryView(view.key)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-bulk-actions">
          <button type="button" className="admin-action-secondary" onClick={toggleVisibleSelection}>
            {filteredRows.length > 0 && filteredRows.every((fight) => selectedFightIds.includes(String(getId(fight)))) ? 'Clear visible' : 'Select visible'}
          </button>
          <span>{selectedFightIds.length} selected</span>
          <button type="button" className="admin-danger-action" disabled={!selectedFightIds.length || bulkDeleting} onClick={() => bulkDeleteFights()}>
            <FaTrashAlt /> {bulkDeleting ? 'Deleting...' : 'Delete selected'}
          </button>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table admin-fights-table">
            <thead>
              <tr><th>Select</th><th>Fight</th><th>Sport</th><th>Schedule</th><th>Status</th><th>Entry</th><th>Prize</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredRows.length ? filteredRows.map((fight, index) => {
                const id = getId(fight);
                const status = fight.matchStatus || 'Draft';
                const isFinished = String(status).toLowerCase() === 'finished';
                const isLive = String(fight.matchType || '').toUpperCase() === 'LIVE';
                return (
                  <tr key={`${fight.__source}-${id || index}`}>
                    <td>
                      <label className="admin-row-check" aria-label={`Select ${getTitle(fight)}`}>
                        <input type="checkbox" checked={selectedFightIds.includes(String(id))} onChange={() => toggleFightSelection(fight)} />
                      </label>
                    </td>
                    <td>
                      <div className="admin-fight-cell">
                        <span><OptimizedImage src={getFighterImage(fight, 'A') || FALLBACK_A} fallbackSrc={FALLBACK_A} alt="" width={54} height={54} sizes="54px" /><OptimizedImage src={getFighterImage(fight, 'B') || FALLBACK_B} fallbackSrc={FALLBACK_B} alt="" width={54} height={54} sizes="54px" /></span>
                        <div><strong>{getTitle(fight)}</strong><small>{getFighterName(fight, 'A')} vs {getFighterName(fight, 'B')}</small><small>ID: {id}</small></div>
                      </div>
                    </td>
                    <td>{getSport(fight)}</td>
                    <td><span className="admin-cell-stack"><strong>{formatDate(fight)}</strong><small>{formatTime(fight)}</small></span></td>
                    <td><span className={`admin-status-badge ${isFinished ? 'is-success' : status === 'Ongoing' ? 'is-warning' : ''}`}>{status}</span></td>
                    <td>{`${Number(fight.matchTokens || 0).toLocaleString()} tokens`}</td>
                    <td>{Number(fight.pot || 0) ? `$${Number(fight.pot).toLocaleString()}` : '—'}</td>
                    <td>
                      <div className="admin-row-actions admin-table-actions">
                        {isFinished ? <button type="button" onClick={() => openScores(fight)}><FaEye /> Scores</button> : <button type="button" onClick={() => openScoring(fight)}><FaTrophy /> Score</button>}
                        {isFinished && <button type="button" onClick={() => openScoring(fight)}><FaEdit /> Edit scores</button>}
                        {isLive && <button type="button" onClick={() => openPromotion(fight)}><FaVideo /> Promote</button>}
                        <button
                          type="button"
                          className={isHomepagePromoted(fight) ? 'is-warning' : ''}
                          disabled={promotionUpdatingId === String(id)}
                          onClick={() => toggleHomepagePromotion(fight)}
                        >
                          <FaBullhorn /> {promotionUpdatingId === String(id) ? 'Updating...' : isHomepagePromoted(fight) ? 'Remove banner' : 'Homepage banner'}
                        </button>
                        <Link href={`/administration/DeleteUpdateMatches?matchId=${id}`}><FaEdit /> Edit fight</Link>
                        <button type="button" className="is-danger" onClick={() => deleteFight(fight)}><FaTrashAlt /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="8"><div className="admin-empty-table"><FaFistRaised /><strong>No fights found</strong><span>Try another search term, clear filters, or click Refresh to reload the /match registry.</span></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
