import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMatches } from '../../Redux/matchSlice';
import AffiliateFightLeaderboard from './AffiliateFightLeaderboard';

const Promo = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dispatch = useDispatch();
  const { matchName, fullName } = useParams();
  const navigate = useNavigate();

  const [affiliate, setAffiliate] = useState(null);
  const [match, setMatch] = useState(null);
  const [navigateDashboard, setNavigateToDash] = useState(null);

  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (matchStatus === 'idle') {
      console.log("Fetching matches...");
      dispatch(fetchMatches());
    } else {
      console.log("Matches already fetched or fetching...");
    }
  }, [matchStatus, dispatch]);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Fetch affiliate data based on fullName from URL
  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        console.log("Fetching affiliate data for fullName:", fullName);
        const response = await fetch(
          `https://fantasymmadness-game-server-three.vercel.app/affiliateByName?fullName=${encodeURIComponent(fullName)}`
        );
        console.log("Affiliate API response status:", response.status);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const affiliateData = await response.json();
        console.log("Fetched affiliate data:", affiliateData);
        setAffiliate(affiliateData);
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      }
    };

    if (fullName) {
      fetchAffiliateData();
    } else {
      console.error("Full name is not available");
    }
  }, [fullName]);

  // Find the match associated with the affiliate
  useEffect(() => {
    if (affiliate) {
      console.log("Affiliate data available:", affiliate);
      const affiliateId = affiliate._id;
      const foundMatch = matches.find((m) => m.matchName === matchName && m.affiliateId === affiliateId);
      console.log("Found match:", foundMatch);
      setMatch(foundMatch);
    } else {
      console.log("Waiting for affiliate data...");
    }
  }, [affiliate, matches, matchName]);


  
  // Increment totalViews on component load
  useEffect(() => {
    
    const incrementViews = async () => {
      try {
        await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/incrementViews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };
  
    if (affiliate) {
      incrementViews();
    }
  }, [affiliate]);
  

  // Handle join league action
  const handleJoinLeague = async () => {
    if (!isAuthenticated) {
      window.open('/auth?mode=login&role=player', '_blank'); // Open login page in a new window
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
        navigate('/UserDashboard');

      }
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  if (navigateDashboard) {
    return <AffiliateFightLeaderboard matchId={navigateDashboard} />;
  }

  if (!match) {
    console.log("Match not found or still loading...");
    return <p>Loading...</p>;
  }

  if (!affiliate) {
    console.log("Affiliate not found or still loading...");
    return <div>Loading...</div>;
  }
   
  return (
   <> 
<div className="promotional-updated-design">
		<div className="fighter-images-promotional">
			<div className="img-container"><img src={match.fighterAImage} alt={match.matchFighterA} /></div>
			<div className="img-container"><img src={match.fighterBImage} alt={match.matchFighterB} /></div>
		</div>
		
    <div className="fighters-names">
      <h1>{isMobile ? match.matchFighterA.split(" ")[0] : match.matchFighterA}</h1>
      <h2>VS</h2>
      <h1>{isMobile ? match.matchFighterB.split(" ")[0] : match.matchFighterB}</h1>
    </div><h1 className="category">{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</h1>
		<h1 className="type">{affiliate.firstName}</h1>

<h2 className="round-show">${match.matchTokens} Ticket Hurry Up</h2>	
	
		<div className="title-wrap">
		<img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744522571/home/zn6g3lrpztxemnxzn4ud.png" className="fancy-title-img" />
		<h1 className="fancy-title">POT: ${match.pot}, Max Rounds: {match.maxRounds}</h1>
		</div>
		
		<h3 className="second-last" onClick={handleJoinLeague}>Join {affiliate.firstName}'s league</h3>
		<p className="lastp">Affiliate: {affiliate.firstName} - Free Signup</p>
   </div>

 
    {match.matchPromotionalVideoUrl && (
  <div className="videoContainer">
    <video className="responsiveVideo" controls>
      <source src={match.matchPromotionalVideoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
)}

    </> );
};

export default Promo;
