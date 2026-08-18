import React, { useEffect, useState } from 'react';
import UserDetails from './UserDetails';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaAward,
  FaEye,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUsers,
  FaWallet,
} from 'react-icons/fa';

const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const AffiliateUsers = () => {
  const [affiliateUsers, setAffiliateUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addAffiliatePopup, setAddAffiliatePopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDistinctionPopup, setShowDistinctionPopup] = useState(false);
  const [distinctionAffiliateId, setDistinctionAffiliateId] = useState(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardImage, setRewardImage] = useState(null);
  const [deleteText, setDeleteText] = useState('Delete');
  const router = useRouter();

  const uploadDistinction = async () => {
    if (!distinctionAffiliateId || !rewardTitle || !rewardImage) {
      toast.error('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('affiliateId', distinctionAffiliateId);
    formData.append('rewardTitle', rewardTitle);
    formData.append('image', rewardImage);

    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/upload-affiliate-reward', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Distinction added successfully');
        setShowDistinctionPopup(false);
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to add distinction');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Server error');
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
      const data = await response.json();
      setAffiliateUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching affiliate users:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = affiliateUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All'
        || (filterStatus === 'Approved' && user.verified)
        || (filterStatus === 'Pending' && !user.verified);

      return matchesSearch && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, filterStatus, affiliateUsers]);

  const handleNavigation = () => {
    router.push('/administration/adminRecords');
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleDeleteUser = async (id) => {
    const deleteUserPromise = new Promise(async (resolve, reject) => {
      try {
        setDeleteText('Deleting...');
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliatetodelete/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setAffiliateUsers(affiliateUsers.filter((user) => user._id !== id));
          resolve();
        } else {
          reject(new Error('Delete Failed'));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        reject(new Error('Error deleting user'));
      }
    });

    toast.promise(deleteUserPromise, {
      pending: 'Deleting user...',
      success: 'User deleted successfully 👌',
      error: {
        render({ data }) {
          return data.message || 'Failed to delete user';
        },
      },
    }).finally(() => {
      setDeleteText('Delete');
    });
  };

  const addAffiliate = async (data) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/admin/add-affiliate', {
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
      return { success: false, message: 'An error occurred while adding the affiliate.' };
    }
  };

  if (detailsOpen && selectedUser) {
    return (
      <div className="admin-workspace admin-affiliate-details-page">
        <section className="admin-page-heading admin-page-heading-compact">
          <div>
            <p className="admin-page-eyebrow">Affiliate account</p>
            <h1>Creator details</h1>
            <p>Review the creator profile, league members, approval state, and confirmation email workflow.</p>
          </div>
          <div className="admin-page-actions">
            <button type="button" className="admin-action-secondary" onClick={() => setDetailsOpen(false)}>
              <FaArrowLeft /> Back to affiliates
            </button>
          </div>
        </section>
        <UserDetails user={selectedUser} />
      </div>
    );
  }

  return (
    <div className="admin-workspace">
      <section className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">People &amp; finance</p>
          <h1>Affiliate users</h1>
          <p>Review creator accounts, approval state, reward distinctions, and affiliate operations without changing the existing workflow.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.push(-1)}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={handleNavigation}><FaUsers /> Admin records</button>
          <button type="button" className="admin-action-secondary" onClick={() => router.push('/administration/payouts')}><FaWallet /> Payouts</button>
          <button type="button" className="admin-action-primary" onClick={() => setAddAffiliatePopup(true)}><FaPlus /> Add affiliate</button>
        </div>
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar admin-affiliate-toolbar">
          <label className="admin-table-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search affiliate by name"
              value={searchQuery}
              onChange={handleSearch}
            />
          </label>
          <div className="admin-filter-tabs" aria-label="Affiliate approval filter">
            {['All', 'Approved', 'Pending'].map((status) => (
              <button
                type="button"
                key={status}
                className={`admin-filter-tab ${filterStatus === status ? 'is-active' : ''}`}
                onClick={() => handleFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="admin-result-count"><FaUsers /> {filteredUsers.length} of {affiliateUsers.length} affiliates</span>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Status</th>
                <th>Distinction</th>
                <th>Profile</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <button type="button" className="admin-person-cell" onClick={() => handleViewUserDetails(user)}>
                      <img src={user.profileUrl || FALLBACK_AVATAR} alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Affiliate'} />
                      <span>
                        <strong>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Affiliate'}</strong>
                        <small>{user.playerName || user.email || 'Creator account'}</small>
                      </span>
                    </button>
                  </td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Approved' : 'Pending'}</span></td>
                  <td>
                    <button
                      type="button"
                      className={`admin-distinction-button ${user.rewardTitle ? 'has-reward' : ''}`}
                      onClick={() => {
                        setDistinctionAffiliateId(user._id);
                        setRewardTitle(user.rewardTitle || '');
                        setRewardImage(null);
                        setShowDistinctionPopup(true);
                      }}
                    >
                      <FaAward /> {user.rewardTitle ? 'Distinction added' : 'Add distinction'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" title="View affiliate" onClick={() => handleViewUserDetails(user)}><FaEye /></button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="is-danger" title="Delete affiliate" onClick={() => handleDeleteUser(user._id)}><FaTrash /> <span>{deleteText}</span></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="admin-empty-table">No affiliates match the current search and approval filter.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showDistinctionPopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDistinctionPopup(false); }}>
          <section className="admin-inspector-modal admin-distinction-modal">
            <header>
              <div><span>Creator reward</span><h3>Add distinction</h3></div>
              <button type="button" onClick={() => setShowDistinctionPopup(false)} aria-label="Close distinction form">×</button>
            </header>
            <div className="admin-modal-form-body admin-stacked-form">
              <label>
                Reward title
                <input type="text" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} required />
              </label>
              <label>
                Reward image
                <input type="file" accept="image/*" onChange={(event) => setRewardImage(event.target.files[0])} required />
              </label>
            </div>
            <footer>
              <button type="button" className="admin-action-primary" onClick={uploadDistinction}>Submit distinction</button>
              <button type="button" className="admin-action-secondary" onClick={() => setShowDistinctionPopup(false)}>Cancel</button>
            </footer>
          </section>
        </div>
      )}

      {addAffiliatePopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setAddAffiliatePopup(false); }}>
          <form
            className="admin-inspector-modal admin-create-affiliate"
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

              const result = await addAffiliate(data);

              if (result.success) {
                alert('Affiliate added successfully!');
                fetchData();
                setAddAffiliatePopup(false);
              } else {
                alert(`Error: ${result.message}`);
              }
              setLoading(false);
            }}
          >
            <header>
              <div><span>Direct administration</span><h3>Create affiliate</h3></div>
              <button type="button" onClick={() => setAddAffiliatePopup(false)} disabled={loading} aria-label="Close create affiliate form">×</button>
            </header>
            <div className="admin-rule-form-grid admin-modal-form-body">
              <label>First name<input type="text" name="firstName" id="firstName" required /></label>
              <label>Last name<input type="text" name="lastName" id="lastName" required /></label>
              <label className="is-wide">Email<input type="email" name="email" id="email" required /></label>
              <label className="is-wide">Password<input type="password" name="password" id="password" required /></label>
            </div>
            <footer>
              <button type="submit" className="admin-action-primary" disabled={loading}>{loading ? 'Adding, please wait...' : 'Add affiliate'}</button>
              <button type="button" className="admin-action-secondary" onClick={() => setAddAffiliatePopup(false)} disabled={loading}>Cancel</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default AffiliateUsers;
