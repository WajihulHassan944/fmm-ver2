import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const AffiliateLeague = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const [userDetails, setUserDetails] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = isMobile ? 2 : 4;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!affiliate) return;
    fetch('https://fantasymmadness-game-server-three.vercel.app/users')
      .then((response) => response.json())
      .then((data) => {
        const matchedUsers = affiliate.usersJoined.map((affiliateUser) => {
          const matchedUser = data.find(
            (user) => user._id === affiliateUser.userId
          );
          return {
            ...matchedUser,
            joinedAt: affiliateUser.joinedAt,
          };
        });
        setUserDetails(matchedUsers);
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, [affiliate]);

  if (!affiliate) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(userDetails.length / itemsPerPage);
  const paginatedUsers = userDetails.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="leagues-members-wrapper">
      <div className="users-of-leagues">
        {paginatedUsers.map((user, index) => (
          <div className="user-league-wrap" key={index}>
            <div className="member-rank">{index + 1 + currentPage * itemsPerPage}</div>
            <div className="member-detail">
              <h1>
                {user.firstName} {user.lastName}
              </h1>
              <h2>Joined on {new Date(user.joinedAt).toLocaleDateString()}</h2>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="dashboard-backward-forward-buttons league-backward-forward-buttons">
          {currentPage > 0 && (
            <i className="fa fa-chevron-left left-icon" onClick={handlePrev}></i>
          )}
          {currentPage < totalPages - 1 && (
            <i className="fa fa-chevron-right right-icon" onClick={handleNext}></i>
          )}
        </div>
      )}
    </div>
  );
};

export default AffiliateLeague;
