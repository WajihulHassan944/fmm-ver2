import React, { useEffect, useMemo, useState } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import { FaArrowLeft, FaSearch, FaUsers } from 'react-icons/fa';
import AffiliateMatchDetails from './AffiliateMatchDetails';

const money = (n) => Number(n || 0).toLocaleString();

const AffiliateMatches = () => {
  const [fights, setFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedFight, setSelectedFight] = useState(null);

  const fetchFights = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/admin/affiliate-fights', { headers: adminHeaders() });
      const data = await response.json();
      setFights(Array.isArray(data?.fights) ? data.fights : []);
    } catch (error) {
      console.error('Error fetching affiliate fights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFights(); }, []);

  const filteredFights = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return fights.filter((fight) => {
      const matchesSearch = !query || [fight.matchName, fight.affiliateName, fight.matchFighterA, fight.matchFighterB]
        .filter(Boolean).join(' ').toLowerCase().includes(query);
      const matchesStatus = filterStatus === 'All'
        || (filterStatus === 'Approved' && fight.affiliateVerified)
        || (filterStatus === 'Pending' && !fight.affiliateVerified);
      return matchesSearch && matchesStatus;
    });
  }, [fights, searchQuery, filterStatus]);

  if (selectedFight) {
    return <AffiliateMatchDetails fight={selectedFight} onBack={() => setSelectedFight(null)} />;
  }

  return (
    <div className="admin-workspace">
      <section className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People &amp; finance</p>
          <h1>Affiliate matches</h1>
          <p>Every fight card an affiliate has created. Staking a guaranteed pot is optional — most cards build their pot purely from entries.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => window.history.back()}><FaArrowLeft /> Back</button>
        </div>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar admin-affiliate-toolbar">
          <label className="admin-table-search">
            <FaSearch aria-hidden="true" />
            <input type="search" placeholder="Search fight or affiliate" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
          <div className="admin-filter-tabs" aria-label="Affiliate approval filter">
            {['All', 'Approved', 'Pending'].map((status) => (
              <button
                type="button"
                key={status}
                className={`admin-filter-tab ${filterStatus === status ? 'is-active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="admin-result-count"><FaUsers /> {filteredFights.length} of {fights.length} affiliate fights</span>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Fight</th>
                <th>Affiliate</th>
                <th>Status</th>
                <th>Pot</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="admin-empty-table">Loading affiliate fights...</div></td></tr>
              ) : filteredFights.length > 0 ? filteredFights.map((fight) => (
                <tr key={`${fight.sourceType}-${fight._id}`}>
                  <td><strong>{fight.matchName}</strong><br /><small>{fight.matchCategory}</small></td>
                  <td>
                    <span className={`admin-status-badge ${fight.affiliateVerified ? 'is-success' : 'is-warning'}`}>{fight.affiliateName}</span>
                  </td>
                  <td><span className="admin-status-badge">{fight.matchStatus || 'Open'}</span></td>
                  <td>
                    {money(fight.pot)} FM
                    {fight.guaranteed ? <span className="admin-status-badge is-success" style={{ marginLeft: 8 }}>Guaranteed {money(fight.potTarget)}</span> : null}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => setSelectedFight(fight)}>View</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="admin-empty-table">No affiliate-created fights match the current search and filter.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AffiliateMatches;
