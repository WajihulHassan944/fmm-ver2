import { fetchMatches } from '@/Redux/matchSlice';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

const PromoAdminPage = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
   
    const matches = useSelector((state) => state.matches.data);
    const matchStatus = useSelector((state) => state.matches.status);
    const match = matches.find((m) => m._id === id);
    
    useEffect(() => {
      if (matchStatus === 'idle') {
        console.log("Fetching matches...");
        dispatch(fetchMatches());
      } else {
        console.log("Matches already fetched or fetching...");
      }
    }, [matchStatus, dispatch]);
  
  
  
    if (!match) {
      console.log("Match not found or still loading...");
      return <p>Loading...</p>;
    }
  
     
    return (
      <div className='fightDetails' style={{paddingBottom:'50px', paddingTop:'150px'}}>
        
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
            <h1 style={{ fontSize: '21.5px' }}> {match.matchDate.split('T')[0]} - </h1>
            <p style={{ color: "#38b90c" }}>{new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          </div>
         
  
  
          </div>
      </div>
    );
  };
  

export default PromoAdminPage
