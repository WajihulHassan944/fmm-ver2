import React, { useEffect, useMemo, useState } from 'react';
import { adminHeaders, adminJsonHeaders } from '@/Utils/authFetch';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaBan,
  FaCoins,
  FaEnvelope,
  FaEye,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const RegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tokensToGive, setTokensToGive] = useState('');
  const [addUserPopup, setAddUserPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('Fantasy MMAdness update');
  const [bulkMessage, setBulkMessage] = useState('Hello {firstName},\n\n');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState([]);
  const [resendingId, setResendingId] = useState('');
  const router = useRouter();

  const requireFreshAdminSession = (response) => {
    if (response.status !== 401 && response.status !== 403) return false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminAuthToken');
      window.localStorage.removeItem('adminToken');
      window.sessionStorage.setItem('adminLoginNotice', 'Your admin session expired. Sign in again to manage registered users.');
    }
    router.replace('/administration/login?reason=session-expired');
    return true;
  };

  const fetchData = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users', { headers: adminJsonHeaders() });
      const data = await response.json();
      // Was unsorted (server order + no client sort) — a brand-new signup
      // could land anywhere in the list instead of at the top, which is
      // exactly why it didn't visibly appear as "new" even though the push
      // notification fired correctly.
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        : data;
      setUsers(sorted);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGiveTokens = async (userId) => {
    if (!tokensToGive || isNaN(tokensToGive) || tokensToGive <= 0) {
      return alert('Please enter a valid token amount.');
    }

    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/reward-tokens-only-forcibly/${userId}`, {
        method: 'POST',
        headers: adminJsonHeaders(),
        body: JSON.stringify({
          tokens: tokensToGive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reward tokens.');
      }

      setTokensToGive('');
      alert('Tokens rewarded successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error rewarding tokens:', error);
      alert('Error rewarding tokens. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/usertodelete/${id}`, { headers: adminJsonHeaders(),
          method: 'DELETE',
        });

        if (response.ok) {
          setUsers(users.filter((user) => user._id !== id));
          resolve();
        } else {
          reject();
        }
      } catch (error) {
        reject();
      }
    });

    toast.promise(deletePromise, {
      pending: 'Deleting user...',
      success: 'User deleted successfully 👌',
      error: 'Failed to delete user 🤯',
    });
  };

  const handleView = (user) => {
    setSelectedUser(user);
  };

  const handleSuspendAccount = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/redusers', {
        method: 'POST',
        headers: adminJsonHeaders(),
        body: JSON.stringify({ email: selectedUser.email, profileUrl: selectedUser.profileUrl }),
      });

      if (response.ok) {
        alert('User suspended successfully!');
        window.location.reload();
      } else {
        alert('Failed to suspend the user. Please try again.');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user. Please try again later.');
    }
  };

  const addUser = async (data) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/admin/add-user', {
        method: 'POST',
        headers: adminJsonHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json();
      return { success: false, message: errorData.message };
    } catch (err) {
      return { success: false, message: 'An error occurred while adding the user.' };
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => [
      user.firstName,
      user.lastName,
      user.playerName,
      user.email,
      user.currentPlan,
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [searchQuery, users]);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const canReceiveBulkEmail = (user) => isValidEmail(user?.email)
    && user?.verified === true
    && !user?.selfExcluded
    && !user?.emailOptOut
    && !user?.unsubscribed;
  const visibleEmailIds = filteredUsers.filter(canReceiveBulkEmail).map((user) => user._id);
  const allVisibleSelected = visibleEmailIds.length > 0 && visibleEmailIds.every((id) => selectedUserIds.includes(id));
  const selectedRecipients = users.filter((user) => selectedUserIds.includes(user._id) && canReceiveBulkEmail(user));

  const resendVerification = async (user) => {
    if (!isValidEmail(user.email) || resendingId) return;
    setResendingId(user._id);
    try {
      const response = await fetch(buildPublicApiUrl('/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not send verification email.');
      toast.success(`Resend requested for ${user.email}. Ask them to check their inbox and spam folder.`);
    } catch (error) {
      toast.error(error.message || 'Could not send verification email.');
    } finally {
      setResendingId('');
    }
  };

  const toggleUser = (id) => {
    setSelectedUserIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  };

  const toggleVisibleUsers = () => {
    setSelectedUserIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleEmailIds.includes(id))
      : [...new Set([...current, ...visibleEmailIds])]);
  };

  const sendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkMessage.trim() || selectedRecipients.length === 0) {
      toast.error('Select at least one user and enter a subject and message.');
      return;
    }

    setBulkSending(true);
    setBulkResults([]);
    setBulkProgress({ sent: 0, failed: 0, total: selectedRecipients.length });
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of selectedRecipients) {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/send-email-affiliate', {
          method: 'POST',
          headers: adminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: recipient.email.trim(),
            subject: bulkSubject.trim(),
            message: bulkMessage.replaceAll('{firstName}', recipient.firstName || recipient.playerName || 'Fight Fan'),
          }),
        });
        if (requireFreshAdminSession(response)) throw new Error('Admin session expired.');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || 'Email was rejected.');
        sent += 1;
        results.push({ id: recipient._id, email: recipient.email, ok: true });
      } catch (error) {
        failed += 1;
        results.push({ id: recipient._id, email: recipient.email, ok: false, message: error.message || 'Failed to send.' });
      }
      setBulkProgress({ sent, failed, total: selectedRecipients.length });
      setBulkResults([...results]);
    }

    setBulkSending(false);
    if (failed) toast.warning(`${sent} email${sent === 1 ? '' : 's'} sent; ${failed} failed.`);
    else toast.success(`${sent} user email${sent === 1 ? '' : 's'} sent.`);
  };

  return (
    <div className="admin-workspace">
      <section className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People &amp; finance</p>
          <h1>Registered users</h1>
          <p>Review player accounts, plans, verification details, wallet balances, and moderation actions.</p>
          <p>Pending means the player signed up but has not verified their email. They cannot sign in yet. Use the resend action to send a fresh link.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.back()}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={() => router.push('/administration/suspended-accounts')}><FaBan /> Suspended accounts</button>
          <button type="button" className="admin-action-secondary" disabled={!selectedRecipients.length} onClick={() => { setBulkResults([]); setBulkEmailOpen(true); }}><FaEnvelope /> Email selected ({selectedRecipients.length})</button>
          <button type="button" className="admin-action-primary" onClick={() => setAddUserPopup(true)}><FaPlus /> Add user</button>
        </div>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar">
          <label className="admin-table-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search player, email, or plan"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <span className="admin-result-count"><FaUsers /> {filteredUsers.length} of {users.length} users</span>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th className="admin-select-column"><input type="checkbox" aria-label="Select all visible registered users with eligible email addresses" checked={allVisibleSelected} onChange={toggleVisibleUsers} /></th>
                <th>Player</th>
                <th>Plan</th>
                <th>Tokens</th>
                <th>Verification</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="admin-select-column"><input type="checkbox" aria-label={`Select ${user.firstName || user.playerName || 'user'} for email`} checked={selectedUserIds.includes(user._id)} disabled={!canReceiveBulkEmail(user)} onChange={() => toggleUser(user._id)} /></td>
                  <td>
                    <button type="button" className="admin-person-cell" onClick={() => handleView(user)}>
                      <img src={user.profileUrl || FALLBACK_AVATAR} alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player'} />
                      <span><strong>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player'}</strong><small>{user.playerName || 'No player name'}</small></span>
                    </button>
                  </td>
                  <td><span className="admin-status-badge is-draft">{user.currentPlan || 'None'}</span></td>
                  <td>{Number(user.tokens || 0).toLocaleString()}</td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Verified' : 'Pending email verification'}</span></td>
                  <td><span className="admin-cell-stack"><strong>{user.email || '—'}</strong><small>{user.phone || 'No phone'}</small></span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" title="View user" onClick={() => handleView(user)}><FaEye /></button>
                      {!user.verified && isValidEmail(user.email) && <button type="button" title="Resend verification email" aria-label={`Resend verification email to ${user.email}`} disabled={Boolean(resendingId)} onClick={() => resendVerification(user)}><FaEnvelope /> {resendingId === user._id ? 'Sending…' : 'Resend'}</button>}
                      <button type="button" className="is-danger" title="Delete user" onClick={() => handleDelete(user._id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7"><div className="admin-empty-table">No registered users match the search.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {bulkEmailOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !bulkSending) setBulkEmailOpen(false); }}>
          <section className="admin-inspector-modal admin-bulk-email-modal">
            <header>
              <div><span>Player communications</span><h3>Email {selectedRecipients.length} registered users</h3></div>
              <button type="button" disabled={bulkSending} onClick={() => setBulkEmailOpen(false)} aria-label="Close bulk email">×</button>
            </header>
            <div className="admin-modal-form-body admin-stacked-form">
              <p className="admin-bulk-email-note">Messages are delivered one at a time through the same verified Gmail process already used for affiliate email. Use <strong>{'{firstName}'}</strong> to personalize each greeting. Self-excluded and opted-out accounts are not included.</p>
              <label>Subject<input type="text" value={bulkSubject} disabled={bulkSending} onChange={(event) => setBulkSubject(event.target.value)} /></label>
              <label>Message<textarea rows="9" value={bulkMessage} disabled={bulkSending} onChange={(event) => setBulkMessage(event.target.value)} /></label>
              <div className="admin-bulk-email-recipients"><strong>Recipients ({selectedRecipients.length})</strong><span>{selectedRecipients.map((user) => user.email).join(', ')}</span></div>
              {(bulkSending || bulkResults.length > 0) && <div className="admin-bulk-email-progress"><strong>{bulkSending ? 'Sending…' : 'Finished'}</strong><span>{bulkProgress.sent} sent · {bulkProgress.failed} failed · {bulkProgress.total} total</span></div>}
              {bulkResults.some((result) => !result.ok) && <div className="admin-bulk-email-errors">{bulkResults.filter((result) => !result.ok).map((result) => <span key={result.id}>{result.email}: {result.message}</span>)}</div>}
            </div>
            <footer>
              <button type="button" className="admin-action-primary" disabled={bulkSending || !selectedRecipients.length || !bulkSubject.trim() || !bulkMessage.trim()} onClick={sendBulkEmail}><FaEnvelope /> {bulkSending ? `Sending ${bulkProgress.sent + bulkProgress.failed + 1} of ${bulkProgress.total}…` : `Send ${selectedRecipients.length} emails`}</button>
              <button type="button" className="admin-action-secondary" disabled={bulkSending} onClick={() => setBulkEmailOpen(false)}>Close</button>
            </footer>
          </section>
        </div>
      )}

      {selectedUser && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null); }}>
          <section className="admin-inspector-modal admin-user-inspector">
            <header>
              <div><span>Player account</span><h3>{selectedUser.playerName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`}</h3></div>
              <button type="button" onClick={() => setSelectedUser(null)} aria-label="Close user details">×</button>
            </header>

            <div className="admin-user-profile">
              <img src={selectedUser.profileUrl || FALLBACK_AVATAR} alt={`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Player'} />
              <div>
                <strong>{`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Player'}</strong>
                <span>{selectedUser.currentPlan || 'None'} plan · {Number(selectedUser.tokens || 0).toLocaleString()} tokens</span>
                <p>{selectedUser.email || 'No email provided'}</p>
              </div>
            </div>

            <dl>
              <div><dt>Phone</dt><dd>{selectedUser.phone || '—'}</dd></div>
              <div><dt>Zip code</dt><dd>{selectedUser.zipCode || '—'}</dd></div>
              <div><dt>Verified</dt><dd>{selectedUser.verified ? 'Yes' : 'No'}</dd></div>
              <div><dt>Payment method</dt><dd>{selectedUser.preferredPaymentMethod || '—'}</dd></div>
              <div><dt>Payment ID</dt><dd>{selectedUser.preferredPaymentMethodValue || '—'}</dd></div>
              <div><dt>Tokens</dt><dd>{Number(selectedUser.tokens || 0).toLocaleString()}</dd></div>
            </dl>

            <div className="admin-wallet-adjust">
              <label>
                Reward token amount
                <input
                  type="text"
                  value={tokensToGive}
                  onChange={(event) => setTokensToGive(event.target.value)}
                  placeholder="Enter token amount"
                />
              </label>
              <button type="button" className="admin-action-primary" onClick={() => handleGiveTokens(selectedUser._id)}><FaCoins /> Submit tokens</button>
            </div>

            <footer>
              <button type="button" onClick={handleSuspendAccount}><FaBan /> Suspend account</button>
              <button type="button" className="admin-action-secondary" onClick={() => setSelectedUser(null)}>Close</button>
            </footer>
          </section>
        </div>
      )}

      {addUserPopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setAddUserPopup(false); }}>
          <form
            className="admin-inspector-modal admin-create-user"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              const formData = new FormData(event.target);
              const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
              };

              const result = await addUser(data);

              if (result.success) {
                alert('User added successfully!');
                fetchData();
                setAddUserPopup(false);
              } else {
                alert(`Error: ${result.message}`);
              }
              setLoading(false);
            }}
          >
            <header>
              <div><span>Direct administration</span><h3>Create player account</h3></div>
              <button type="button" onClick={() => setAddUserPopup(false)} disabled={loading} aria-label="Close create user form">×</button>
            </header>
            <div className="admin-rule-form-grid admin-modal-form-body">
              <label>First name<input type="text" name="firstName" required /></label>
              <label>Last name<input type="text" name="lastName" required /></label>
              <label className="is-wide">Email<input type="email" name="email" required /></label>
              <label className="is-wide">Password<input type="password" name="password" required /></label>
            </div>
            <footer>
              <button type="submit" className="admin-action-primary" disabled={loading}>{loading ? 'Adding, please wait...' : 'Add user'}</button>
              <button type="button" className="admin-action-secondary" onClick={() => setAddUserPopup(false)} disabled={loading}>Cancel</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default RegisteredUsers;
