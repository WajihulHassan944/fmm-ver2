import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
const PublicFightLeaderboard = ({ matchId ,name, plan, profileUrl }) => {
   const router = useRouter();
  
    const [scores, setScores] = useState([]);
  const [users, setUsers] = useState([]);
  const matches = useSelector((state) => state.matches.data);
  const match = matches.find((m) => m._id === matchId);

  useEffect(() => {
    fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores')
      .then(response => response.json())
      .then(data => setScores(data.filter(score => score.matchId === matchId))) // Filter scores by matchId
      .catch(error => console.error('Error fetching scores:', error));

    fetch('https://fantasymmadness-game-server-three.vercel.app/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, [matchId]);

  






  const calculatePoints = (userPrediction, fighterOneStats, fighterTwoStats) => {
    let totalScore = 0;
  
    userPrediction.forEach((roundPrediction, index) => {
      const fighterOneRound = fighterOneStats[index];
      const fighterTwoRound = fighterTwoStats[index];
  
      if (!fighterOneRound || !fighterTwoRound || !roundPrediction) return;
  
      // Head Punches (HP) - Fighter One
      if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.HP) {
        totalScore += roundPrediction.hpPrediction1;
      }
  
      // Body Punches (BP) - Fighter One
      if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.BP) {
        totalScore += roundPrediction.bpPrediction1;
      }
  
      // Total Punches (TP) - Fighter One
      if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.TP) {
        totalScore += roundPrediction.tpPrediction1;
      }
  
      // Picking Round Winner (RW) - Fighter One
      if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
        totalScore += roundPrediction.rwPrediction1;
      }
  
      // Knock Out (KO) - Fighter One
      if (roundPrediction.koPrediction1 !== null) {
        if (roundPrediction.koPrediction1 === fighterOneRound.KO) {
          totalScore += fighterOneRound.KO;
        } else {
          totalScore += 0; // 25 points for wrong KO pick
        }
      }
  
      // Head Punches (HP) - Fighter Two
      if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.HP) {
        totalScore += roundPrediction.hpPrediction2;
      }
  
      // Body Punches (BP) - Fighter Two
      if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.BP) {
        totalScore += roundPrediction.bpPrediction2;
      }
  
      // Total Punches (TP) - Fighter Two
      if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.TP) {
        totalScore += roundPrediction.tpPrediction2;
      }
  
      // Picking Round Winner (RW) - Fighter Two
      if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
        totalScore += roundPrediction.rwPrediction2;
      }
  
      // Knock Out (KO) - Fighter Two
      if (roundPrediction.koPrediction2 !== null) {
        if (roundPrediction.koPrediction2 === fighterTwoRound.KO) {
          totalScore += fighterTwoRound.KO;
        } else {
          totalScore += 0; // 25 points for wrong KO pick
        }
      }
    });
  
    return totalScore;
    
  };
  


  const renderLeaderboardItems = () => {
  
    return scores.map((score, index) => {
      const user = users.find(u => u._id === score.playerId);
      if (!user) return null;
  
      const totalPoints = calculatePoints(score.predictions, match.BoxingMatch.fighterOneStats, match.BoxingMatch.fighterTwoStats);
  
      return (
        <div className='leaderboardItem' key={index}>
          <div className='leaderboard-item-image'><img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png"} alt={user.firstName} /></div>
          <h1>{user.firstName} {user.lastName}</h1>
          <h1>#RW</h1> <h1>#KO</h1>
          <h1>Points {totalPoints}</h1>
          <h1>#{index + 1}</h1>
        </div>
      );
    });
  };
    
  return (
    <div className='fightLeaderboard premium-public-leaderboard'>
      <div className='fightDetails global-leaderboard'>
        <div className='member-header'>
          <div className='member-header-image'>
            <img src={profileUrl} alt="Logo" />
          </div>
          <h3>Member Name - {name}</h3>
          <h3>Current plan: {plan}</h3>
        </div>

        <div className='fightwalletWrap' >
          <div className='totalPoints'>
            <h1 className='fightTypeInFightDetails'>
              Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span> - 
              <span style={{color:"#38b90c"}}>{match.matchType} </span> - 
              <span>{match.matchFighterA} </span> VS <span> {match.matchFighterB} </span>
            </h1>
            <h1 style={{textAlign:'left'}}>POT: <span style={{color:"#38b90c"}}>{match.pot}</span> &nbsp;Players: <span style={{color:"#38b90c"}}>{match.userPredictions.length}</span></h1>
          </div>
          
       
        </div>

        <div className='homeThird'>
          <div className='fightersImagesInFightDetails'>
            <div className='flexColumn'>
              <div className='imgWrapFights' style={{border:'none'}}>
                <img src={match.fighterAImage} style={{border:'3px solid blue'}} alt={match.matchFighterA} />
              </div>
              <h1 className='fightTypeInFightDetails'>{match.matchFighterA}</h1>
            </div>

            <h1>VS</h1>

            <div className='flexColumn'>
              <div className='imgWrapFights' style={{border:'none'}}>
                <img src={match.fighterBImage} style={{border:'3px solid red'}} alt={match.matchFighterB} />
              </div>
              <h1 className='fightTypeInFightDetails'>{match.matchFighterB}</h1>
            </div>
          </div>     

          <div className='leaderboardHeading'><h3>Leaderboard</h3></div>
          <div className='controls'><h5 className='active'>All time</h5><h5>Last week</h5> <h5>Last month</h5></div>
          
          <div className='leaderboardItemsWrap'>
            {renderLeaderboardItems()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFightLeaderboard
