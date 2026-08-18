import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaBan,
  FaCoins,
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
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users');
      const data = await response.json();
      setUsers(data);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/usertodelete/${id}`, {
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="admin-workspace">
      <section className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People &amp; finance</p>
          <h1>Registered users</h1>
          <p>Review player accounts, plans, verification details, wallet balances, and moderation actions.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.push(-1)}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={() => router.push('/administration/suspended-accounts')}><FaBan /> Suspended accounts</button>
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
                  <td>
                    <button type="button" className="admin-person-cell" onClick={() => handleView(user)}>
                      <img src={user.profileUrl || FALLBACK_AVATAR} alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player'} />
                      <span><strong>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Player'}</strong><small>{user.playerName || 'No player name'}</small></span>
                    </button>
                  </td>
                  <td><span className="admin-status-badge is-draft">{user.currentPlan || 'None'}</span></td>
                  <td>{Number(user.tokens || 0).toLocaleString()}</td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Verified' : 'Pending'}</span></td>
                  <td><span className="admin-cell-stack"><strong>{user.email || '—'}</strong><small>{user.phone || 'No phone'}</small></span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" title="View user" onClick={() => handleView(user)}><FaEye /></button>
                      <button type="button" className="is-danger" title="Delete user" onClick={() => handleDelete(user._id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6"><div className="admin-empty-table">No registered users match the search.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
