import React, { useState, useEffect } from 'react';
import UserDetails from './UserDetails';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const AffiliateUsers = () => {
  const [affiliateUsers, setAffiliateUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Approved', 'Pending'
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addAffiliatePopup, setAddAffiliatePopup] = useState(false);
  const [loading, setLoading] = useState(false);

const [showDistinctionPopup, setShowDistinctionPopup] = useState(false);
const [distinctionAffiliateId, setDistinctionAffiliateId] = useState(null);
const [rewardTitle, setRewardTitle] = useState('');
const [rewardImage, setRewardImage] = useState(null);


const [deleteText, setDeleteText] = useState("Delete");
const router = useRouter();

const uploadDistinction = async () => {
  if (!distinctionAffiliateId || !rewardTitle || !rewardImage) {
    toast.error("All fields are required");
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
      toast.success("Distinction added successfully");
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
    setFilteredUsers(data); // Initially, all users are displayed
  } catch (error) {
    console.error('Error fetching affiliate users:', error);
  }
};

  useEffect(() => {
   

    fetchData();
  }, []);

  useEffect(() => {
    // Filter users based on search query and status filter
    const filtered = affiliateUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || (filterStatus === 'Approved' && user.verified) || (filterStatus === 'Pending' && !user.verified);

      return matchesSearch && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, filterStatus, affiliateUsers]);

  const handleNavigation = () => {
    router.push('/administration/adminRecords');
  };

  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };
  if (detailsOpen && selectedUser) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left"
          aria-hidden="true"
          onClick={() => setDetailsOpen(false)} // Go back to the previous component
          style={{ position: 'absolute', top: '16px', left: '17%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
        ></i>
        <UserDetails user={selectedUser} />
      </>
    );
  }
  

  const handleDeleteUser = async (id) => {
    const deleteUserPromise = new Promise(async (resolve, reject) => {
      try {
        setDeleteText("Deleting...");
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliatetodelete/${id}`, {
          method: 'DELETE',
        });
  
        if (response.ok) {
          setAffiliateUsers(affiliateUsers.filter(user => user._id !== id)); // Update state after deletion
          resolve(); // Resolve the promise on success
        } else {
          reject(new Error('Delete Failed')); // Reject on error response
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        reject(new Error('Error deleting user')); // Reject on network error
      }
    });
  
    // Use toast.promise to handle pending, success, and error states
    toast.promise(deleteUserPromise, {
      pending: 'Deleting user...',
      success: 'User deleted successfully 👌',
      error: {
        render({ data }) {
          return data.message || 'Failed to delete user';
        }
      }
    }).finally(() => {
      setDeleteText("Delete"); // Revert button text after operation
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
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return { success: false, message: 'An error occurred while adding the affiliate.' };
    }
  };

  
  return (
    <div className='affiliateUsersWrapper'>
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '16px', left: '17%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
      <h1 className='thirdHeadingOne'>Affiliate Users</h1>

      <div className='searcDivAffiliate'> 
        <input
          type="text"
          placeholder='Affiliate Search'
          value={searchQuery}
          onChange={handleSearch}
        />
        <div className='searchDivPartTwo'>
        <h1
            onClick={() => setAddAffiliatePopup(true)}
           >
            Add
          </h1>
         
          <h1
            onClick={() => handleFilter('Approved')}
            className={filterStatus === 'Approved' ? 'activeFilter' : ''}
          >
            Approved
          </h1>
         
          <h1
            onClick={() => handleFilter('Pending')}
            className={filterStatus === 'Pending' ? 'activeFilter' : ''}
          >
            Pending
          </h1>

          
          <h1 onClick={handleNavigation} style={{ cursor: 'pointer' }}>
      Admin Records
    </h1>
    
    <h1 onClick={() => router.push('/administration/payouts')} style={{ cursor: 'pointer' }}>
      Payouts
    </h1>
    
        </div>
      </div>

      <div className='userItemsParent'>
        <div className='userItemsWrapper'>
          <div className='userItemsHeader'>
           <h1>Profile</h1>
            <h1>First Name</h1>
            <h1>Last Name</h1>
            <h1>Status</h1>
          <h1>Distinction</h1>
            <h1>View</h1>
            <h1>Delete</h1>
          </div>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div className='userItem' key={user._id}>
               <img src={user.profileUrl} />
                <h1>{user.firstName}</h1>
                <h1>{user.lastName}</h1>
                <h1>{user.verified ? 'Approved' : 'Pending'}</h1>
                <button
  className='addDistinctionBtn'
  onClick={() => {
    setDistinctionAffiliateId(user._id);
    setRewardTitle(user.rewardTitle || '');
    setRewardImage(null);
    setShowDistinctionPopup(true);
  }}
>
  {user.rewardTitle ? 'Distinction Added' : 'Add Distinction'}
</button>

                <button className='viewButton' onClick={() => handleViewUserDetails(user)}>View</button>
                <button className='deleteButton' onClick={() => handleDeleteUser(user._id)}>{deleteText}</button>
              </div>
            ))
          ) : (
            <div className='noResults'>No users found.</div>
          )}
        </div>
      </div>

{showDistinctionPopup && (
  <div className="distinctionPopup-overlay">
    <div className="distinctionPopup-modal">
      <h2>Add Distinction</h2>
      <label>Reward Title:</label>
      <input
        type="text"
        value={rewardTitle}
        onChange={(e) => setRewardTitle(e.target.value)}
        required
      />

      <label>Reward Image:</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setRewardImage(e.target.files[0])}
        required
      />

      <div className="distinctionPopup-actions">
        <button onClick={() => setShowDistinctionPopup(false)}>Cancel</button>
       <button onClick={uploadDistinction}>Submit</button>
       </div>
    </div>
  </div>
)}


      {addAffiliatePopup && (
  <div className="Popup styledPopup">
    <div className="popup-content">
      <h1>Add New Affiliate</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true); // Set loading state to true
          const formData = new FormData(e.target);
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
            setAddAffiliatePopup(false); // Close the popup
          } else {
            alert(`Error: ${result.message}`);
          }
          setLoading(false); // Reset loading state
        }}
      >
        <div className="form-row">
          <label htmlFor="firstName">First Name:</label>
          <input type="text" name="firstName" id="firstName" required />
        </div>
        <div className="form-row">
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" name="lastName" id="lastName" required />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" id="email" required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" id="password" required />
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding please wait...' : 'Add Affiliate'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setAddAffiliatePopup(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}


    </div>
  );
};

export default AffiliateUsers;
