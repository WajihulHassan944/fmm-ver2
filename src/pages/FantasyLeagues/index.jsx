import React, { useEffect, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import styles from './FantasyLeagues.module.css';
import { useSelector } from 'react-redux';
import Login from '@/Components/Login/Login';

const FantasyLeagues = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [users, setUsers] = useState([]);
  const [openCardIds, setOpenCardIds] = useState({});
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [affiliatesRes, usersRes] = await Promise.all([
          fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates'),
          fetch('https://fantasymmadness-game-server-three.vercel.app/users'),
        ]);

        const affiliatesData = await affiliatesRes.json();
        const usersData = await usersRes.json();

        setAffiliates(affiliatesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const toggleDropdown = (id) => {
    setOpenCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getUserInfo = (userId) => {
    return users.find((user) => user._id === userId);
  };

  const hasUserJoined = (affiliate) => {
    return affiliate.usersJoined.some((joinedUser) => joinedUser.userId === user._id);
  };

const [pendingAffiliateJoin, setPendingAffiliateJoin] = useState(null); // to store the league to join after login

useEffect(() => {
  if (isAuthenticated && user?._id && pendingAffiliateJoin) {
    handleJoinLeague(pendingAffiliateJoin);
    setPendingAffiliateJoin(null);
  }
}, [isAuthenticated, user, pendingAffiliateJoin]);

const handleLoginSuccess = () => {
  setRedirectToLogin(false);
 };

const handleJoinBtnClick = (affiliate) => {
  if (!isAuthenticated) {
    setRedirectToLogin(true);
    setPendingAffiliateJoin(affiliate); // save league for post-login
  } else {
    handleJoinLeague(affiliate);
  }
};

  const handleJoinLeague = async (affiliate) => {
    const userId = user._id;
    const userEmail = user.email;

    if (!userId || !userEmail) {
  console.warn("User info not available yet");
  return;
}
console.log('userid    is', userId);
console.log("affiliate is", affiliate);
    try {
      const response = await fetch(
        `https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, userEmail }),
        }
      );

      if (response.ok) {
        alert('Successfully joined the league');
        // Refresh league data
        const updatedRes = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
        const updatedAffiliates = await updatedRes.json();
        setAffiliates(updatedAffiliates);
      } else {
        const data = await response.json();
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  if (redirectToLogin) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={styles.wrapperAffLeaguesPublic}>
      <h1 className={styles.title}>FANTASY LEAGUES</h1>
      <div className={styles.grid}>
        {affiliates.map((affiliate) => {
          const joined = isAuthenticated && hasUserJoined(affiliate);

          return (
            <div className={styles.card} key={affiliate._id}>
             {affiliate.rewardTitle && (
    <div className={styles.rewardBadgeNew}>
      <img src={affiliate.rewardImageUrl} alt="Reward" />
      <span>{affiliate.rewardTitle}</span>
    </div>
  )}
              <div className={styles.cardContent}>
                <div className={styles.logoWrapper}>
                  <img
                    src={affiliate.profileUrl}
                    alt={affiliate.playerName}
                    className={styles.logo}
                  />
                </div>
                <div  className={`${styles.details} ${
      affiliate.rewardTitle ? styles.hasReward : ''
    }`}>
                  <div className={styles.name}>
                    {affiliate.firstName} {affiliate.lastName}
                  </div>
                  <div className={styles.description}>
                    Compete in this exciting fantasy league!
                  </div>
                  <div className={styles.meta}>
                    <span
                      className={styles.members}
                      onClick={() => toggleDropdown(affiliate._id)}
                    >
                      <FaUser className={styles.icon} />
                      {affiliate.usersJoined.length} members
                    </span>
                    <button
                      className={styles.joinButton}
                      onClick={() => handleJoinBtnClick(affiliate)}
                      disabled={joined}
                    >
                      {joined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
              {openCardIds[affiliate._id] && (
                <div className={styles.userIds}>
                  {affiliate.usersJoined?.length > 0 ? (
                    affiliate.usersJoined.map((user) => {
                      const userInfo = getUserInfo(user.userId);
                      return userInfo ? (
                        <div key={userInfo._id} className={styles.userItem}>
                          <img
                            src={userInfo.profileUrl}
                            alt={userInfo.firstName}
                            className={styles.userImage}
                          />
                          <span>
                            {userInfo.firstName} {userInfo.lastName}
                          </span>
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div>No members joined.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FantasyLeagues;
