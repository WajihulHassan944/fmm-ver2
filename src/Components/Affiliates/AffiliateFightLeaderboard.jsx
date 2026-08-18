import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const AffiliateFightLeaderboard = ({ matchId }) => {
    const [scores, setScores] = useState([]);
    const [users, setUsers] = useState([]);
    const matches = useSelector((state) => state.matches.data);
    const match = matches.find((m) => m._id === matchId);

    const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
    useEffect(() => {
      // Hide the back arrow from the dashboard
      const dashboardArrow = document.querySelector('.affiliateDashboardIconArrow');
      if (dashboardArrow) {
        dashboardArrow.style.display = 'none';
      }
    
      // Cleanup function to restore the arrow when FightCosting unmounts
      return () => {
        if (dashboardArrow) {
          dashboardArrow.style.display = 'block';
        }
      };
    }, []);
    
    
    useEffect(() => {
      fetch(buildPublicApiUrl('/api/scores', { matchId }))
        .then(response => response.json())
        .then(data => setScores(data.filter(score => score.matchId === matchId))) // Filter scores by matchId
        .catch(error => console.error('Error fetching scores:', error));
  
      fetch(buildPublicApiUrl('/users'))
        .then(response => response.json())
        .then(data => setUsers(data))
        .catch(error => console.error('Error fetching users:', error));
    }, [matchId]);
  
    
  
  
  
  
    if (!affiliate) {
        return <div>Loading...</div>;
      }
    
  
  
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
  
  
  
    const renderLeaderboardItems = () => {
    
      return scores.map((score, index) => {
        const user = users.find(u => u._id === score.playerId);
        if (!user) return null;
    
        const totalPoints = calculatePoints(score.predictions, match.BoxingMatch.fighterOneStats, match.BoxingMatch.fighterTwoStats);
    
        return (
          <div className='leaderboardItem' key={index}>
            <div className='leaderboard-item-image'><img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png"} alt={user.firstName} /></div>
            <h1>{user.firstName} <span className='toRemove'>{user.lastName}</span></h1>
            <h1 className='toRemove'>#RW</h1> <h1 className='toRemove'>#KO</h1>
            <h1>Points {totalPoints}</h1>
            <h1>#{index + 1}</h1>
          </div>
        );
      });
    };
      
    return (
      <div className='fightLeaderboard'>
        <div className='fightDetails global-leaderboard'>
          <div className='member-header'>
            <div className='member-header-image'>
              <img src={affiliate.profileUrl} alt="Logo" />
            </div>
            <h3><span className='toRemove'>Affiliate Name -</span> {affiliate.firstName} {affiliate.lastName}</h3>
            <h3>Users <span className="toRemove"> in my League</span> : {affiliate.usersJoined.length}</h3>
          </div>
  
          <div className='fightwalletWrap'>
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
  
export default AffiliateFightLeaderboard
