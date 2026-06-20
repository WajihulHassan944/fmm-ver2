import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FaBan, FaCoins, FaEye, FaPlus, FaSearch, FaTimes, FaTrash } from 'react-icons/fa';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const RegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tokensToGive, setTokensToGive] = useState('');
  const [addUserPopup, setAddUserPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error(`Users request failed with ${response.status}`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Registered users could not be loaded.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${user.playerName || ''}`.toLowerCase().includes(query));
  }, [searchQuery, users]);

  const handleGiveTokens = async (userId) => {
    const amount = Number(tokensToGive);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid token amount.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/reward-tokens-only-forcibly/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: amount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to reward tokens.');
      setTokensToGive('');
      setUsers((current) => current.map((user) => user._id === userId ? { ...user, tokens: Number(user.tokens || 0) + amount } : user));
      setSelectedUser((current) => current ? { ...current, tokens: Number(current.tokens || 0) + amount } : current);
      toast.success('Tokens rewarded successfully.');
    } catch (error) {
      console.error('Error rewarding tokens:', error);
      toast.error(error.message || 'Tokens could not be rewarded.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    const request = fetch(`${API_BASE}/usertodelete/${id}`, { method: 'DELETE' }).then((response) => {
      if (!response.ok) throw new Error('Delete failed');
      setUsers((current) => current.filter((user) => user._id !== id));
      if (selectedUser?._id === id) setSelectedUser(null);
    });

    toast.promise(request, {
      pending: 'Deleting user...',
      success: 'User deleted successfully.',
      error: 'Failed to delete user.',
    });
  };

  const handleSuspendAccount = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_BASE}/redusers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedUser.email, profileUrl: selectedUser.profileUrl }),
      });
      if (!response.ok) throw new Error('Failed to suspend the user');
      toast.success('User suspended successfully.');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('The user could not be suspended.');
    }
  };

  const addUser = async (data) => {
    const response = await fetch(`${API_BASE}/admin/add-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(responseData.message || 'User could not be added.');
    return responseData;
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      await addUser({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
      });
      toast.success('User added successfully.');
      setAddUserPopup(false);
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'User could not be added.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminWrapper">
      <header className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People & finance</p>
          <h1>Registered users</h1>
          <p>Search player accounts, inspect membership status, issue tokens, suspend access, or create a new user.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-action-secondary" type="button" onClick={() => window.location.assign('/administration/suspended-accounts')}><FaBan /> Suspended accounts</button>
          <button className="admin-action-primary" type="button" onClick={() => setAddUserPopup(true)}><FaPlus /> Add user</button>
        </div>
      </header>

      <div className="admin-toolbar">
        <label className="admin-command-search" style={{ margin: 0, maxWidth: 430, width: '100%' }}>
          <FaSearch />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, player name, or email" />
        </label>
        <span className="admin-status-badge">{filteredUsers.length} accounts</span>
      </div>

      <div className="admin-data-table-shell">
        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Player</th><th>Plan</th><th>Tokens</th><th>Verified</th><th>Contact</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr><td colSpan="6">Loading registered users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6">No registered users match the current search.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span className="admin-table-avatar"><img src={user.profileUrl || FALLBACK_AVATAR} alt="" /></span>
                      <span className="admin-table-person"><strong>{user.firstName} {user.lastName}</strong><small>{user.playerName || user.email}</small></span>
                    </div>
                  </td>
                  <td>{user.currentPlan || 'None'}</td>
                  <td>{Number(user.tokens || 0).toLocaleString()}</td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Verified' : 'Pending'}</span></td>
                  <td><span className="admin-table-person"><strong>{user.email || '—'}</strong><small>{user.phone || 'No phone'}</small></span></td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-secondary" type="button" onClick={() => setSelectedUser(user)}><FaEye /> View</button>
                      <button className="admin-action-danger" type="button" onClick={() => handleDelete(user._id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="Popup styledPopup">
          <div className="popup-content">
            <div className="admin-page-heading" style={{ marginBottom: 18 }}>
              <div>
                <p className="admin-page-eyebrow">Player account</p>
                <h1 style={{ fontSize: 34 }}>{selectedUser.firstName} {selectedUser.lastName}</h1>
              </div>
              <button type="button" className="admin-action-secondary" onClick={() => setSelectedUser(null)} aria-label="Close"><FaTimes /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 18, alignItems: 'start' }}>
              <span className="admin-table-avatar" style={{ width: 92, height: 92 }}><img src={selectedUser.profileUrl || FALLBACK_AVATAR} alt="" /></span>
              <div className="admin-data-table-shell" style={{ boxShadow: 'none' }}>
                <table className="admin-data-table"><tbody>
                  <tr><th>Email</th><td>{selectedUser.email || '—'}</td></tr>
                  <tr><th>Phone</th><td>{selectedUser.phone || '—'}</td></tr>
                  <tr><th>Current plan</th><td>{selectedUser.currentPlan || 'None'}</td></tr>
                  <tr><th>ZIP code</th><td>{selectedUser.zipCode || '—'}</td></tr>
                  <tr><th>Tokens</th><td>{Number(selectedUser.tokens || 0).toLocaleString()}</td></tr>
                  <tr><th>Payment method</th><td>{selectedUser.preferredPaymentMethod || '—'} {selectedUser.preferredPaymentMethodValue ? `· ${selectedUser.preferredPaymentMethodValue}` : ''}</td></tr>
                </tbody></table>
              </div>
            </div>

            <div className="admin-toolbar" style={{ marginTop: 18 }}>
              <input type="number" min="1" value={tokensToGive} onChange={(event) => setTokensToGive(event.target.value)} placeholder="Token amount" />
              <button className="admin-action-primary" type="button" onClick={() => handleGiveTokens(selectedUser._id)}><FaCoins /> Reward tokens</button>
              <button className="admin-action-danger" type="button" onClick={handleSuspendAccount}><FaBan /> Suspend account</button>
            </div>
          </div>
        </div>
      )}

      {addUserPopup && (
        <div className="Popup styledPopup">
          <div className="popup-content">
            <div className="admin-page-heading" style={{ marginBottom: 18 }}>
              <div><p className="admin-page-eyebrow">New player</p><h1 style={{ fontSize: 34 }}>Add user</h1></div>
              <button type="button" className="admin-action-secondary" onClick={() => setAddUserPopup(false)} disabled={loading}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddUser} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label>First name<input type="text" name="firstName" required /></label>
                <label>Last name<input type="text" name="lastName" required /></label>
              </div>
              <label>Email address<input type="email" name="email" required /></label>
              <label>Temporary password<input type="password" name="password" required /></label>
              <div className="admin-page-actions">
                <button type="submit" className="admin-action-primary" disabled={loading}>{loading ? 'Adding user...' : 'Add user'}</button>
                <button type="button" className="admin-action-secondary" onClick={() => setAddUserPopup(false)} disabled={loading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredUsers;
