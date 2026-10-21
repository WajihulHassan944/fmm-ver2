import React, { useState, useEffect } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import { buildPublicApiUrl } from '@/Utils/publicApi';
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
            const response = await fetch(buildPublicApiUrl('/api/admin/affiliate-payouts?status=all'), { headers: adminHeaders() });
            if (!response.ok) throw new Error('Could not load affiliate payout ledger');
            const data = await response.json();
            const rows = Array.isArray(data.payouts) ? data.payouts : [];
            setAffiliateUsers(rows);
            setFilteredUsers(rows);
        } catch (error) {
            console.error('Error fetching affiliate payout ledger:', error);
            toast.error('Could not load the payout ledger.');
        }
    };

    const handleSearch = (e) => setSearchQuery(e.target.value);
    const handleFilter = (status) => setFilterStatus(status);
    const handlePayNow = (payout) => {
        if (payout.status !== 'pending') return;
        setSelectedUser({ _id: payout.affiliateId, firstName: payout.name, lastName: '', email: payout.email, preferredPaymentMethod: payout.preferredPaymentMethod || 'Not specified', preferredPaymentMethodValue: '' });
        setSelectedPayout(payout);
        setPopupVisible(true);
    };
    const handleClosePopup = () => {
        setPopupVisible(false);
        setSelectedPayout(null);
    };
    const handleConfirmPayment = async () => {
        if (!selectedPayout || selectedPayout.status !== 'pending') return;
        const reference = window.prompt('Only mark paid AFTER sending the money. Enter the real payment confirmation/reference (Cancel if unpaid):');
        if (!reference || !reference.trim()) return;
        try {
            const response = await fetch(
                buildPublicApiUrl(`/api/admin/affiliate-payouts/${encodeURIComponent(selectedPayout.affiliateId)}/${selectedPayout.payoutIndex}/approve`),
                { method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ reference: reference.trim().slice(0, 300) }) }
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Payout confirmation failed');
            toast.success(result.message || 'Payout marked paid');
            await fetchData();
        } catch (error) {
            toast.error(error.message || 'Payout confirmation failed');
        } finally {
            handleClosePopup();
        }
    };

    // Call fetchData initially when the component mounts
    useEffect(() => {
        fetchData();
    }, []);

        
    if (detailsOpen && selectedUser) {
        return <UserDetails user={selectedUser} />;
    }

    return (
        <div className='affiliateUsersWrapper'>
         <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.back()} // Go back to the previous page
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
                    {filteredUsers.filter(payout => {
                        const name = String(payout.name || '').toLowerCase();
                        const matchSearch = name.includes(searchQuery.toLowerCase());
                        const matchStatus = filterStatus === 'All' || (filterStatus === 'completed' ? payout.status === 'paid' : payout.status === filterStatus);
                        return matchSearch && matchStatus;
                    }).map(payout => (
                        <div className='userItem' key={String(payout.payoutId || payout.affiliateId + ':' + payout.payoutIndex)}>
                            <div>{payout.name || 'Affiliate'}</div>
                            <h1>{payout.name || 'Affiliate'}</h1>
                            <h1>{Number(payout.currentBalance || 0).toLocaleString()} FM</h1>
                            <h1>{Number(payout.amount || 0).toLocaleString()} FM</h1>
                            <h1>{payout.status}</h1>
                            <button className='viewButton' onClick={() => handlePayNow(payout)} disabled={payout.status !== 'pending'}>
                                {payout.status === 'paid' ? 'Paid' : payout.status === 'pending' ? 'Mark Paid' : 'Closed'}
                            </button>
                        </div>
                    ))}
                    {!filteredUsers.length && <div className='noResults'>No payout records found.</div>}

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
