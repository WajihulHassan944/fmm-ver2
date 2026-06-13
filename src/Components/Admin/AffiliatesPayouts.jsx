import React, { useState, useEffect } from 'react';
import UserDetails from './UserDetails';
import PaymentPopup from './PaymentPopup';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const AffiliatesPayouts = () => {
    const [affiliateUsers, setAffiliateUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedPayout, setSelectedPayout] = useState(null); // State for selected payout
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false); // State to manage popup visibility
    const router = useRouter();    
    const fetchData = async () => {
        try {
            const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
            const data = await response.json();
            setAffiliateUsers(data);
            setFilteredUsers(data); // Initially set filtered users to all data
        } catch (error) {
            console.error('Error fetching affiliate users:', error);
        }
    };

    // Call fetchData initially when the component mounts
    useEffect(() => {
        fetchData();
    }, []);

        
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilter = (status) => {
        setFilterStatus(status);
    };
    
    const handlePayNow = (user, payout) => {
        setSelectedUser(user);
        setSelectedPayout(payout);
        setPopupVisible(true);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
        setSelectedPayout(null); // Reset selected payout
    };

    const handleConfirmPayment = async () => {
        if (selectedUser && selectedPayout) {
            try {
                const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/confirm-payment-affiliate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        affiliateId: selectedUser._id, // Send affiliate ID
                        amount: selectedPayout.amount, // Send the payout amount
                        payoutId: selectedPayout._id, // Send the payout ID
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to process payment');
                }

                const responseData = await response.json();
                console.log('Payment response:', responseData);
                toast.success('Payment processed successfully!');
                await fetchData(); // Refresh data after payment
            } catch (error) {
                console.error('Error processing payment:', error);
                toast.error('Error processing payment. Please try again.');
            }
        } else {
            toast.error('No payout available for this affiliate.');
        }

        setPopupVisible(false);
    };

    if (detailsOpen && selectedUser) {
        return <UserDetails user={selectedUser} />;
    }

    return (
        <div className='affiliateUsersWrapper'>
         <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '16px', left: '17%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
            <h1 className='thirdHeadingOne'>Affiliate Payouts</h1>
            <div className='searcDivAffiliate'>
                <input
                    type="text"
                    placeholder='Payout Search'
                    value={searchQuery}
                    onChange={handleSearch}
                />
                <div className='searchDivPartTwo'>
                <h1
                        onClick={() => handleFilter('All')}
                        className={filterStatus === 'All' ? 'activeFilter' : ''}
                    >
                        All
                    </h1>
                    <h1
                        onClick={() => handleFilter('completed')}
                        className={filterStatus === 'completed' ? 'activeFilter' : ''}
                    >
                        Completed
                    </h1>
                    <h1
                        onClick={() => handleFilter('pending')}
                        className={filterStatus === 'pending' ? 'activeFilter' : ''}
                    >
                        Pending
                    </h1>
                </div>
            </div>
            <div className='userItemsParent'>
                <div className='userItemsWrapper'>
                    <div className='userItemsHeader'>
                        <h1>Profile</h1>
                        <h1>Affiliate Name</h1>
                        <h1>Balance</h1>
                        <h1>Amount</h1>
                        <h1>Status</h1>
                        <h1>Payment</h1>
                    </div>
                    {filteredUsers.length > 0 ? (
    filteredUsers
        .filter(user => {
            // Filter users based on search query
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        })
        .flatMap(user =>
            user.payouts
                .filter(payout => {
                    // Apply filter for pending/completed based on filterStatus
                    if (filterStatus === 'pending') {
                        return payout.status === 'pending';
                    } else if (filterStatus === 'completed') {
                        return payout.status === 'completed';
                    }
                    return true; // If 'All', include all payouts
                })
                .map(payout => (
                    <div className='userItem' key={payout._id}>
                        <img src={user.profileUrl} alt={`${user.firstName} ${user.lastName}`} />
                        <h1>{user.firstName} {user.lastName}</h1>
                        <h1>{user.tokens}</h1>
                        <h1>{payout.amount}</h1> {/* Display payout amount */}
                        <h1>{payout.status}</h1> {/* Display payout status */}
                        <button className='viewButton' 
                            onClick={() => handlePayNow(user, payout)} 
                            disabled={payout.status === 'completed'} // Disable the button if already paid
                        >
                            {payout.status === 'completed' ? 'Paid' : 'Pay Now'}
                        </button>
                    </div>
                ))
        )
) : (
    <div className='noResults'>No users found.</div>
)}

                </div>
            </div>
            {popupVisible && (
                <PaymentPopup 
                    user={selectedUser} 
                    onClose={handleClosePopup} 
                    onConfirm={handleConfirmPayment} 
                    payout={selectedPayout}
                />
            )}
        </div>
    );
};

export default AffiliatesPayouts;
