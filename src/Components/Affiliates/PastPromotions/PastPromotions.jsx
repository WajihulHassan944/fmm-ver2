import React, { useEffect, useState } from 'react';
import { fetchMatches } from '../../../Redux/matchSlice';
import { useDispatch, useSelector } from 'react-redux';


const PastPromotions = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [promoMatches, setPromoMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const fightsPerPage = 5;

  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const dispatch = useDispatch();

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchPromoMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/shadow');
        if (!response.ok) throw new Error('Failed to fetch promo matches');
        const data = await response.json();
        setPromoMatches(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchPromoMatches();
  }, []);

  if (!affiliate) return <div>Loading...</div>;

  // Filter promoted fights
  const promotedFights = promoMatches.filter(match =>
    match.AffiliateIds.some(affiliateObj =>
      affiliateObj.AffiliateId === affiliate._id.toString() &&
      matches.some(m => m._id === affiliateObj.matchId && m.matchShadowOpenStatus === "closed")
    )
  );

  // Pagination Logic
  const totalPages = Math.ceil(promotedFights.length / fightsPerPage);
  const visibleFights = promotedFights.slice(currentPage * fightsPerPage, (currentPage + 1) * fightsPerPage);

  return (
    <div className='users-played-wrapper past-fights-wrapper'>
      <h1 className='past-fights-wrapper-title'>Past</h1>
      <h2 className='past-fights-wrapper-subtitle'>Promoted</h2>
      <h3 className='past-fights-wrapper-sub-sub'>Fights</h3>
      <img src="https://res.cloudinary.com/daflot6fo/image/upload/v1743000731/ua8aa9arayeq0vdw5dpq.png" alt="fighters" className='past-fighters' />

      <div className='past-fights-affiliate-wrapp'>
        {visibleFights.length > 0 ? (
          visibleFights.map(fight => (
            <div key={fight._id} className='past-fights-affiliate-actual'>
              <div className='past-fight-aff-div-outer'>
                <img src={fight.fighterAImage} alt={fight.matchFighterA} className='left-img' />
                <h1>{isMobile ? fight.matchFighterA.split(" ")[0] : fight.matchFighterA}</h1>
              </div>
              <div className='past-fight-aff-div-center'>
                <h2>VS</h2>
              </div>
              <div className='past-fight-aff-div-outer'>
                <img src={fight.fighterBImage} alt={fight.matchFighterB} className='right-img' />
                <h1>{isMobile ? fight.matchFighterB.split(" ")[0] : fight.matchFighterB}</h1>
              </div>
            </div>
          ))
        ) : (
          <h2 style={{ color: "white", textAlign: "center", marginTop: "20px" }}>
            No past promoted fights available.
          </h2>
        )}
      </div>

      {/* Pagination Controls */}
      <div className='dashboard-backward-forward-buttons pastpromos'>
        {currentPage > 0 && (
          <i className="fa fa-chevron-left left-icon" onClick={() => setCurrentPage(currentPage - 1)}></i>
        )}
        {currentPage < totalPages - 1 && (
          <i className="fa fa-chevron-right right-icon" onClick={() => setCurrentPage(currentPage + 1)}></i>
        )}
      </div>
    </div>
  );
}

export default PastPromotions;
