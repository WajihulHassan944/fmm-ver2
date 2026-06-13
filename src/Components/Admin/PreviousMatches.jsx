import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Popup from './Popup';
import { fetchMatches } from '@/Redux/matchSlice';
import { getWinnerDetails } from '@/CustomFunctions/winnerUtils';
import { useRouter } from 'next/router';

const PreviousMatches = () => {
    const dispatch = useDispatch();
    const matches = useSelector((state) => state.matches.data);
    const [filter, setFilter] = useState('All');
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [winnerDetails, setWinnerDetails] = useState(null);
    const [affiliateTokens, setAffiliateTokens] = useState(0);
    const [matchTokens, setMatchTokens] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMatches, setFilteredMatches] = useState([]);

    const router = useRouter();
        useEffect(() => {
        dispatch(fetchMatches());
    }, [dispatch]);

   
    // Filter matches based on search query and filter selection
    useEffect(() => {
        const lowerCaseQuery = searchQuery.trim().toLowerCase();
        const filtered = matches.filter((match) => {
            const matchDate = new Date(match.matchDate);
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

            if (match.matchStatus !== 'Finished' || matchDate < tenDaysAgo) {
                return false;
            }

            if (filter === 'Rewarded' && match.matchReward !== 'Rewarded') return false;
            if (filter === 'NotRewarded' && match.matchReward !== 'NotRewarded') return false;

            if (lowerCaseQuery) {
                return (
                    match.matchFighterA.toLowerCase().includes(lowerCaseQuery) ||
                    match.matchFighterB.toLowerCase().includes(lowerCaseQuery) ||
                    match.matchDescription?.toLowerCase().includes(lowerCaseQuery) ||
                    match.matchCategory?.toLowerCase().includes(lowerCaseQuery) ||
                    match.matchCategoryTwo?.toLowerCase().includes(lowerCaseQuery) ||
                    match.matchStatus?.toLowerCase().includes(lowerCaseQuery)
                );
            }

            return true;
        });

        setFilteredMatches(filtered);
    }, [matches, searchQuery, filter]);
 
    const handleMatchClick = async (matchId) => {
        const winner = await getWinnerDetails(matchId);
        setWinnerDetails(winner);
        const match = matches.find(m => m._id === matchId);
        setMatchTokens(match.pot);

        // Calculate profit for the affiliate
        const totalUsers = match.userPredictions.filter(u => u.predictionStatus === 'submitted').length;
        const requiredUsers = match.pot / match.matchTokens;
        const totalTokens = totalUsers * match.matchTokens;
        const profit = totalTokens - match.pot;
        const halfProfit = profit > 0 ? profit / 2 : 0;

        setAffiliateTokens(halfProfit);
        setSelectedMatch(matchId);
    };

    const handleClosePopup = () => {
        setSelectedMatch(null);
        setWinnerDetails(null);
        setMatchTokens(null);
        setAffiliateTokens(0);
    };

    const handleRewardTokens = async () => {
        if (winnerDetails) {
            try {
                // Reward the winner tokens
                const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/reward-tokens/${winnerDetails.userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tokens: matchTokens,
                        matchId: selectedMatch,
                    }),
                });
    
                const data = await response.json();
    
                if (data.success) {
                    // Now reward the affiliate half the profit
                    const affiliateId = matches.find(m => m._id === selectedMatch).affiliateId;
                    
                    // Handling the rounding: if half is decimal, one half gets rounded down, other half gets rounded up
                    const halfProfit = affiliateTokens;
                    const affiliateTokenReward = Math.floor(halfProfit); // Round down for affiliate
                    const adminTokenReward = Math.ceil(halfProfit); // Round up for admin
    
                    const affiliateResponse = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/reward-tokens-to-affiliate/${affiliateId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            matchId: selectedMatch,
                            tokens: affiliateTokenReward, // Send rounded down tokens to affiliate
                        }),
                    });
    
                    const affiliateData = await affiliateResponse.json();
    
                    // Now reward admin with the remaining half of the profit
                    const adminResponse = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/reward-tokens-to-admin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            matchId: selectedMatch,
                            matchName: matches.find(m => m._id === selectedMatch).matchFighterA + ' VS ' + matches.find(m => m._id === selectedMatch).matchFighterB,
                            tokens: adminTokenReward, // Send rounded up tokens to admin
                            affiliateRewarded: affiliateTokenReward,
                        }),
                    });
    
                    const adminData = await adminResponse.json();
    
                    if (affiliateData.success && adminData.success) {
                        alert(`Tokens rewarded successfully! Affiliate was rewarded ${affiliateTokenReward} tokens, and Admin was rewarded ${adminTokenReward} tokens.`);
                        setSelectedMatch(null);
                        setWinnerDetails(null);
                        window.location.reload();
                    } else {
                        alert('Failed to reward affiliate or admin tokens.');
                    }
                } else {
                    alert('Failed to reward winner tokens.');
                }
            } catch (error) {
                console.error('Error rewarding tokens:', error);
            } finally {
                handleClosePopup();
            }
        }
    };
    
  
    return (
        <div className='prevMatches'>
         <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
            <div className='adminWrapper'>
                <div className='homeSecond' style={{ background: 'transparent' }}>
                    <h1 className='second-main-heading'>All fights <span className='toRemove'>/ Previous Fights</span></h1>
                    <input
            type="text"
            placeholder='Search here...'
            className='searchbar-fights'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
         
                    <div className='controls'>
                        <h5 className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All</h5>
                        <h5 className={filter === 'Rewarded' ? 'active' : ''} onClick={() => setFilter('Rewarded')}>Rewarded Fights</h5>
                        <h5 className={filter === 'NotRewarded' ? 'active' : ''} onClick={() => setFilter('NotRewarded')}>Non-rewarded Fights</h5>
                    </div>

                    <div className="fightswrap">
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map((match) => (
                                <div 
                                    className="fightItem" 
                                    key={match._id} 
                                    onClick={match.matchReward === 'NotRewarded' 
                  ? () => handleMatchClick(match._id) 
                  : () => alert('Rewards already given')
                }>
                                    <div className='fightersImages'>
                                        <div className='fighterOne'>
                                            <img src={match.fighterAImage} alt={match.matchFighterA} />
                                        </div>
                                        <div className='fighterTwo'>
                                            <img src={match.fighterBImage} alt={match.matchFighterB} />
                                        </div>
                                    </div>
                                    <div className='fightItemOne'>
                                        <div className="transformed-div">
                                            <h1>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                                        </div>
                                        <div className="transformed-div-two">
                                            <div className='transformed-div-two-partOne'>
                                                <h1>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</h1>
                                                <h1>{new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</h1>
                                            </div>
                                            <div className='transformed-div-two-partTwo'>
                                                <p>{match.matchDate?.split('T')[0]}</p>
                                                <h1>{match.matchType}</h1>
                                                <h1>pot ${match.pot}</h1>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='fightItemTwo'>
                                        <div className="transformed-div-three">
                                            <p>{match.matchDescription}</p>
                                        </div>
                                        <div className="transformed-div-four">
                                            <h1>Status</h1>
                                            <p>{match.matchStatus}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='noMatch'>No upcoming matches</p>
                        )}
                    </div>
                </div>
            </div>
            {selectedMatch && winnerDetails && (
                <Popup 
                    winnerDetails={winnerDetails} 
                    onClose={handleClosePopup} 
                    onReward={handleRewardTokens} 
                    matchTokens={matchTokens}
                    affiliateTokens={affiliateTokens} // Added to display affiliate reward
                />
            )}
        </div>
    );
}

export default PreviousMatches;
