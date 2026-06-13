import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { fetchMatches } from '../../Redux/matchSlice';

const FightLeaderboard = ({ matchId }) => {
  const [scores, setScores] = useState([]);
  const [users, setUsers] = useState([]);
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = matches.find((m) => m._id === matchId);
  const [refreshed, setRefreshed] = useState(false);
  const dispatch = useDispatch();




  const fetchLeaderboardData = () => {

    setRefreshed(true);

    fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores')
      .then(response => response.json())
      .then(data => setScores(data.filter(score => score.matchId === matchId)))
      .catch(error => console.error('Error fetching scores:', error));

    fetch('https://fantasymmadness-game-server-three.vercel.app/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
      dispatch(fetchMatches());
      
      setTimeout(() => setRefreshed(false), 3000);

  };





  const getRefreshInterval = () => {
    const category = match.matchCategoryTwo || match.matchCategory;
    switch (category) {
      case 'boxing': 
      return 180000;
      case 'kickboxing':
        return 180000; // 3 minutes in milliseconds
      case 'mma':
        return 300000; // 5 minutes in milliseconds
      case 'bare-knuckle':
        return 120000; // 2 minutes in milliseconds
      default:
        return 60000; // Default to 1 minute
    }
  };

  
  useEffect(() => {
    dispatch(stopMusic());

    // Initial fetch
    fetchLeaderboardData();

    // Set interval for refreshing leaderboard
    const interval = getRefreshInterval();
    const refreshTimer = setInterval(fetchLeaderboardData, interval);

    return () => {
      clearInterval(refreshTimer);
      dispatch(playMusic());
    };
  }, [matchId, dispatch]);



  const calculatePoints = (userPrediction, fighterOneStats, fighterTwoStats) => {
    let totalScore = 0;

    userPrediction.forEach((roundPrediction, index) => {
        const fighterOneRound = fighterOneStats[index];
        const fighterTwoRound = fighterTwoStats[index];

        if (!fighterOneRound || !fighterTwoRound || !roundPrediction) return;

        // For Boxing
        if (match.matchCategory === 'boxing') {
            // Fighter One Predictions
            // Head Punches (HP)
            if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.HP) {
                totalScore += roundPrediction.hpPrediction1;
            }

            // Body Punches (BP)
            if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.BP) {
                totalScore += roundPrediction.bpPrediction1;
            }

            // Total Punches (TP)
            if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.TP) {
                totalScore += roundPrediction.tpPrediction1;
            }

            // Round Winner (RW)
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                totalScore += roundPrediction.rwPrediction1;
            }

            // Knock Out (KO)
            if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) {
                totalScore += fighterOneRound.KO;
            }

            // Fighter Two Predictions
            // Head Punches (HP)
            if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.HP) {
                totalScore += roundPrediction.hpPrediction2;
            }

            // Body Punches (BP)
            if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.BP) {
                totalScore += roundPrediction.bpPrediction2;
            }

            // Total Punches (TP)
            if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.TP) {
                totalScore += roundPrediction.tpPrediction2;
            }

            // Round Winner (RW)
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                totalScore += roundPrediction.rwPrediction2;
            }

            // Knock Out (KO)
            if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) {
                totalScore += fighterTwoRound.KO;
            }

        // For MMA
        } else if (match.matchCategory === 'mma') {
            // Fighter One Predictions
            // Strikes (ST)
            if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.ST) {
                totalScore += roundPrediction.hpPrediction1;
            }

            // Kicks (KI)
            if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.KI) {
                totalScore += roundPrediction.bpPrediction1;
            }

            // Knockdowns (KN)
            if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.KN) {
                totalScore += roundPrediction.tpPrediction1;
            }

            // Elbow Strikes (EL)
            if (roundPrediction.elPrediction1 !== null && roundPrediction.elPrediction1 <= fighterOneRound.EL) {
                totalScore += roundPrediction.elPrediction1;
            }

            // Round Winner (RW)
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                totalScore += roundPrediction.rwPrediction1;
            }

            // Knock Out (KO)
            if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) {
                totalScore += fighterOneRound.KO;
            }

            // Fighter Two Predictions
            // Strikes (ST)
            if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.ST) {
                totalScore += roundPrediction.hpPrediction2;
            }

            // Kicks (KI)
            if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.KI) {
                totalScore += roundPrediction.bpPrediction2;
            }

            // Knockdowns (KN)
            if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.KN) {
                totalScore += roundPrediction.tpPrediction2;
            }

            // Elbow Strikes (EL)
            if (roundPrediction.elPrediction2 !== null && roundPrediction.elPrediction2 <= fighterTwoRound.EL) {
                totalScore += roundPrediction.elPrediction2;
            }

            // Round Winner (RW)
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                totalScore += roundPrediction.rwPrediction2;
            }

            // Knock Out (KO)
            if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) {
                totalScore += fighterTwoRound.KO;
            }
        }
    });

    return totalScore;
};


const getYouTubeEmbedUrl = (url) => {
  const videoId = url.split('youtu.be/')[1]?.split('?')[0];
  return `https://www.youtube.com/embed/${videoId}`;
};
const renderLeaderboardItems = () => {
  return scores
    .map((score) => {
      const user = users.find(u => u._id === score.playerId);
      if (!user) return null;

      const totalPoints = match.matchCategory === 'boxing'
        ? calculatePoints(score.predictions, match.BoxingMatch.fighterOneStats, match.BoxingMatch.fighterTwoStats, 'boxing')
        : calculatePoints(score.predictions, match.MMAMatch.fighterOneStats, match.MMAMatch.fighterTwoStats, 'mma');

      return { user, totalPoints };
    })
    .filter(item => item !== null) // Remove null values
    .sort((a, b) => b.totalPoints - a.totalPoints) // Sort by totalPoints (descending)
    .map((item, index) => (
      <div className='leaderboardItemUpdated' key={index}>
        <div className='leaderboard-item-imageUpdated'>
          <img src={item.user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png"} alt={item.user.firstName} />
        </div>
        <h1>{item.user.firstName} <span className='toRemove'>{item.user.lastName}</span></h1>
        <h1>Points {item.totalPoints}</h1>
        <h1>#{index + 1}</h1>
      </div>
    ));
};
    
  return (
    <div className='fightLeaderboardUpdated'>
      <div className='fightDetails global-leaderboard'>
        <div className='member-header'>
          <div className='member-header-image'>
            <img src={user.profileUrl} alt="Logo" data-aos="zoom-in" />
          </div>
          <h3 data-aos="zoom-in"><span className='toRemove'>Member Name -</span> {user.firstName} {user.lastName}</h3>
          <h3 data-aos="zoom-in"><span className='toRemove'>Current</span> Plan: {user.currentPlan}</h3>
        </div>

          <div className='totalPointsUpdatedTwo'>
            <h1>
              {match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} Fight 
            </h1>
            <h2>{match.matchType} &nbsp; Pot: {match.pot} &nbsp;Players: {match.userPredictions.length}</h2>
          </div>
          
         
        <div className="videoWrapperUpdatedTwo">
      <iframe
        src={getYouTubeEmbedUrl(match.matchVideoUrl)}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        
      ></iframe>
    </div>


        <div className='fightLeaderboardUpdatedTwoParent'>
         
         
            
            
              <div className='imgWrapFightsUpdatedTwo itemImgOne'>
                <img src={match.fighterAImage} alt={match.matchFighterA} />
                <h1>{match.matchFighterA}</h1>
            
              </div>

              <div className='itemThree'>
                <h1>VS</h1>
            
              </div>

              <div className='imgWrapFightsUpdatedTwo itemImgTwo' >
                <img src={match.fighterBImage}  alt={match.matchFighterB} />
                <h1>{match.matchFighterB}</h1>
          
              </div>
          
          
          <div className='leaderboardItemsWrap leaderboardItemsWrapUpdatedTwo'>

            {renderLeaderboardItems()}
          
          </div></div>
      </div>
    </div>
  );
};

export default FightLeaderboard;
