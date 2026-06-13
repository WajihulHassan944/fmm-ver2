import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import { useRouter } from 'next/router';

const Leagues = () => {
  const user = useSelector((state) => state.user);
  const [affiliates, setAffiliates] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
const router = useRouter();
const [leavingAffiliateId, setLeavingAffiliateId] = useState(null);
  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
        const data = await response.json();
        setAffiliates(data);
      } catch (error) {
        console.error('Error fetching affiliates:', error);
      }
    };
    fetchAffiliates();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Handle join league action
  const handleJoinLeague = async (affiliate) => {
    const userId = user._id;
    const userEmail = user.email;
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userEmail }),
      });

      if (response.ok) {
        alert('Successfully joined the league');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  const handleImageClick = (affiliateId) => {
    const upcoming = matches
      .filter((match) => match.affiliateId === affiliateId && match.matchDate?.split("T")[0] >= today)
      .map((match) => match.matchName);
    setUpcomingMatches(upcoming);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setUpcomingMatches([]);
  };

  const renderAffiliateImage = (affiliate) => {
    const hasUpcomingMatch = matches.some(
      (match) => 
        match.affiliateId === affiliate._id && 
        match.matchDate?.split("T")[0] >= today
    );

    return (
      <div
        className='imgWrapLeague'
        style={{
          position: "absolute",
          top: '-6px',
          left: '-11px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          zIndex: '99999',
          border: hasUpcomingMatch ? '3px solid yellowGreen' : '2px solid #ccc',
          overflow: 'hidden',
          cursor: hasUpcomingMatch ? 'pointer' : 'default'
        }}
        onClick={() => hasUpcomingMatch && handleImageClick(affiliate._id)}
      >
        <img
          src={affiliate.profileUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: '99999' }}
          alt="Logo"
        />
      </div>
    );
  };

  if (!user || !user.firstName) {
    return <div>Loading...</div>;
  }

  return (
    <div className='userdashboard yourFightsWrapper myleagues'>
      <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>

      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl} alt="Logo" data-aos="zoom-in" />
        </div>
        <h3 data-aos="zoom-in"><span className='toRemove'>Member Name:</span> {user.firstName} {user.lastName}</h3>
        <h3 data-aos="zoom-in"><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
      </div>

      <div className='fightsWrap myspecialpromotion' style={{ marginTop: '30px' }}>
        <div className='completedFights fightscontainer'>
          <h1 className='fightsheadingtwo'>Joined Leagues</h1>

   {affiliates.map((affiliate) => {
  const userInLeague = affiliate.usersJoined.some((joinedUser) => joinedUser.userId === user._id);

  if (userInLeague) {
    const handleLeaveLeague = async () => {
      setLeavingAffiliateId(affiliate._id); // start loading
      try {
        const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/remove-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user._id }),
        });

        if (!res.ok) throw new Error('Failed to leave league');

        alert('Successfully left the league');
        window.location.reload(); // Optional: better to update state
      } catch (error) {
        console.error(error);
        alert('An error occurred while trying to leave the league.');
      } finally {
        setLeavingAffiliateId(null); // reset loading
      }
    };

    return (
      <div key={affiliate._id} className="fightItem">
        <div className='fightItemOne leagueFightItem unjoinLeagues' style={{ position: 'relative' }}>
          {renderAffiliateImage(affiliate)}

          <div className="transformed-div">
            <h1 style={{ marginLeft: '30%', fontSize: '20px' }}>
              {affiliate.firstName} {affiliate.lastName}
            </h1>
          </div>

          <div className="transformed-div-two">
            <button
              className='unjoinLeaguebtn'
              onClick={handleLeaveLeague}
              disabled={leavingAffiliateId === affiliate._id}
            >
              {leavingAffiliateId === affiliate._id ? '...' : 'Leave'}
            </button>

            <div className='transformed-div-two-partOne'>
              <h1>Users: {affiliate.usersJoined.length}</h1>
            </div>
            <div className='transformed-div-two-partTwo'>
              <p>
                Joined: {new Date(affiliate.usersJoined.find((joinedUser) => joinedUser.userId === user._id).joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
})}


        </div>

        <div className='pendingFights fightscontainer'>
          <h1 className='fightsheadingthree'>Open Leagues</h1>

          {affiliates.map((affiliate) => {
            const userInLeague = affiliate.usersJoined.some((joinedUser) => joinedUser.userId === user._id);

            if (!userInLeague) {
              return (
                <div key={affiliate._id} className="fightItem">
                  <div className='fightItemOne' style={{position:'relative'}}>
                    {renderAffiliateImage(affiliate)}
                    <div className={`transformed-div`}>
                      <h1 style={{ marginLeft: '30%', fontSize: '20px',  color: '#fff' }}>
                        {affiliate.firstName} {affiliate.lastName}
                      </h1>
                    </div>
                    <div className="transformed-div-two">
                      <div className='transformed-div-two-partOne'>
                        <h1>Users joined: {affiliate.usersJoined.length}</h1>
                      </div>
                      <div className='transformed-div-two-partTwo'>
                        <p onClick={() => handleJoinLeague(affiliate)} style={{color:"blue"}}>Join Now</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              return null;
            }
          })}
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upcoming Matches</h2>
            <ul>
              {upcomingMatches.map((matchName, index) => (
                <li key={index}>{matchName}</li>
              ))}
            </ul>
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leagues;
