import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AffiliateAddNewMatch from './AffiliateAddNewMatch';
import AffiliateMatchDetails from './AffiliateMatchDetails';
import { fetchMatches } from '../../Redux/matchSlice';
import Image from 'next/image';
import { FiCheck, FiCode, FiCopy } from 'react-icons/fi';

const MAX_CARDS = 5;

const AffiliateDashboard = () => {
  const dispatch = useDispatch();
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  const [shadowMatchId, setShadowMatchId] = useState(null);
  const [promoMatchDetails, setPromoMatchDetails] = useState({ matchId: null, affiliateId: null });
  const [promoMatches, setPromoMatches] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userDetails, setUserDetails] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [promoStartIndex, setPromoStartIndex] = useState(0);
  const [promotedStartIndex, setPromotedStartIndex] = useState(0);

  // Always scroll on shadow match change
  useEffect(() => {
    if (shadowMatchId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [shadowMatchId]);

  // Fetch matches on load
  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  // Fetch affiliate users if popup is shown
  useEffect(() => {
    if (showPopup && affiliate?.usersJoined?.length) {
      fetch("https://fantasymmadness-game-server-three.vercel.app/users")
        .then((res) => res.json())
        .then((data) => {
          const matchedUsers = affiliate.usersJoined.map((affiliateUser) => {
            const matchedUser = data.find((user) => user._id === affiliateUser.userId);
            return { ...matchedUser, joinedAt: affiliateUser.joinedAt };
          });
          setUserDetails(matchedUsers);
        })
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [showPopup, affiliate]);

  // Fetch promo matches
  useEffect(() => {
    const fetchPromoMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/shadow');
        if (!response.ok) throw new Error('Failed to fetch promo matches');
        const data = await response.json();
        setPromoMatches(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPromoMatches();
  }, []);

  // Scroll on promo match click
  useEffect(() => {
    if (promoMatchDetails.matchId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [promoMatchDetails.matchId]);

  // Don't render until affiliate is ready
  if (!affiliate) return <div>Loading...</div>;

  // Handlers
  const handleShadowMatchClick = (matchId) => {
    setShadowMatchId(matchId);
  };

  const handlePromoMatchClick = (matchId, affiliateId) => {
    setPromoMatchDetails({ matchId, affiliateId });
  };

  const handleCopy = async (e, match, affiliate) => {
    e.stopPropagation();
    try {
      if (match && affiliate) {
        const fullName = `${affiliate.firstName} ${affiliate.lastName}`;
        const encodedMatchName = encodeURIComponent(match.matchName);
        const encodedFullName = encodeURIComponent(fullName);

        const url = `https://fantasymmadness.com/shadow/${encodedMatchName}/${encodedFullName}`;
        await navigator.clipboard.writeText(url);

        setCopiedId(match._id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Match filtering
  const promotionFights = promoMatches.filter(
    (match) =>
      match.matchType === "SHADOW" &&
      !match.AffiliateIds.some((affiliateObj) => affiliateObj.AffiliateId === affiliate._id.toString())
  );

  const promotedFights = promoMatches.filter((match) =>
    match.AffiliateIds.some(
      (affiliateObj) =>
        affiliateObj.AffiliateId === affiliate._id.toString() &&
        matches.some((m) => m._id === affiliateObj.matchId && m.matchShadowOpenStatus === "open")
    )
  );

  // Pagination handlers
  const handlePromoNext = () => {
    if (promoStartIndex + MAX_CARDS < promotionFights.length) {
      setPromoStartIndex(promoStartIndex + MAX_CARDS);
    }
  };

  const handlePromoPrev = () => {
    if (promoStartIndex > 0) {
      setPromoStartIndex(promoStartIndex - MAX_CARDS);
    }
  };

  const handlePromotedNext = () => {
    if (promotedStartIndex + MAX_CARDS < promotedFights.length) {
      setPromotedStartIndex(promotedStartIndex + MAX_CARDS);
    }
  };

  const handlePromotedPrev = () => {
    if (promotedStartIndex > 0) {
      setPromotedStartIndex(promotedStartIndex - MAX_CARDS);
    }
  };

  // Conditional rendering
  if (promoMatchDetails.matchId) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left dashboard-arrow-circle"
          aria-hidden="true"
          onClick={() => setPromoMatchDetails({ matchId: null, affiliateId: null })}
        ></i>
        <AffiliateMatchDetails
          matchId={promoMatchDetails.matchId}
          affiliateId={promoMatchDetails.affiliateId}
        />
      </>
    );
  }

  if (shadowMatchId) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left dashboard-arrow-circle"
          aria-hidden="true"
          onClick={() => setShadowMatchId(null)}
        ></i>
        <AffiliateAddNewMatch matchId={shadowMatchId} />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="promotional-container-affiliate-dashboard">
        <section className="affiliate-stats-section">
          <div className="stats-cards-wrap">
            <div className="stat-card"><h1>Your Balance</h1><h2>${affiliate.tokens}</h2></div>
            <div className="stat-card"><h1>Promotion Views</h1><h2>{affiliate.totalViews}</h2></div>
            <div className="stat-card"><h1>League Members</h1><h2>{affiliate.usersJoined.length}</h2></div>
            <div className="stat-card"><h1>Total Promotions</h1><h2>{matches.filter(m => m.affiliateId === affiliate?._id).length}</h2></div>
          </div>
       
        </section>
        
        <section className="affiliate-dashboard-fights">
          <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519558/home/e0ussa6oqjjgbzbdxl0h.png" alt="fighter" className='section-fighter' />
          <div className="fights-div-promotion">
            <div className='fights-grid-affiliate'>

              {/* Promotion Fights */}
              <div className="column one">
                <div className="promotion-container">
                  <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519300/home/n9m6d30myiherfs0ico2.png" alt="Background" className="promotion-bg" />
                  <h1 className="promotion-heading">Shadow Templates</h1>
                </div>

                {promotionFights.slice(promoStartIndex, promoStartIndex + MAX_CARDS).map((match, index) => (
                  <div className='fight-card' key={index} onClick={() => handleShadowMatchClick(match._id)}>
                    <div className='fight-date'><span className='date'>{promoStartIndex + index + 1}</span></div>
                    <div className='fight-info'><h2>{match.matchFighterA.split(' ')[0]} Vs {match.matchFighterB.split(' ')[0]}</h2>
                    <p>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} | Max Rounds: {match.maxRounds}</p>
                    </div>
                  </div>
                ))}

                <div className='dashboard-backward-forward-buttons'>
                  {promoStartIndex > 0 && <i className="fa fa-chevron-left left-icon" onClick={handlePromoPrev}></i>}
                  {promoStartIndex + MAX_CARDS < promotionFights.length && <i className="fa fa-chevron-right right-icon" onClick={handlePromoNext}></i>}
                </div>
              </div>

              {/* Promoted Fights */}
              <div className="column two">
                <div className="promotion-container">
                  <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519300/home/n9m6d30myiherfs0ico2.png" alt="Background" className="promotion-bg" />
                  <h1 className="promotion-heading">Promoted Fights</h1>
                </div>

                {promotedFights.slice(promotedStartIndex, promotedStartIndex + MAX_CARDS).map((match, index) => (
                  <div className='fight-card' key={index} onClick={() => handlePromoMatchClick(match._id, affiliate._id)}>
                    <div className='fight-date'><span className='date'>{promotedStartIndex + index + 1}</span></div>
                    <div className='fight-info'><h2>{match.matchFighterA.split(' ')[0]} Vs {match.matchFighterB.split(' ')[0]}</h2>
                      <p>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} | Max Rounds: {match.maxRounds}</p>
        <button
  className="copy-button"
  onClick={(e) => handleCopy(e, match, affiliate)}
>
  {copiedId === match._id ? (
    <FiCheck className="copy-icon" />
  ) : (
    <FiCopy className="copy-icon" />
  )}
</button>


                    </div>
                  </div>
                ))}

                <div className='dashboard-backward-forward-buttons'>
                  {promotedStartIndex > 0 && <i className="fa fa-chevron-left left-icon" onClick={handlePromotedPrev}></i>}
                  {promotedStartIndex + MAX_CARDS < promotedFights.length && <i className="fa fa-chevron-right right-icon" onClick={handlePromotedNext}></i>}
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AffiliateDashboard;
