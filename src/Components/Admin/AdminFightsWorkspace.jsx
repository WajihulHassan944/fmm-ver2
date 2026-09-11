import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaBell,
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
  FaRobot,
  FaUserClock,
  FaCopy,
  FaTimes,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import { fightDataQualityApi } from '@/Utils/fightDataQualityApi';
import { getAdminToken } from '@/Utils/swarmApi';
import AdminPredictions from './AdminPredictions';
import ShowScores from './ShowScores';
import MatchDetailsPromotion from './MatchDetailsPromotion';
import FightDataQualityCenter from './FightDataQualityCenter';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { adminHeaders } from '@/Utils/authFetch';
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

// Fight-operations economics, mirroring the break-even guard the server
// enforces at settlement (declaredPot / entryFee, minimumEntrants falling
// back to that break-even figure). Lets the desk show risk at a glance
// instead of only after settlement fails.
const renderEntrantsCell = (fight) => {
  if (fight?.sourceType === 'shadow' || fight?.entrants == null) {
    return <span className="admin-cell-stack"><small>Shadow template</small></span>;
  }
  const entryFee = Number(fight.matchTokens) || 0;
  const entrants = Number(fight.entrants) || 0;
  const free = entryFee <= 0;
  if (free) {
    return <span className="admin-cell-stack"><strong>{entrants}</strong><small>Free contest</small></span>;
  }
  const breakEven = Number(fight.breakEvenEntrants) || 0;
  const minimumEntrants = Number(fight.minimumEntrants) || breakEven;
  const guarded = fight.autoRefundIfShort !== false;
  let badgeClass = '';
  let label;
  if (!guarded) {
    badgeClass = 'is-warning';
    label = 'Unguarded';
  } else if (entrants >= minimumEntrants) {
    badgeClass = 'is-success';
    label = 'Covered';
  } else {
    badgeClass = 'is-warning';
    label = 'Short';
  }
  return (
    <span className="admin-cell-stack">
      <strong>{entrants} / {minimumEntrants}</strong>
      <small>Break-even {breakEven}</small>
      <span className={`admin-status-badge ${badgeClass}`}>{label}</span>
    </span>
  );
};

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
  const [selectedEconomics, setSelectedEconomics] = useState(null);
  const [economicsEdits, setEconomicsEdits] = useState(null);
  const [economicsSaving, setEconomicsSaving] = useState(false);
  const [selectedFightIds, setSelectedFightIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [promotionUpdatingId, setPromotionUpdatingId] = useState('');
  const [placementUpdatingKey, setPlacementUpdatingKey] = useState('');
  const [scoutingUpdatingId, setScoutingUpdatingId] = useState('');
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [retiringShadow, setRetiringShadow] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/dashboard-counts`, { headers: adminHeaders({ Accept: 'application/json' }) })
      .then((response) => response.json())
      .then((data) => { if (active) setUnreadNotifications(Number(data?.unreadNotificationsCount || 0)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

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
      headers: adminHeaders({ Accept: 'application/json' }),
    });
    if (!response.ok) throw new Error(`Legacy match feed failed with ${response.status}`);
    const data = await response.json();
    return normalizeMatchFeedRows(data);
  };

  const loadNormalMatches = async () => {
    setMatchRowsLoading(true);
    try {
      const payload = await fightDataQualityApi.adminFights({ limit: 500, includeDrafts: true, source: 'all', matchType: 'all' });
      const adminRows = normalizeMatchFeedRows(payload);
      if (adminRows.length) {
        setMatches(adminRows);
        return;
      }

      // Safety fallback for older backend deployments that do not yet expose the combined admin registry.
      const [legacyRows, shadowPayload] = await Promise.allSettled([
        loadLegacyMatchFeed(),
        fightDataQualityApi.adminShadowLibrary({ limit: 500, includeDrafts: true, matchType: 'all' }),
      ]);
      const rows = [
        ...(legacyRows.status === 'fulfilled' ? normalizeMatchFeedRows(legacyRows.value) : []),
        ...(shadowPayload.status === 'fulfilled' ? normalizeMatchFeedRows(shadowPayload.value) : []),
      ];
      setMatches(rows);
    } catch (adminApiError) {
      console.warn('Combined admin fight registry unavailable, trying legacy match feed:', adminApiError.message);
      try {
        const rows = await loadLegacyMatchFeed();
        setMatches(rows);
      } catch (legacyError) {
        console.error('Error fetching fight registry rows:', legacyError);
        setMatches([]);
      }
    } finally {
      setMatchRowsLoading(false);
    }
  };

  useEffect(() => {
    // Always refetch on mount instead of only when status is 'idle' — Redux
    // status stays 'succeeded' for the rest of the session once loaded once,
    // so a fight created after that point never showed up here otherwise.
    dispatch(fetchMatches({ includeDrafts: true }));
    loadNormalMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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

  // Mirrors the exact filter/sort/slice(0,5) the public homepage (pages/welcome.js)
  // uses to pick its 5 fight-card windows, so this table shows precisely which
  // slot (if any) each fight currently occupies there — not a guess.
  // Prefer the admin's explicit homepageSlot when set; fights without one fall
  // back to the computed weight/date order to fill any remaining windows.
  const homepageSlotById = useMemo(() => {
    const map = {};
    const eligible = allRows
      .filter((f) => f && getFighterName(f, 'A') && getFighterName(f, 'B'))
      .filter((f) => !f.prizesSettledAt && String(f.matchStatus || '').toLowerCase() !== 'finished');
    const explicit = eligible.filter((f) => isHomepagePromoted(f) && Number(f.homepageSlot) >= 1 && Number(f.homepageSlot) <= 5);
    explicit.forEach((f) => { map[String(getId(f))] = Number(f.homepageSlot); });
    const takenSlots = new Set(Object.values(map));
    const remaining = eligible
      .filter((f) => !map[String(getId(f))])
      .sort((a, b) => {
        const rankDiff = Number(b.homepagePromotionRank || 0) - Number(a.homepagePromotionRank || 0);
        if (rankDiff) return rankDiff;
        const weight = (f) => (isHomepagePromoted(f) ? 2 : 0) + (f.featuredFight || f.featuredThisWeek ? 1 : 0);
        const diff = weight(b) - weight(a);
        return diff !== 0 ? diff : new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
      });
    let nextSlot = 1;
    remaining.forEach((f) => {
      while (takenSlots.has(nextSlot) && nextSlot <= 5) nextSlot += 1;
      if (nextSlot > 5) return;
      map[String(getId(f))] = nextSlot;
      takenSlots.add(nextSlot);
      nextSlot += 1;
    });
    return map;
  }, [allRows]);

  const moveHomepagePosition = async (fight, direction) => {
    const id = getId(fight);
    const key = `${id}:move-${direction}`;
    if (!id || placementUpdatingKey) return;
    const ranks = allRows.map((f) => Number(f.homepagePromotionRank || 0));
    const nextRank = direction === 'front' ? Math.max(0, ...ranks) + 1 : Math.min(0, ...ranks) - 1;
    setPlacementUpdatingKey(key);
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(id)}/homepage-promotion`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          homepagePromoted: isHomepagePromoted(fight),
          homepagePromotionRank: nextRank,
          sourceType: getSourceType(fight),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to reorder fight.');
      toast.success(`${getTitle(fight)} moved to the ${direction === 'front' ? 'front' : 'bottom'} of the homepage order.`);
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to reorder fight.');
    } finally {
      setPlacementUpdatingKey('');
    }
  };

  // Slots are 1 (most prominent) through 5. Assigning a slot number directly
  // sets a fixed, well-separated rank per slot so the fight lands in exactly
  // that homepage window instead of just nudging front/back one step at a time.
  // Slots are 1 (most prominent) through 5, and are the literal number the
  // admin picked — stored directly as homepageSlot, not derived from rank
  // ordering, so the website places the fight in exactly that window.
  const setHomepageSlot = async (fight, slot) => {
    const id = getId(fight);
    if (!id || placementUpdatingKey) return;
    setPlacementUpdatingKey(`${id}:slot-${slot}`);
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(id)}/homepage-promotion`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          homepagePromoted: slot > 0,
          homepageSlot: slot,
          sourceType: getSourceType(fight),
          homepagePromotionTitle: fight.matchName || getTitle(fight),
          homepagePromotionSubtitle: `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to update homepage slot.');
      toast.success(slot > 0 ? `${getTitle(fight)} set to homepage slot ${slot}.` : `${getTitle(fight)} removed from the homepage.`);
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to update homepage slot.');
    } finally {
      setPlacementUpdatingKey('');
    }
  };

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
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
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
  const openEconomics = (fight) => setSelectedEconomics(fight);

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

  const toggleHomepagePlacement = async (fight, surface) => {
    const id = getId(fight);
    const key = `${id}:${surface}`;
    if (!id || placementUpdatingKey) return;
    const field = surface === 'featured-this-week' ? 'featuredThisWeek' : 'featuredFight';
    setPlacementUpdatingKey(key);
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(id)}/homepage-placement`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ surface, selected: !Boolean(fight[field]), sourceType: getSourceType(fight) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to update homepage placement.');
      toast.success(`${getTitle(fight)} ${payload.selected ? 'selected for' : 'removed from'} ${surface === 'featured-this-week' ? 'Featured This Week' : 'Featured Fight'}.`);
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to update homepage placement.');
    } finally {
      setPlacementUpdatingKey('');
    }
  };

  const generateScoutingReport = async (fight) => {
    const id = getId(fight);
    if (!id || scoutingUpdatingId) return;
    setScoutingUpdatingId(String(id));
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(id)}/ai-scouting-report`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sourceType: getSourceType(fight) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to generate scouting report.');
      toast.success(`AI scouting report generated from ${Number(payload.pickCount || 0).toLocaleString()} submitted cards.`);
      refreshFightRows();
    } catch (error) {
      toast.error(error.message || 'Failed to generate scouting report.');
    } finally {
      setScoutingUpdatingId('');
    }
  };

  const deleteFight = async (fight) => {
    if (!getId(fight)) return;
    return bulkDeleteFights([fight]);
  };

  // --- delegating a fight to a scorer -------------------------------------
  // Multiple live cards in a night means somebody else has to punch rounds in.
  // A scorer gets a fight-scoped session: they submit rounds live, and they
  // cannot finalize or pay out — that stays here.
  const [scorerFight, setScorerFight] = useState(null);
  const [scorerName, setScorerName] = useState('');
  const [scorerEmail, setScorerEmail] = useState('');
  const [scorerLink, setScorerLink] = useState('');
  const [scorerBusy, setScorerBusy] = useState(false);
  const [scorerAssignments, setScorerAssignments] = useState([]);

  const openScorerPanel = async (fight) => {
    setScorerFight(fight);
    setScorerLink('');
    setScorerName('');
    setScorerEmail('');
    setScorerAssignments([]);
    try {
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(getId(fight))}/scorers`, {
        headers: adminHeaders({ Accept: 'application/json' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) setScorerAssignments(payload.assignments || []);
    } catch (_error) { /* the panel still works without the history */ }
  };

  const sendToScorer = async () => {
    if (!scorerFight) return;
    setScorerBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/fights/${encodeURIComponent(getId(scorerFight))}/scorers`, {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mode: 'link', scorerName, scorerEmail }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not create the scoring link.');
      setScorerLink(payload.link || '');
      if (scorerEmail && !payload.emailSent) {
        toast.error(`Link created, but the email to ${scorerEmail} failed to send${payload.emailError ? `: ${payload.emailError}` : ''}. Copy the link below and send it manually.`);
      } else {
        toast.success(scorerEmail ? `Scoring link emailed to ${scorerEmail}` : 'Scoring link created.');
      }
      openScorerPanel(scorerFight);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setScorerBusy(false);
    }
  };

  const revokeAssignment = async (assignmentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/scorer-assignments/${encodeURIComponent(assignmentId)}`, {
        method: 'DELETE',
        headers: adminHeaders({ Accept: 'application/json' }),
      });
      if (!response.ok) throw new Error('Could not revoke that assignment.');
      toast.success('Scoring access revoked.');
      if (scorerFight) openScorerPanel(scorerFight);
    } catch (error) {
      toast.error(error.message);
    }
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

  if (selectedEconomics) {
    const f = selectedEconomics;
    const edits = economicsEdits || { matchTokens: String(f.matchTokens ?? 0), pot: String(f.pot ?? 0), minimumEntrants: String(f.minimumEntrants ?? ''), autoRefundIfShort: f.autoRefundIfShort !== false };
    const entryFee = Number(edits.matchTokens) || 0;
    const pot = Number(edits.pot) || 0;
    const breakEven = entryFee > 0 ? Math.ceil(pot / entryFee) : 0;
    const minimumEntrants = Number(edits.minimumEntrants) || breakEven;
    const entrants = Number(f.entrants) || 0;
    const guarded = Boolean(edits.autoRefundIfShort);
    const isShadowFight = f.sourceType === 'shadow';
    const editField = (key) => (ev) => setEconomicsEdits({ ...edits, [key]: ev.target.value });
    const dirty = Boolean(economicsEdits);
    const saveEconomics = async () => {
      setEconomicsSaving(true);
      try {
        const guardRes = await fetch(`${API_BASE}/api/admin/fights/${getId(f)}/prize-guard`, {
          method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ minimumEntrants: edits.minimumEntrants, autoRefundIfShort: edits.autoRefundIfShort, matchTokens: edits.matchTokens, pot: edits.pot }),
        });
        const guardData = await guardRes.json();
        if (!guardRes.ok || !guardData.ok) throw new Error(guardData.message || 'Could not save economics.');
        toast.success('Fight economics updated.');
        setSelectedEconomics({ ...f, matchTokens: guardData.matchTokens, pot: guardData.pot, minimumEntrants: guardData.minimumEntrants, breakEvenEntrants: guardData.breakEvenEntrants, autoRefundIfShort: guardData.autoRefundIfShort });
        setEconomicsEdits(null);
        dispatch(fetchMatches());
      } catch (error) {
        toast.error(error.message || 'Could not save economics.');
      } finally {
        setEconomicsSaving(false);
      }
    };
    const covered = f.sourceType !== 'shadow' && guarded && entrants >= minimumEntrants;
    const display = 'var(--ff-display, Impact, sans-serif)';
    const border = 'rgba(255,255,255,.12)';
    const sectionStyle = { background: 'linear-gradient(180deg,rgba(16,24,34,.98),rgba(7,12,18,.99))', border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 16 };
    const badge = (n) => <span style={{ alignItems: 'center', background: 'rgba(223,17,27,.13)', border: '1px solid rgba(223,17,27,.4)', borderRadius: 9, color: '#fff', display: 'flex', fontFamily: display, fontWeight: 900, height: 38, justifyContent: 'center', width: 38, flex: '0 0 38px' }}>{n}</span>;
    const inputPill = (label, unit, value, onChange, accent, bg, opts = {}) => (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: display, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,.74)' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,247,251,.34)' }}>{unit}</span>
        </div>
        <div style={{ borderRadius: 9, border: `1px solid ${bg.border}`, background: bg.fill, padding: '4px 13px', display: 'flex', alignItems: 'center' }}>
          <input type="number" min="0" value={value} onChange={onChange} disabled={opts.disabled}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: accent, fontFamily: display, fontSize: 27, fontWeight: 900, padding: '11px 0', fontVariantNumeric: 'tabular-nums' }} />
          {opts.suffix && <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{opts.suffix}</span>}
        </div>
      </div>
    );
    return (
      <div className="admin-workspace" style={{ background: '#05080d', minHeight: '100%', padding: 24, borderRadius: 16 }}>
        <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase', color: '#ff2a35', marginBottom: 7 }}>Fight operations</div>
            <h1 style={{ fontFamily: display, fontSize: 34, letterSpacing: '.01em', margin: 0, lineHeight: 0.95, textTransform: 'uppercase', color: '#f5f7fb' }}>{getTitle(f)}</h1>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,247,251,.66)', margin: '8px 0 0', maxWidth: 620, lineHeight: 1.45 }}>Edit entry fee, prize pool, minimum entrants and the auto-refund guard — changes save straight to this fight.</p>
          </div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedEconomics(null)}>Back to fight registry</button>
        </section>

        <section style={sectionStyle}>
          <header style={{ alignItems: 'start', borderBottom: `1px solid ${border}`, display: 'flex', gap: 13, marginBottom: 19, paddingBottom: 16 }}>
            {badge('01')}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ color: '#fff', fontFamily: display, fontSize: 26, margin: 0, textTransform: 'uppercase' }}>Entry &amp; prize</h3>
              <p style={{ color: 'rgba(245,247,251,.66)', margin: '4px 0 0', fontSize: 14 }}>What players pay to enter, and what the fight advertises as the prize.</p>
            </div>
          </header>
          {inputPill('Entry tokens', 'matchTokens', edits.matchTokens, editField('matchTokens'), '#f7b51b', { border: 'rgba(247,181,27,.45)', fill: 'rgba(247,181,27,.07)' }, { suffix: 'tokens', disabled: isShadowFight })}
          {inputPill('Prize pool', 'pot', edits.pot, editField('pot'), '#35d45d', { border: 'rgba(53,212,93,.42)', fill: 'rgba(53,212,93,.07)' }, { suffix: '$', disabled: isShadowFight })}
        </section>

        <section style={sectionStyle}>
          <header style={{ alignItems: 'start', borderBottom: `1px solid ${border}`, display: 'flex', gap: 13, marginBottom: 19, paddingBottom: 16 }}>
            {badge('02')}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ color: '#fff', fontFamily: display, fontSize: 26, margin: 0, textTransform: 'uppercase' }}>Entrants &amp; guard</h3>
              <p style={{ color: 'rgba(245,247,251,.66)', margin: '4px 0 0', fontSize: 14 }}>The break-even math and live entrant count the settlement guard checks against.</p>
            </div>
          </header>
          {(() => { const pill = (label, unit, value, accent, bg) => (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: display, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,.74)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,247,251,.34)' }}>{unit}</span>
              </div>
              <div style={{ borderRadius: 9, border: `1px solid ${bg.border}`, background: bg.fill, padding: '11px 13px' }}>
                <div style={{ fontFamily: display, fontSize: 27, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            </div>
          ); return pill('Break-even entrants', 'breakEvenEntrants', breakEven || '\u2014', '#168fe6', { border: 'rgba(22,143,230,.42)', fill: 'rgba(22,143,230,.07)' }); })()}
          {inputPill('Minimum entrants required', 'minimumEntrants', edits.minimumEntrants, editField('minimumEntrants'), '#168fe6', { border: 'rgba(22,143,230,.42)', fill: 'rgba(22,143,230,.07)' })}
          {pill('Live entrants right now', 'entrants', isShadowFight ? 'Shadow template' : entrants, covered ? '#35d45d' : '#f7b51b', covered ? { border: 'rgba(53,212,93,.42)', fill: 'rgba(53,212,93,.07)' } : { border: 'rgba(247,181,27,.45)', fill: 'rgba(247,181,27,.07)' })}
          <div style={{ borderRadius: 9, border: `1px solid ${guarded ? 'rgba(53,212,93,.42)' : 'rgba(247,181,27,.45)'}`, background: guarded ? 'rgba(53,212,93,.07)' : 'rgba(247,181,27,.07)', padding: '13px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setEconomicsEdits({ ...edits, autoRefundIfShort: !edits.autoRefundIfShort })}>
            <span style={{ fontFamily: display, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,.74)' }}>Auto-refund guard</span>
            <span style={{ fontFamily: display, fontSize: 16, fontWeight: 900, color: guarded ? '#35d45d' : '#f7b51b', textTransform: 'uppercase' }}>{guarded ? 'On \u2014 voids and refunds if short (tap to turn off)' : 'Off \u2014 unguarded (tap to turn on)'}</span>
          </div>
        </section>

        {dirty && (
          <div style={{ position: 'sticky', bottom: 16, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'linear-gradient(180deg,rgba(16,24,34,.98),rgba(7,12,18,.99))', border: '1px solid rgba(223,17,27,.5)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
            <span style={{ fontFamily: display, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#f7b51b' }}>Unsaved changes to this fight's economics</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="admin-action-secondary" onClick={() => setEconomicsEdits(null)} disabled={economicsSaving}>Revert</button>
              <button type="button" className="admin-action-primary" onClick={saveEconomics} disabled={economicsSaving}>{economicsSaving ? 'Saving\u2026' : 'Save changes'}</button>
            </div>
          </div>
        )}

        {(() => {
          const free = entryFee <= 0;
          const signed = (n) => (n === 0 ? '$0' : (n > 0 ? '+$' : '\u2212$') + Math.abs(n).toLocaleString());
          const voidValue = guarded ? 0 : -pot;
          const atMinValue = free ? -pot : minimumEntrants * entryFee - pot;
          const steps = [0, 2, 5, 10, 25, 50, 100, 250];
          const ladderScale = Math.max(pot, ...steps.map((n) => Math.abs((guarded && n < minimumEntrants) ? 0 : n * entryFee - pot)), 1);
          const ladder = steps.map((n) => {
            const voided = guarded && n < minimumEntrants;
            const pl = voided ? 0 : n * entryFee - pot;
            const half = Math.min(1, Math.abs(pl) / ladderScale) * 50;
            return {
              n, voided, pl,
              color: voided ? 'rgba(245,247,251,.32)' : pl > 0 ? '#35d45d' : pl < 0 ? '#ff2a35' : 'rgba(245,247,251,.6)',
              barColor: voided ? 'rgba(255,255,255,.14)' : pl >= 0 ? '#35d45d' : '#df111b',
              barLeft: (pl >= 0 ? 50 : 50 - half) + '%',
              barWidth: Math.max(half, 1.5) + '%',
            };
          });
          return (
            <>
              <section style={sectionStyle}>
                <header style={{ alignItems: 'start', borderBottom: `1px solid ${border}`, display: 'flex', gap: 13, marginBottom: 19, paddingBottom: 16 }}>
                  {badge('03')}
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ color: '#fff', fontFamily: display, fontSize: 26, margin: 0, textTransform: 'uppercase' }}>Risk & payout scenarios</h3>
                    <p style={{ color: 'rgba(245,247,251,.66)', margin: '4px 0 0', fontSize: 14 }}>What settles if the fight voids, at your minimum, and on each entry past that.</p>
                  </div>
                </header>
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase', color: 'rgba(245,247,251,.42)', marginBottom: 4 }}>If it voids</div>
                    <div style={{ fontFamily: display, fontSize: 24, fontWeight: 900, color: guarded ? '#35d45d' : '#ff2a35' }}>{guarded ? '$0' : signed(voidValue)}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,247,251,.38)', marginTop: 2 }}>{guarded ? 'Entries refunded, nothing paid out' : 'No guard \u2014 pot pays regardless'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase', color: 'rgba(245,247,251,.42)', marginBottom: 4 }}>At your minimum</div>
                    <div style={{ fontFamily: display, fontSize: 24, fontWeight: 900, color: atMinValue >= 0 ? '#35d45d' : '#ff2a35' }}>{signed(atMinValue)}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,247,251,.38)', marginTop: 2 }}>{minimumEntrants.toLocaleString()} entrants</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase', color: 'rgba(245,247,251,.42)', marginBottom: 4 }}>Each entry past that</div>
                    <div style={{ fontFamily: display, fontSize: 24, fontWeight: 900, color: '#f7b51b' }}>{free ? '$0' : `$${entryFee.toLocaleString()}`}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,247,251,.38)', marginTop: 2 }}>Straight to the house</div>
                  </div>
                </div>
              </section>

              <section style={sectionStyle}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase', color: 'rgba(245,247,251,.66)', marginBottom: 13 }}>House position as entries arrive</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ladder.map((row) => (
                    <div key={row.n} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) 100px', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: row.voided ? 'rgba(245,247,251,.32)' : 'rgba(245,247,251,.72)' }}>{row.n === 0 ? 'None' : row.n.toLocaleString()}</div>
                      <div style={{ height: 9, borderRadius: 999, background: 'rgba(255,255,255,.07)', position: 'relative', overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: row.barLeft, width: row.barWidth, background: row.barColor, borderRadius: 999 }} />
                        <div style={{ position: 'absolute', top: -3, bottom: -3, left: '50%', width: 1.5, background: 'rgba(255,255,255,.35)' }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 900, color: row.color }}>{row.voided ? 'Voided' : signed(row.pl)}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,247,251,.42)', margin: '12px 0 0', paddingTop: 12, borderTop: `1px solid ${border}`, lineHeight: 1.45 }}>Centre line is zero. Greyed rows fall below your minimum \u2014 those void and refund instead of paying out.</p>
              </section>
            </>
          );
        })()}
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
        <MatchDetailsPromotion matchId={getId(selectedPromotion)} fight={selectedPromotion} />
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-fights-workspace">
      <Link href="/administration/notifications" className="admin-sticky-notify">
        <FaBell /> Notifications{unreadNotifications > 0 ? <b>{unreadNotifications}</b> : null}
      </Link>
      <section className="admin-page-heading">
        <div>
          <span>Fight operations</span>
          <h2>{mode === 'homepage' ? 'Homepage poster funnel' : mode === 'score' ? 'Score center and fight tables' : 'Unified fight registry'}</h2>
          <p>{mode === 'homepage' ? 'Upload artwork/video on the fight record, then use the Homepage banner action to place upcoming fights into the homepage/mobile poster funnel. Use Edit fight for poster/video files and Homepage banner for visibility.' : 'Search by fight name, fighter, sport, description, or fight ID. Unique view hides duplicated LIVE/SHADOW copies while the all-records filter remains available.'}</p>
        </div>
        <div className="admin-heading-actions">
          <Link href="/administration/AddNewMatch" className="admin-primary-action"><FaPlus /> Create fight</Link>
          {mode === 'homepage' && <Link href="/administration/ShadowFightsLibrary" className="admin-action-secondary"><FaVideo /> Shadow fight videos</Link>}
          <button type="button" className="admin-action-secondary" onClick={() => setShowDataQuality(true)}><FaDatabase /> Data quality</button>
          <button type="button" className="admin-action-secondary" disabled={retiringShadow} onClick={async () => {
            setRetiringShadow(true);
            try {
              const res = await fetch(`${API_BASE}/api/admin/retention/retire-shadow-fight`, { method: 'POST', headers: adminHeaders() });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.message || 'Could not remove the mystery fight.');
              toast.success(data.message || 'Mystery fight removed.');
              refreshFightRows();
            } catch (error) { toast.error(error.message || 'Could not remove the mystery fight.'); }
            finally { setRetiringShadow(false); }
          }}>{retiringShadow ? 'Removing…' : 'Remove mystery fight'}</button>
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
              <tr><th>Select</th><th>Fight</th><th>Sport</th><th>Website</th><th>Schedule</th><th>Status</th><th>Entry</th><th>Prize</th><th>Entrants</th><th>Actions</th></tr>
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
                    <td>
                      <select
                        className={`admin-status-badge ${homepageSlotById[String(id)] ? 'is-warning' : ''}`}
                        style={{ cursor: 'pointer' }}
                        title="Click to choose which of the homepage's 5 fight-card windows this fight occupies"
                        disabled={Boolean(placementUpdatingKey)}
                        value={homepageSlotById[String(id)] || 0}
                        onChange={(e) => setHomepageSlot(fight, Number(e.target.value))}
                      >
                        <option value={0}>Not shown</option>
                        {[1, 2, 3, 4, 5].map((slot) => (
                          <option key={slot} value={slot}>Homepage {slot}</option>
                        ))}
                      </select>
                    </td>
                    <td><span className="admin-cell-stack"><strong>{formatDate(fight)}</strong><small>{formatTime(fight)}</small></span></td>
                    <td><span className={`admin-status-badge ${isFinished ? 'is-success' : status === 'Ongoing' ? 'is-warning' : ''}`}>{status}</span></td>
                    <td>{`${Number(fight.matchTokens || 0).toLocaleString()} tokens`}</td>
                    <td>{Number(fight.pot || 0) ? `$${Number(fight.pot).toLocaleString()}` : '—'}</td>
                    <td>{renderEntrantsCell(fight)}</td>
                    <td>
                      <div className="admin-row-actions admin-table-actions">
                        <button type="button" onClick={() => openEconomics(fight)}><FaFistRaised /> Economics</button>
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
                        <button
                          type="button"
                          className={fight.featuredThisWeek ? 'is-warning' : ''}
                          disabled={Boolean(placementUpdatingKey)}
                          onClick={() => toggleHomepagePlacement(fight, 'featured-this-week')}
                        >
                          <FaBullhorn /> {placementUpdatingKey === `${id}:featured-this-week` ? 'Updating...' : fight.featuredThisWeek ? 'Remove weekly' : 'Featured this week'}
                        </button>
                        <button
                          type="button"
                          className={fight.featuredFight ? 'is-warning' : ''}
                          disabled={Boolean(placementUpdatingKey)}
                          onClick={() => toggleHomepagePlacement(fight, 'featured-fight')}
                        >
                          <FaFistRaised /> {placementUpdatingKey === `${id}:featured-fight` ? 'Updating...' : fight.featuredFight ? 'Remove feature' : 'Featured fight'}
                        </button>
                        <button type="button" disabled={Boolean(placementUpdatingKey)} onClick={() => moveHomepagePosition(fight, 'front')}>
                          {placementUpdatingKey === `${id}:move-front` ? 'Moving...' : 'Move to front'}
                        </button>
                        <button type="button" disabled={Boolean(placementUpdatingKey)} onClick={() => moveHomepagePosition(fight, 'bottom')}>
                          {placementUpdatingKey === `${id}:move-bottom` ? 'Moving...' : 'Move to bottom'}
                        </button>
                        <button type="button" disabled={scoutingUpdatingId === String(id)} onClick={() => generateScoutingReport(fight)}>
                          <FaRobot /> {scoutingUpdatingId === String(id) ? 'Generating...' : fight.aiScoutingReport ? 'Refresh AI report' : 'Generate AI report'}
                        </button>
                        <Link href={`/administration/swarm?tab=jobs&fightId=${encodeURIComponent(id || '')}&scopeLabel=${encodeURIComponent(getTitle(fight) || id || '')}`}><FaRobot /> Swarm jobs</Link>
                        <button type="button" onClick={() => openScorerPanel(fight)}><FaUserClock /> Send to scorer</button>
                        <Link href={`/administration/DeleteUpdateMatches?matchId=${id}&sourceType=${getSourceType(fight)}`}><FaEdit /> Edit fight</Link>
                        <button type="button" className="is-danger" onClick={() => deleteFight(fight)}><FaTrashAlt /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="10"><div className="admin-empty-table"><FaFistRaised /><strong>No fights found</strong><span>Try another search term, clear filters, or click Refresh to reload the /match registry.</span></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {scorerFight && (
        <div className="admin-scorer-backdrop" role="dialog" aria-modal="true" aria-label="Send fight to a scorer">
          <div className="admin-scorer-panel">
            <header>
              <div>
                <p>Send to scorer</p>
                <h3>{getTitle(scorerFight) || 'Fight'}</h3>
              </div>
              <button type="button" onClick={() => setScorerFight(null)} aria-label="Close"><FaTimes /></button>
            </header>

            <p className="admin-scorer-note">
              They get this one fight and nothing else &mdash; no pot, no entry fees, no entrant list,
              no other cards. Rounds go live as they submit them. Only you can finalize and pay out.
            </p>

            <label>
              <span>Their name</span>
              <input value={scorerName} onChange={(event) => setScorerName(event.target.value)} placeholder="Who is scoring" />
            </label>
            <label>
              <span>Email the link (optional)</span>
              <input type="email" value={scorerEmail} onChange={(event) => setScorerEmail(event.target.value)} placeholder="scorer@example.com" />
            </label>

            <button type="button" className="admin-scorer-create" onClick={sendToScorer} disabled={scorerBusy}>
              {scorerBusy ? 'Creating…' : 'Create scoring link'}
            </button>

            {scorerLink && (
              <div className="admin-scorer-link">
                <code>{scorerLink}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(scorerLink); toast.success('Link copied.'); }}
                >
                  <FaCopy /> Copy
                </button>
                <small>Works once, expires in 24 hours. Shown here only now.</small>
              </div>
            )}

            {scorerAssignments.length > 0 && (
              <div className="admin-scorer-history">
                <p>Already assigned</p>
                <ul>
                  {scorerAssignments.map((assignment) => (
                    <li key={assignment._id} className={assignment.revokedAt ? 'is-revoked' : ''}>
                      <span>
                        <strong>{assignment.scorerName || assignment.scorerEmail || 'Scorer'}</strong>
                        <small>
                          {assignment.mode === 'account' ? 'Staff account' : 'One-time link'}
                          {assignment.roundsSubmitted ? ` · ${assignment.roundsSubmitted} rounds submitted` : ' · not used yet'}
                        </small>
                      </span>
                      {assignment.revokedAt
                        ? <em>Revoked</em>
                        : <button type="button" onClick={() => revokeAssignment(assignment._id)}>Revoke</button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
