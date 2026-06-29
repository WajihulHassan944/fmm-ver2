import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { FaEdit, FaPlus, FaSearch, FaSyncAlt, FaTrashAlt } from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import EditMatch from './EditMatch';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.jpg';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.jpg';

const DeleteFights = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState('default');
  const [returnTokens, setReturnTokens] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (matchStatus === 'idle') dispatch(fetchMatches()); }, [matchStatus, dispatch]);

  useEffect(() => {
    if (router.isReady && router.query?.matchId) {
      setSelectedMatchId(String(router.query.matchId));
      setIsEditing(true);
    }
  }, [router.isReady, router.query?.matchId]);

  const filteredMatches = useMemo(() => {
    const all = Array.isArray(matches) ? matches : [];
    if (!searchQuery.trim()) return all;
    const term = searchQuery.toLowerCase();
    return all.filter((match) => [match.matchName, match.matchFighterA, match.matchFighterB, match.matchDescription, match.matchCategory, match.matchCategoryTwo, match.matchStatus]
      .filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [matches, searchQuery]);

  const handleDeleteClick = (id, affiliateId) => {
    setSelectedMatchId(id);
    setSelectedAffiliateId(affiliateId || null);
    setShowPopup(true);
    setPopupStep('default');
  };

  const handleConfirmDelete = async () => {
    if (!selectedMatchId) return;
    const deleteMatchPromise = new Promise(async (resolve, reject) => {
      try {
        let url = `${API_BASE}/api/matches/${selectedMatchId}?updateWallet=${returnTokens}`;
        if (selectedAffiliateId) url += `&affiliateId=${selectedAffiliateId}`;
        const response = await fetch(url, { method: 'DELETE' });
        if (response.ok) {
          dispatch(fetchMatches());
          resolve();
          setShowPopup(false);
          setSelectedMatchId(null);
          setSelectedAffiliateId(null);
        } else reject(new Error('Failed to delete the match'));
      } catch (error) {
        reject(new Error('Server error, please try again later'));
      }
    });

    toast.promise(deleteMatchPromise, {
      pending: 'Deleting match...',
      success: 'Match deleted successfully 👌',
      error: { render({ data }) { return data.message || 'Failed to delete match'; } },
    });
  };

  if (isEditing && selectedMatchId) {
    return (
      <div className="admin-workspace">
        <section className="admin-page-heading admin-page-heading-compact">
          <div><span>Fight operations</span><h2>Edit fight</h2><p>Update the selected fight through the existing edit match component and endpoints.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => { setIsEditing(false); setSelectedMatchId(null); }}>Back to table</button>
        </section>
        <EditMatch matchId={selectedMatchId} isShadow={false} />
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-delete-fights-workspace">
      <section className="admin-page-heading">
        <div><span>Fight operations</span><h2>Delete / update fights</h2><p>Search all fight cards, edit production records, or delete with the original token-return confirmation flow.</p></div>
        <div className="admin-heading-actions"><Link href="/administration/AddNewMatch" className="admin-primary-action"><FaPlus /> Create fight</Link><button type="button" className="admin-action-secondary" onClick={() => dispatch(fetchMatches())}><FaSyncAlt className={matchStatus === 'loading' ? 'xp-spin' : ''} /> Refresh</button></div>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar">
          <label className="admin-table-search"><FaSearch /><input type="search" placeholder="Search fight, fighter, category, or status" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></label>
          <span className="admin-result-count">{filteredMatches.length} of {(matches || []).length} fights</span>
        </div>
        <div className="admin-data-table-scroll">
          <table className="admin-data-table admin-fights-table">
            <thead><tr><th>Fight</th><th>Sport</th><th>Schedule</th><th>Status</th><th>Prize</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredMatches.length ? filteredMatches.map((match, index) => (
                <tr key={match._id || index}>
                  <td><div className="admin-fight-cell"><span><img src={match.fighterAImage || FALLBACK_A} alt="" /><img src={match.fighterBImage || FALLBACK_B} alt="" /></span><div><strong>{match.matchName || `${match.matchFighterA} vs ${match.matchFighterB}`}</strong><small>{match.matchFighterA} vs {match.matchFighterB}</small></div></div></td>
                  <td>{match.matchCategoryTwo || match.matchCategory}</td>
                  <td><span className="admin-cell-stack"><strong>{match.matchDate?.split('T')[0] || 'Date pending'}</strong><small>{match.matchTime || 'Time pending'}</small></span></td>
                  <td><span className={`admin-status-badge ${match.matchStatus === 'Finished' ? 'is-success' : 'is-warning'}`}>{match.matchStatus || 'Draft'}</span></td>
                  <td>{Number(match.pot || 0) ? `$${Number(match.pot).toLocaleString()}` : '—'}</td>
                  <td><div className="admin-row-actions"><button type="button" onClick={() => { setSelectedMatchId(match._id); setIsEditing(true); }}><FaEdit /> Edit</button><button type="button" className="is-danger" onClick={() => handleDeleteClick(match._id, match.affiliateId)}><FaTrashAlt /> Delete</button></div></td>
                </tr>
              )) : <tr><td colSpan="6"><div className="admin-empty-table">No matches found.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showPopup && (
        <div className="admin-modal-backdrop">
          <section className="admin-video-modal admin-delete-modal">
            <button type="button" className="admin-modal-close" onClick={() => setShowPopup(false)}>×</button>
            {popupStep === 'default' ? (
              <><header><FaTrashAlt /><span>Delete fight</span><h3>Delete or edit this match?</h3><p>Editing keeps all data. Deleting can optionally return tokens to users.</p></header><div className="admin-delete-modal-actions"><button type="button" className="admin-action-danger" onClick={() => setPopupStep('confirmReturnTokens')}>Delete</button><button type="button" className="admin-action-secondary" onClick={() => { setIsEditing(true); setShowPopup(false); }}>Edit</button><button type="button" className="admin-action-secondary" onClick={() => setShowPopup(false)}>Cancel</button></div></>
            ) : (
              <><header><FaTrashAlt /><span>Wallet adjustment</span><h3>Return tokens?</h3><p>Choose whether users should receive their entry tokens back after deletion.</p></header><div className="admin-token-choice"><label><input type="radio" name="returnTokens" checked={returnTokens} onChange={() => setReturnTokens(true)} /> Yes</label><label><input type="radio" name="returnTokens" checked={!returnTokens} onChange={() => setReturnTokens(false)} /> No</label></div><div className="admin-delete-modal-actions"><button type="button" className="admin-action-danger" onClick={handleConfirmDelete}>Submit</button><button type="button" className="admin-action-secondary" onClick={() => setShowPopup(false)}>Cancel</button></div></>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DeleteFights;
