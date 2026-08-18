import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaBolt,
  FaEdit,
  FaEye,
  FaFistRaised,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';
import EditMatch from './EditMatch';
import AdminPredictions from './AdminPredictions';
import ShowScores from './ShowScores';
import { orderFightsForDisplay } from '@/Utils/fightOrdering';
import { fetchMatches } from '@/Redux/matchSlice';
import { fightDataQualityApi } from '@/Utils/fightDataQualityApi';
import OptimizedImage from '@/Components/Common/OptimizedImage';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.webp';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.webp';

const getId = (value) => value?._id || value?.id;
const getFightTitle = (match) => match?.matchName || `${match?.matchFighterA || 'Fighter A'} vs ${match?.matchFighterB || 'Fighter B'}`;
const affiliateEntries = (match) => Array.isArray(match?.AffiliateIds) ? match.AffiliateIds : [];

const ShadowFightsLibrary = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showFightPopup, setShowFightPopup] = useState(false);
  const [showAffiliatesPopup, setShowAffiliatesPopup] = useState(false);
  const [affiliates, setAffiliates] = useState([]);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedScoresView, setSelectedScoresView] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMatchesData = async () => {
    setLoading(true);
    try {
      const payload = await fightDataQualityApi.adminShadowLibrary({ limit: 200, matchType: 'all' });
      const rows = Array.isArray(payload?.items) ? payload.items : [];
      setMatches(orderFightsForDisplay(rows));
    } catch (adminApiError) {
      console.warn('Admin shadow library endpoint unavailable, falling back to legacy shadow feed:', adminApiError.message);
      try {
        const response = await fetch(`${API_BASE}/shadow`);
        const data = await response.json();
        setMatches(orderFightsForDisplay(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error fetching matches:', error);
        setMatches([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliatesData = async () => {
    try {
      const response = await fetch(`${API_BASE}/affiliates`);
      const data = await response.json();
      setAffiliates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      setAffiliates([]);
    }
  };

  useEffect(() => {
    fetchMatchesData();
    fetchAffiliatesData();
  }, []);

  const filteredMatches = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return matches;
    return matches.filter((match) => [
      match?.matchName,
      match?.matchFighterA,
      match?.matchFighterB,
      match?.matchDescription,
      match?.matchCategory,
      match?.matchCategoryTwo,
      match?.matchStatus,
      match?.matchType,
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [matches, searchQuery]);

  const totalAffiliateLinks = useMemo(() => matches.reduce((sum, match) => sum + affiliateEntries(match).length, 0), [matches]);
  const sportCount = useMemo(() => new Set(matches.map((match) => match?.matchCategoryTwo || match?.matchCategory).filter(Boolean)).size, [matches]);

  const filteredAffiliates = useMemo(() => {
    if (!selectedMatch) return [];
    const ids = new Set(affiliateEntries(selectedMatch).map((entry) => String(entry?.AffiliateId || entry?._id || entry)));
    return affiliates.filter((affiliate) => ids.has(String(getId(affiliate))));
  }, [affiliates, selectedMatch]);

  const openDetails = (match) => {
    setSelectedMatch(match);
    setShowFightPopup(true);
  };

  const openAffiliates = (match = selectedMatch) => {
    if (match) setSelectedMatch(match);
    setShowFightPopup(false);
    setShowAffiliatesPopup(true);
  };

  const openEditor = (match = selectedMatch) => {
    const id = getId(match);
    if (!id) return;
    setShowFightPopup(false);
    setEditingMatchId(id);
  };

  const openScoring = (match = selectedMatch) => {
    const id = getId(match);
    if (!id) return;
    setShowFightPopup(false);
    setSelectedScore(id);
  };

  const openScores = (match = selectedMatch) => {
    const id = getId(match);
    if (!id) return;
    setShowFightPopup(false);
    setSelectedScoresView(id);
  };

  const handleDeleteClick = async (matchToDelete = selectedMatch) => {
    if (!matchToDelete) return;
    const matchId = getId(matchToDelete);

    const deleteShadowFightPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${API_BASE}/shadowfighttodelete/${matchId}`, { method: 'DELETE' });
        if (response.ok) {
          await response.json().catch(() => ({}));
          setShowFightPopup(false);
          setSelectedMatch(null);
          await fetchMatchesData();
          dispatch(fetchMatches({ includeDrafts: true }));
          resolve();
        } else {
          reject(new Error('Failed to delete the match.'));
        }
      } catch (error) {
        console.error('Error deleting match:', error);
        reject(new Error('Error deleting match.'));
      }
    });

    toast.promise(deleteShadowFightPromise, {
      pending: 'Deleting match...',
      success: 'Match deleted successfully 👌',
      error: { render({ data }) { return data.message || 'Failed to delete match'; } },
    });
  };

  if (selectedScore) {
    return (
      <div className="admin-workspace admin-shadow-score-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Shadow scoring</span><h2>Submit shadow fight scores</h2><p>Score this shadow fight using the same round and video scoring tools as regular fights.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedScore(null)}><FaArrowLeft /> Back to shadow library</button>
        </section>
        <AdminPredictions matchId={selectedScore} filter="shadowTemplate" />
      </div>
    );
  }

  if (selectedScoresView) {
    return (
      <div className="admin-workspace admin-shadow-score-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Shadow results</span><h2>View shadow fight scores</h2><p>Review submitted scoring output for this shadow fight.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setSelectedScoresView(null)}><FaArrowLeft /> Back to shadow library</button>
        </section>
        <ShowScores matchId={selectedScoresView} filter="shadowTemplate" />
      </div>
    );
  }

  if (editingMatchId) {
    return (
      <div className="admin-workspace admin-shadow-editor-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Shadow operations</span><h2>Edit shadow template</h2><p>Update the selected reusable fight card through the original shadow edit endpoint.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setEditingMatchId(null)}><FaArrowLeft /> Back to library</button>
        </section>
        <EditMatch matchId={editingMatchId} isShadow />
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-shadow-library-workspace">
      <section className="admin-page-heading">
        <div><span>Fight operations</span><h2>Shadow fights library</h2><p>Search, inspect, score, edit, delete, and review affiliate usage for shadow fight templates only.</p></div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.back()}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={() => { fetchMatchesData(); fetchAffiliatesData(); }}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh</button>
        </div>
      </section>

      <section className="admin-shadow-metrics" aria-label="Shadow library summary">
        <article><span><FaBolt /></span><div><small>Templates</small><strong>{matches.length}</strong></div></article>
        <article><span><FaUserFriends /></span><div><small>Affiliate links</small><strong>{totalAffiliateLinks}</strong></div></article>
        <article><span><FaFistRaised /></span><div><small>Combat categories</small><strong>{sportCount}</strong></div></article>
      </section>

      <section className="admin-table-panel admin-shadow-table-panel">
        <div className="admin-table-toolbar">
          <label className="admin-table-search"><FaSearch /><input type="search" placeholder="Search fighter, template, category, or status" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label>
          <span className="admin-result-count">{filteredMatches.length} of {matches.length} templates</span>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table admin-fights-table admin-shadow-registry-table">
            <thead><tr><th>Template fight</th><th>Category</th><th>Type</th><th>Affiliates</th><th>Rounds</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredMatches.length ? filteredMatches.map((match, index) => {
                const affiliateCount = affiliateEntries(match).length;
                return (
                  <tr key={getId(match) || index}>
                    <td>
                      <div className="admin-fight-cell">
                        <span><OptimizedImage src={match.fighterA?.primaryImage || match.fighterAId?.primaryImage || match.fighterAImage || FALLBACK_A} fallbackSrc={FALLBACK_A} alt="" width={54} height={54} sizes="54px" /><OptimizedImage src={match.fighterB?.primaryImage || match.fighterBId?.primaryImage || match.fighterBImage || FALLBACK_B} fallbackSrc={FALLBACK_B} alt="" width={54} height={54} sizes="54px" /></span>
                        <div><strong>{getFightTitle(match)}</strong><small>{match.matchFighterA || 'Fighter A'} vs {match.matchFighterB || 'Fighter B'}</small></div>
                      </div>
                    </td>
                    <td>{match.matchCategoryTwo || match.matchCategory || 'Combat'}</td>
                    <td><span className="admin-status-badge is-neutral">{match.matchType || 'SHADOW'}</span></td>
                    <td><button type="button" className="admin-shadow-affiliate-count" onClick={() => openAffiliates(match)}><FaUsers /> {affiliateCount}</button></td>
                    <td>{match.maxRounds || '—'}</td>
                    <td><span className={`admin-status-badge ${String(match.matchStatus || match.matchShadowStatus).toLowerCase() === 'finished' ? 'is-success' : 'is-warning'}`}>{match.matchStatus || match.matchShadowStatus || 'Template'}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => openDetails(match)}><FaEye /> Details</button>
                        <button type="button" onClick={() => openScoring(match)}><FaBolt /> Score</button>
                        <button type="button" onClick={() => openScores(match)}><FaEye /> Scores</button>
                        <button type="button" onClick={() => openEditor(match)}><FaEdit /> Edit</button>
                        <button type="button" className="is-danger" onClick={() => handleDeleteClick(match)}><FaTrashAlt /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7"><div className="admin-empty-table">{loading ? 'Loading shadow fight templates.' : 'No shadow fight templates found.'}</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showFightPopup && selectedMatch && (
        <div className="admin-modal-backdrop admin-shadow-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowFightPopup(false);
        }}>
          <section className="admin-shadow-details-modal" role="dialog" aria-modal="true">
            <button type="button" className="admin-modal-close" onClick={() => setShowFightPopup(false)}>×</button>
            <div className="admin-shadow-detail-faceoff">
              <article><OptimizedImage src={selectedMatch.fighterA?.primaryImage || selectedMatch.fighterAId?.primaryImage || selectedMatch.fighterAImage || FALLBACK_A} fallbackSrc={FALLBACK_A} alt={selectedMatch.matchFighterA || 'Fighter A'} width={132} height={132} sizes="132px" /><strong>{selectedMatch.matchFighterA || 'Fighter A'}</strong></article>
              <b>VS</b>
              <article><OptimizedImage src={selectedMatch.fighterB?.primaryImage || selectedMatch.fighterBId?.primaryImage || selectedMatch.fighterBImage || FALLBACK_B} fallbackSrc={FALLBACK_B} alt={selectedMatch.matchFighterB || 'Fighter B'} width={132} height={132} sizes="132px" /><strong>{selectedMatch.matchFighterB || 'Fighter B'}</strong></article>
            </div>
            <div className="admin-shadow-detail-copy">
              <span>{selectedMatch.matchType || 'SHADOW'} · {selectedMatch.matchCategoryTwo || selectedMatch.matchCategory || 'Combat'}</span>
              <h3>{getFightTitle(selectedMatch)}</h3>
              <p>{selectedMatch.matchDescription || 'No template description has been supplied.'}</p>
              <dl><div><dt>Affiliates promoting</dt><dd>{affiliateEntries(selectedMatch).length}</dd></div><div><dt>Maximum rounds</dt><dd>{selectedMatch.maxRounds || '—'}</dd></div></dl>
            </div>
            <footer>
              <button type="button" className="admin-action-secondary" onClick={() => openAffiliates(selectedMatch)}><FaUsers /> View affiliates</button>
              <button type="button" className="admin-action-secondary" onClick={() => openScoring(selectedMatch)}><FaBolt /> Score fight</button>
              <button type="button" className="admin-action-secondary" onClick={() => openEditor(selectedMatch)}><FaEdit /> Edit template</button>
              <button type="button" className="admin-action-danger" onClick={() => handleDeleteClick(selectedMatch)}><FaTrashAlt /> Delete match</button>
              <button type="button" className="admin-action-secondary" onClick={() => setShowFightPopup(false)}>Close</button>
            </footer>
          </section>
        </div>
      )}

      {showAffiliatesPopup && selectedMatch && (
        <div className="admin-modal-backdrop admin-shadow-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowAffiliatesPopup(false);
        }}>
          <section className="admin-shadow-affiliates-modal" role="dialog" aria-modal="true">
            <button type="button" className="admin-modal-close" onClick={() => setShowAffiliatesPopup(false)}>×</button>
            <header><span>Template distribution</span><h3>Affiliates promoting this fight</h3><p>{getFightTitle(selectedMatch)}</p></header>
            <div className="admin-data-table-scroll">
              <table className="admin-data-table">
                <thead><tr><th>Affiliate</th><th>Email</th><th>Player name</th><th>Profile</th></tr></thead>
                <tbody>
                  {filteredAffiliates.length ? filteredAffiliates.map((affiliate) => (
                    <tr key={getId(affiliate)}>
                      <td><strong>{affiliate.firstName} {affiliate.lastName}</strong></td>
                      <td>{affiliate.email || '—'}</td>
                      <td>{affiliate.playerName || '—'}</td>
                      <td><img className="admin-shadow-affiliate-avatar" src={affiliate.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={affiliate.playerName || 'Affiliate'} /></td>
                    </tr>
                  )) : <tr><td colSpan="4"><div className="admin-empty-table">No matching affiliate profiles were found for this template.</div></td></tr>}
                </tbody>
              </table>
            </div>
            <footer><button type="button" className="admin-action-secondary" onClick={() => setShowAffiliatesPopup(false)}>Close</button></footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default ShadowFightsLibrary;
