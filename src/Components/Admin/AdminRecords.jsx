import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { fetchMatches } from '@/Redux/matchSlice';

const AdminRecords = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const router = useRouter();
    const [adminTokens, setAdminTokens] = useState([]);
  const [affiliates, setAffiliates] = useState([]);

  // Fetch admin tokens from API using fetch
  useEffect(() => {
    const fetchAdminTokens = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/admin-tokens');
        const data = await response.json();
        setAdminTokens(data.adminTokens);
      } catch (error) {
        console.error('Error fetching admin tokens:', error);
      }
    };
    if(!matches){
        return <p>Loading...</p>;
    }
    const fetchAffiliates = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
        const data = await response.json();
        setAffiliates(data);
      } catch (error) {
        console.error('Error fetching affiliates:', error);
      }
    };

    fetchAdminTokens();
    fetchAffiliates();
  }, []);

  // Fetch matches from Redux
  useEffect(() => {
    dispatch(fetchMatches());
  }, [dispatch]);

  // Find affiliate details based on affiliateId
  const getAffiliateName = (affiliateId) => {
    const affiliate = affiliates.find((affiliate) => affiliate._id === affiliateId);
    return affiliate ? `${affiliate.firstName} ${affiliate.lastName}` : 'Affiliate not found';
  };

  return (
    <div className="prevMatches">
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
      <div className="adminWrapper">
        <div className="homeSecond" style={{ background: 'transparent' }}>
          <h1 className="second-main-heading">Your Profit Records</h1>
          <div className="fightswrap">
            {adminTokens.map((tokenData) => {
              const match = matches.find((match) => match._id === tokenData.matchId);
              return (
                <div key={tokenData._id} className="fightItem">
                  <div className="fightItemOne">
                    <div className="transformed-div">
                      <h2 style={{ fontSize: '17px', fontFamily: 'arial', marginLeft: '2%' }}>
                        {tokenData.matchName}
                      </h2>
                    </div>
                    <div className="transformed-div-two">
                      <div className="transformed-div-two-partOne">
                      <h1>  Total Profit: {Number(tokenData.tokens) + Number(tokenData.affiliateRewarded)}</h1>
                        
                        <h1>Profit Earned</h1>
                        <h1>${tokenData.tokens}</h1>
                      </div>
                      <div className="transformed-div-two-partTwo">
                        <p>{new Date(tokenData.createdAt).toLocaleDateString()}</p>
                       
                        {match && (
                          <h1>Affiliate: {getAffiliateName(match.affiliateId)} ({tokenData.affiliateRewarded})</h1>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecords;
