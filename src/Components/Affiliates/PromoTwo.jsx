import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
const PromoTwo = ({matchId , affiliateId}) => {
    const dispatch = useDispatch();
      const [affiliate, setAffiliate] = useState(null);
   
    const matches = useSelector((state) => state.matches.data);
    const match = matches.find((m) => m.shadowFightId === matchId && m.affiliateId === affiliateId);
       
    const matchStatus = useSelector((state) => state.matches.status);
    const user = useSelector((state) => state.user);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);


    useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        // Fetch all affiliates from the API
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
        if (!response.ok) {
          throw new Error('Failed to fetch affiliates');
        }

        // Convert response to JSON
        const affiliates = await response.json();

        // Compare each affiliate's ID with the given affiliateId
        const matchedAffiliate = affiliates.find(aff => aff._id === affiliateId);

        // If a matching affiliate is found, update the state
        if (matchedAffiliate) {
          setAffiliate(matchedAffiliate);
        }
      } catch (error) {
        console.error('Error fetching affiliates:', error);
      }
    };

    // Call the function to fetch and compare
    fetchAffiliates();
  }, [affiliateId]); // The effect runs whenever affiliateId changes

    
    useEffect(() => {
      if (matchStatus === 'idle') {
        console.log("Fetching matches...");
        dispatch(fetchMatches());
      } else {
        console.log("Matches already fetched or fetching...");
      }
    }, [matchStatus, dispatch]);
  
    
  if (!affiliate) {
    return <div>Loading...</div>;
  }
    // Handle join league action
    const handleJoinLeague = async () => {
      if (!isAuthenticated) {
        window.open('/login', '_blank'); // Open login page in a new window
        return;
      }
  
      const userId = user._id;
      const userEmail = user.email;
  
      console.log("User attempting to join league:", userId, userEmail);
  
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
  
  
    if (!match) {
      return <p>Loading...</p>;
    }
  
  
    return (
      <div className='fightDetails'>
        <div className='member-header' style={{ marginBottom: '30px' }}>
          <div className='member-header-image'>
            <img src={affiliate.profileUrl} alt="Affiliate" />
          </div>
          <h3>Affiliate Name - {affiliate.firstName} {affiliate.lastName}</h3>
          <h3>Users Joined League: {affiliate.usersJoined.length}</h3>
        </div>
  
        <div className='fightDetailsContainer'>
          <h1 className='fightDetailsContainerFirstHeading'>Fight: <span>{match.matchName}</span></h1>
  
          <div className='fightersImagesInFightDetails'>
            <div className='imgWrapFights'><img src={match.fighterAImage} alt={match.matchFighterA} /></div>
            <h1>VS</h1>
            <div className='imgWrapFights'><img src={match.fighterBImage} alt={match.matchFighterB} /></div>
          </div>
  
          <div className='fightDetailsPot'>
            <h1 style={{ background: '#e90000', padding: '5px 10px', fontSize: '22px' }}>This fight is approved.</h1>
          </div>
  
          <h1 className='fightTypeInFightDetails' style={{ fontSize: '21.5px' }}>
            Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span>
            - <span style={{ color: '#3fd50b' }}>{match.matchType} </span>
            - <span>{match.matchFighterA} </span> VS <span>{match.matchFighterB} </span>
          </h1>
  
          <div className='fightDetailsPot'>
            <h1>POT :</h1>
            <p style={{ color: "#38b90c" }}>{match.pot}</p>
          </div>
  
          <div className='beiginningTimeFight'>
            <h1 style={{ fontSize: '21.5px' }}> {match.matchDate?.split('T')[0]} - </h1>
            {match.matchType === "LIVE" && (
  <p style={{ color: "#38b90c" }}>
    {new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
  </p>
)}
  </div>
  
          <div style={{ width: '100%', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button className='btn-grad promobtn' onClick={handleJoinLeague} style={{width:'200px'}}>Join my league</button>
          </div>
        </div>
      </div>
    );
  };
  

export default PromoTwo
