
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import PromoTwo from '@/Components/Affiliates/PromoTwo';

const AffiliateAllPromos = ({ affiliate, promoMatches }) => {
  const router = useRouter();
  const [promoMatchDetails, setPromoMatchDetails] = useState({ matchId: null, affiliateId: null });

  if (!affiliate) {
    return <p>Loading...</p>;
  }

  const handlePromoMatchClick = (matchId, affiliateId) => {
    setPromoMatchDetails({ matchId, affiliateId });
  };

  if (promoMatchDetails.matchId) {
    return <PromoTwo matchId={promoMatchDetails.matchId} affiliateId={promoMatchDetails.affiliateId} />;
  }

  return (
    <div className='userdashboard yourFightsWrapper'>
      <div className='member-header' style={{ marginBottom: '20px' }}>
        <div className='member-header-image'>
          <img src={affiliate.profileUrl} alt='Affiliate Logo' />
        </div>
        <h3>Affiliate: {affiliate.firstName} {affiliate.lastName}</h3>
        <h3>Users Joined: {affiliate.usersJoined.length}</h3>
      </div>

      <div className='fightsWrap myspecialpromotion'>
        <div className='pendingFights fightscontainer'>
          <h1 className='fightsheadingthree' style={{ fontSize: '20px' }}>{affiliate.firstName}'s Promotion Fights</h1>
          {promoMatches.length > 0 ? (
            promoMatches.filter(match => 
      match.AffiliateIds.some(affiliateObj => affiliateObj.AffiliateId === affiliate._id.toString())
    ).map((match, index) => (
              <div className='fightItem' key={index} onClick={() => handlePromoMatchClick(match._id, affiliate._id)}>
                <div className='fightersImages'>
                  <div className='fighterOne'><img src={match.fighterAImage} alt={match.matchFighterA} /></div>
                  <div className='fighterTwo'><img src={match.fighterBImage} alt={match.matchFighterB} /></div>
                </div>
                <div className='fightItemOne'>
                  <div className='transformed-div'><h1>{match.matchFighterA} -VS- {match.matchFighterB}</h1></div>
                  <div className='transformed-div-two'>
                    <div className='transformed-div-two-partOne'><h1>Max Rounds: {match.maxRounds}</h1></div>
                    <div className='transformed-div-two-partTwo'><p>{match.matchType} {match.matchCategoryTwo || match.matchCategory}</p></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No promotion fights available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps(context) {
  const { affiliateName } = context.params;
  let affiliate = null;
  let promoMatches = [];

  try {
    // Fetch affiliate data
    const affiliateRes = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliateByName?fullName=${encodeURIComponent(affiliateName)}`);
    if (affiliateRes.ok) {
      affiliate = await affiliateRes.json();
    }

    // Fetch promo matches
    const promoRes = await fetch('https://fantasymmadness-game-server-three.vercel.app/shadow');
    if (promoRes.ok) {
      promoMatches = await promoRes.json();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  return {
    props: { affiliate, promoMatches },
  };
}

export default AffiliateAllPromos;