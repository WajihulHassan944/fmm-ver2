import React, { useEffect, useState } from 'react';
import VisitorsAnalytics from './VisitorsAnalytics'; 
import { useRouter } from 'next/router';
const Admin = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dashboardCounts, setDashboardCounts] = useState({
    affiliatesCount: 0,
    matchesCount: 0,
    usersCount: 0,
    shadowTemplatesCount: 0,
    totalClicks: 0,
    unreadNotificationsCount: 0, 
  });

  const router = useRouter();
  // Fetch all dashboard counts from the API
  useEffect(() => {
    const fetchDashboardCounts = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/dashboard-counts');
        const data = await response.json();
        setDashboardCounts(data);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      }
    };

    fetchDashboardCounts();
  }, []);

  // Function to reset stats
  const handleResetStats = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/reset-stats', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Stats have been reset successfully.');
        setDashboardCounts((prev) => ({ ...prev, totalClicks: 0 })); // Reset total clicks in the UI
      } else {
        console.error('Failed to reset stats');
        alert('Failed to reset stats');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Error resetting stats');
    }
  };

  // Destructure the counts from the state
  const { affiliatesCount, matchesCount, usersCount, shadowTemplatesCount, totalClicks, unreadNotificationsCount } = dashboardCounts;

  if (showAnalytics) {
    return (
     <>
     {/*
      <i
        className="fa fa-arrow-circle-left shadowFightLibraryIcon"
        aria-hidden="true" onClick={() => setShowAnalytics(null)} style={{background:'#fff', overflow:'hidden', height:'21px', display:'flex',
          justifyContent:'center', alignItems:'center', borderRadius:'50%'
        }}></i>

      */}
      <VisitorsAnalytics
        totalClicks={dashboardCounts.totalClicks}
        onResetStats={handleResetStats}
      />
    </>
    );
  }

  return (
    <div className='adminWrapper' style={{ flexDirection: 'column', gap: '50px' }}>
      <h1 className='frontPageHeading'>Welcome to admin Dashboard</h1>

      <div className='boxesContainer'>
        <div className='boxx totalMatches' onClick={() => router.push('/administration/upcomingFights')}>
          <i className='fa fa-futbol-o'></i>
          <h2>Total Matches</h2>
          <p>{matchesCount}</p> {/* Render total matches */}
        </div>

        <div className='boxx shadowTemplates' onClick={() => router.push('/administration/ShadowFightsLibrary')}>
          <i className='fa fa-clone'></i>
          <h2>Shadow Templates</h2>
          <p>{shadowTemplatesCount}</p> {/* Render shadow templates count */}
        </div>

        <div className='boxx registeredUsers' onClick={() => router.push('/administration/RegisteredUsers')}>
          <i className='fa fa-users'></i>
          <h2>Registered Users</h2>
          <p>{usersCount}</p> {/* Render users count */}
        </div>

        <div className='boxx affiliates' onClick={() => router.push('/administration/AffiliateUsers')}>
          <i className='fa fa-handshake-o'></i>
          <h2>Affiliates</h2>
          <p>{affiliatesCount}</p> {/* Render affiliates count */}
        </div>

        <div className='boxx boxnotifications' onClick={() => router.push('/administration/notifications')}>
          <i className='fa fa-bell-o'></i>
          <h2>Notifications</h2>
          <p>{unreadNotificationsCount}</p> 
        </div>

        <div
          className='boxx visitors'
          onClick={() => setShowAnalytics(true)}
        >
          <i className='fa fa-eye'></i>
          <h2>Visitors</h2>
          <p>{totalClicks}</p> {/* Render total clicks (visitors count) */}
        </div>
      </div>

    </div>
  );
};

export default Admin;
