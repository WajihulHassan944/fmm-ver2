import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FaAward,
  FaEye,
  FaMoneyCheckAlt,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserFriends,
} from 'react-icons/fa';
import UserDetails from './UserDetails';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const AffiliateUsers = () => {
  const [affiliateUsers, setAffiliateUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addAffiliatePopup, setAddAffiliatePopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [showDistinctionPopup, setShowDistinctionPopup] = useState(false);
  const [distinctionAffiliateId, setDistinctionAffiliateId] = useState(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardImage, setRewardImage] = useState(null);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`${API_BASE}/affiliates`);
      if (!response.ok) throw new Error(`Affiliates request failed with ${response.status}`);
      const data = await response.json();
      setAffiliateUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching affiliate users:', error);
      toast.error('Affiliate users could not be loaded.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return affiliateUsers.filter((user) => {
      const statusMatches = filterStatus === 'All' || (filterStatus === 'Approved' ? user.verified : !user.verified);
      const textMatches = !query || `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${user.playerName || ''}`.toLowerCase().includes(query);
      return statusMatches && textMatches;
    });
  }, [affiliateUsers, filterStatus, searchQuery]);

  const uploadDistinction = async () => {
    if (!distinctionAffiliateId || !rewardTitle.trim() || !rewardImage) {
      toast.error('Reward title and image are required.');
      return;
    }

    const formData = new FormData();
    formData.append('affiliateId', distinctionAffiliateId);
    formData.append('rewardTitle', rewardTitle.trim());
    formData.append('image', rewardImage);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/upload-affiliate-reward`, { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to add distinction.');
      toast.success('Distinction added successfully.');
      setShowDistinctionPopup(false);
      setRewardImage(null);
      await fetchData();
    } catch (error) {
      console.error('Distinction upload error:', error);
      toast.error(error.message || 'The distinction could not be added.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this affiliate account permanently?')) return;
    setDeletingId(id);
    const request = fetch(`${API_BASE}/affiliatetodelete/${id}`, { method: 'DELETE' }).then((response) => {
      if (!response.ok) throw new Error('Delete failed');
      setAffiliateUsers((current) => current.filter((user) => user._id !== id));
    }).finally(() => setDeletingId(''));

    toast.promise(request, {
      pending: 'Deleting affiliate...',
      success: 'Affiliate deleted successfully.',
      error: 'Failed to delete affiliate.',
    });
  };

  const addAffiliate = async (data) => {
    const response = await fetch(`${API_BASE}/admin/add-affiliate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(responseData.message || 'Affiliate could not be added.');
  };

  const handleAddAffiliate = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      await addAffiliate({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
      });
      toast.success('Affiliate added successfully.');
      setAddAffiliatePopup(false);
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Affiliate could not be added.');
    } finally {
      setLoading(false);
    }
  };

  if (detailsOpen && selectedUser) {
    return (
      <div className="adminWrapper">
        <header className="admin-page-heading">
          <div><p className="admin-page-eyebrow">Affiliate account</p><h1>{selectedUser.firstName} {selectedUser.lastName}</h1><p>Review creator account details and administrative controls.</p></div>
          <button type="button" className="admin-action-secondary" onClick={() => setDetailsOpen(false)}>Back to affiliates</button>
        </header>
        <UserDetails user={selectedUser} />
      </div>
    );
  }

  return (
    <div className="adminWrapper">
      <header className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People & finance</p>
          <h1>Affiliate users</h1>
          <p>Review creator applications, manage distinctions, inspect account details, and access payout operations.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => window.location.assign('/administration/payouts')}><FaMoneyCheckAlt /> Payouts</button>
          <button type="button" className="admin-action-primary" onClick={() => setAddAffiliatePopup(true)}><FaPlus /> Add affiliate</button>
        </div>
      </header>

      <div className="admin-toolbar" style={{ justifyContent: 'space-between' }}>
        <label className="admin-command-search" style={{ margin: 0, maxWidth: 430, width: '100%' }}>
          <FaSearch />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search affiliate name or email" />
        </label>
        <div className="admin-page-actions">
          {['All', 'Approved', 'Pending'].map((status) => (
            <button type="button" key={status} className={filterStatus === status ? 'admin-action-primary' : 'admin-action-secondary'} onClick={() => setFilterStatus(status)}>{status}</button>
          ))}
          <span className="admin-status-badge">{filteredUsers.length} creators</span>
        </div>
      </div>

      <div className="admin-data-table-shell">
        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr><th>Affiliate</th><th>Status</th><th>Balance</th><th>Distinction</th><th>Contact</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr><td colSpan="6">Loading affiliate accounts...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6">No affiliate accounts match the current filters.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span className="admin-table-avatar"><img src={user.profileUrl || FALLBACK_AVATAR} alt="" /></span>
                      <span className="admin-table-person"><strong>{user.firstName} {user.lastName}</strong><small>{user.playerName || 'Affiliate creator'}</small></span>
                    </div>
                  </td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Approved' : 'Pending'}</span></td>
                  <td>{Number(user.tokens || 0).toLocaleString()} tokens</td>
                  <td>{user.rewardTitle ? <span className="admin-status-badge is-success"><FaAward /> {user.rewardTitle}</span> : <span className="admin-status-badge">Not assigned</span>}</td>
                  <td><span className="admin-table-person"><strong>{user.email || '—'}</strong><small>{user.phone || 'No phone'}</small></span></td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-action-secondary" onClick={() => { setDistinctionAffiliateId(user._id); setRewardTitle(user.rewardTitle || ''); setRewardImage(null); setShowDistinctionPopup(true); }}><FaAward /> Distinction</button>
                      <button type="button" className="admin-action-secondary" onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}><FaEye /> View</button>
                      <button type="button" className="admin-action-danger" disabled={deletingId === user._id} onClick={() => handleDeleteUser(user._id)}><FaTrash /> {deletingId === user._id ? 'Deleting' : 'Delete'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDistinctionPopup && (
        <div className="distinctionPopup-overlay">
          <div className="distinctionPopup-modal">
            <div className="admin-page-heading" style={{ marginBottom: 18 }}>
              <div><p className="admin-page-eyebrow">Creator recognition</p><h1 style={{ fontSize: 34 }}>Add distinction</h1></div>
              <button type="button" className="admin-action-secondary" onClick={() => setShowDistinctionPopup(false)} disabled={loading}><FaTimes /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <label>Reward title<input type="text" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} required /></label>
              <label>Reward image<input type="file" accept="image/*" onChange={(event) => setRewardImage(event.target.files?.[0] || null)} required /></label>
              <div className="admin-page-actions">
                <button type="button" className="admin-action-primary" onClick={uploadDistinction} disabled={loading}>{loading ? 'Uploading...' : 'Save distinction'}</button>
                <button type="button" className="admin-action-secondary" onClick={() => setShowDistinctionPopup(false)} disabled={loading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addAffiliatePopup && (
        <div className="Popup styledPopup">
          <div className="popup-content">
            <div className="admin-page-heading" style={{ marginBottom: 18 }}>
              <div><p className="admin-page-eyebrow">New creator</p><h1 style={{ fontSize: 34 }}>Add affiliate</h1></div>
              <button type="button" className="admin-action-secondary" onClick={() => setAddAffiliatePopup(false)} disabled={loading}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddAffiliate} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label>First name<input type="text" name="firstName" required /></label>
                <label>Last name<input type="text" name="lastName" required /></label>
              </div>
              <label>Email address<input type="email" name="email" required /></label>
              <label>Temporary password<input type="password" name="password" required /></label>
              <div className="admin-page-actions">
                <button type="submit" className="admin-action-primary" disabled={loading}>{loading ? 'Adding affiliate...' : 'Add affiliate'}</button>
                <button type="button" className="admin-action-secondary" onClick={() => setAddAffiliatePopup(false)} disabled={loading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateUsers;
