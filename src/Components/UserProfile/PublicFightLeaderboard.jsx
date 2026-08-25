import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { buildPublicApiUrl } from '@/Utils/publicApi';
const PublicFightLeaderboard = ({ matchId ,name, plan, profileUrl }) => {
   const router = useRouter();
  
    const [scores, setScores] = useState([]);
  const [users, setUsers] = useState([]);
  const matches = useSelector((state) => state.matches.data);
  const match = matches.find((m) => m._id === matchId);

  useEffect(() => {
    fetch(buildPublicApiUrl(`/api/matches/${matchId}/leaderboard`))
      .then(response => response.json())
      // Server-scored: raw picks never reach the browser.
      .then(data => setScores(Array.isArray(data?.leaderboard) ? data.leaderboard : [])) // Filter scores by matchId
      .catch(error => console.error('Error fetching scores:', error));

    fetch(buildPublicApiUrl('/api/public/user-directory'))
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, [matchId]);

  






  // Scoring happens server-side; rows arrive pre-scored and ranked.

  


  const renderLeaderboardItems = () => {
  
    return scores.map((score, index) => {
      const user = { _id: score.userId, firstName: score.firstName, lastName: score.lastName, playerName: score.playerName, profileUrl: score.profileUrl };
      if (!user) return null;
  
      const totalPoints = Number(score.totalPoints || 0);
  
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
