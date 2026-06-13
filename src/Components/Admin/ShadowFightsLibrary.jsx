import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import EditMatch from './EditMatch';
import { toast } from 'react-toastify';
import { fetchMatches } from '@/Redux/matchSlice';
import { useRouter } from 'next/router';

const ShadowFightsLibrary = () => {
    const dispatch = useDispatch();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showFightPopup, setShowFightPopup] = useState(false);
    const [showAffiliatesPopup, setShowAffiliatesPopup] = useState(false);
    const [affiliates, setAffiliates] = useState([]);
    const [editAffiliates, setEditAffiliates] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMatches, setFilteredMatches] = useState([]);

    const router = useRouter();
    // Function to fetch matches
    const fetchMatchesData = async () => {
        try {
            const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/shadow");
            const data = await response.json();
            setMatches(data);
            setFilteredMatches(data);
        } catch (error) {
            console.error("Error fetching matches:", error);
        }
    };

    // Function to fetch affiliates
    const fetchAffiliatesData = async () => {
        try {
            const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/affiliates");
            const data = await response.json();
            setAffiliates(data);
        } catch (error) {
            console.error("Error fetching affiliates:", error);
        }
    };

    useEffect(() => {
        // Fetch matches and affiliates initially
        fetchMatchesData();
        fetchAffiliatesData();
    }, []);

    useEffect(() => {
        // Filter matches based on the search query
        if (searchQuery.trim() === '') {
            setFilteredMatches(matches);
         } else {
          const lowerCaseQuery = searchQuery.toLowerCase();
          const filtered = matches.filter((match) => 
            match.matchFighterA.toLowerCase().includes(lowerCaseQuery) ||
            match.matchFighterB.toLowerCase().includes(lowerCaseQuery) ||
            match.matchDescription?.toLowerCase().includes(lowerCaseQuery) ||
            match.matchCategory?.toLowerCase().includes(lowerCaseQuery) ||
            match.matchCategoryTwo?.toLowerCase().includes(lowerCaseQuery) ||
            match.matchStatus?.toLowerCase().includes(lowerCaseQuery)
          );
          setFilteredMatches(filtered);
        }
      }, [searchQuery, matches]);
    

    const handleFightItemClick = (match) => {
        setSelectedMatch(match);
        setShowFightPopup(true);
    };
    
    
    const handleDeleteClick = async () => {
      if (selectedMatch) {
        const deleteShadowFightPromise = new Promise(async (resolve, reject) => {
          try {
            const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/shadowfighttodelete/${selectedMatch._id}`, { method: 'DELETE' });
    
            // Log the entire response object
            console.log('Full response object:', response);
    
            if (response.ok) {
              const responseData = await response.json();
              console.log('Response body:', responseData);
    
              // Proceed with the existing logic
              setShowFightPopup(false);
              setSelectedMatch(null);
              fetchMatchesData(); // Refresh match list
              dispatch(fetchMatches()); // Redux state update
    
              resolve(); // Resolve on successful deletion
            } else {
              console.error('Failed to delete the match:', response.statusText);
              reject(new Error('Failed to delete the match.')); // Reject on error response
            }
          } catch (error) {
            console.error("Error deleting match:", error);
            reject(new Error('Error deleting match.')); // Reject on network error
          }
        });
    
        // Use toast.promise to handle pending, success, and error states
        toast.promise(deleteShadowFightPromise, {
          pending: 'Deleting match...',
          success: 'Match deleted successfully 👌',
          error: {
            render({ data }) {
              return data.message || 'Failed to delete match';
            }
          }
        });
      }
    };

    

    const handleViewAffiliatesClick = () => {
        setShowAffiliatesPopup(true);
    };

    const handleEditAffiliatesClick = (id) => {
        setEditAffiliates(id);
    };

    const closeFightPopup = () => {
        setShowFightPopup(false);
        setSelectedMatch(null);
    };

    const closeAffiliatesPopup = () => {
        setShowAffiliatesPopup(false);
    };

    // Filter affiliates matching AffiliateIds in the selected match
    const filteredAffiliates = selectedMatch
        ? affiliates.filter(affiliate =>
              selectedMatch.AffiliateIds.some(({ AffiliateId }) => AffiliateId === affiliate._id)
          )
        : [];


        if (editAffiliates) {
            return (
              <>
                <i
                  className="fa fa-arrow-circle-left"
                  aria-hidden="true"
                  onClick={() => setEditAffiliates(false)} // Go back to the previous component
                  style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
                ></i>
                <EditMatch matchId={selectedMatch._id} isShadow={true} />
              </>
            );
          }
          
    return (
        <div className='shadowLibrary'>
        <i
        className="fa fa-arrow-circle-left shadowFightLibraryIcon"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>
   
            <div className='adminWrapper '>
                <div className='homeSecond' style={{ background: 'transparent' }}>
                    
                    <div className='fixdDivShadowLibrary' >
                    <h1 className='second-main-heading fixDivShadowTitle' >Shadow <span className='toRemove'> Fights</span> Library</h1>   
                    </div>
                    <input
            type="text"
            placeholder='Search here...'
            className='searchbar-fights'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{marginTop:'150px'}}
          />     
         
                    <div className="fightswrap" style={{paddingTop:'20px'}}>
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map((match) => (
                                <div className="fightItem" key={match._id} onClick={() => handleFightItemClick(match)}>
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
                                                <h1>Affiliates Promoting<span className='toRemove'> this fight</span></h1>
                                            </div>
                                            <div className='transformed-div-two-partTwo'>
                                                <h1>{match.AffiliateIds.length}</h1>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='fightItemTwo'>
                                        <div className="transformed-div-three">
                                            <p>{match.matchDescription}</p>
                                        </div>
                                        <div className="transformed-div-four">
                                            <h1>{match.matchType}</h1>
                                            <p>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</p>
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

            {showFightPopup && selectedMatch && (
                <div className="popup">
                    <div className="popup-content">
                        <h2>{selectedMatch.matchFighterA} -VS- {selectedMatch.matchFighterB}</h2>
                        <p>{selectedMatch.matchDescription}</p>
                        <p>Type: {selectedMatch.matchType}</p>
                        
                        <p>Category: {selectedMatch.matchCategoryTwo ? selectedMatch.matchCategoryTwo : selectedMatch.matchCategory}</p>
                        <div className="popup-actions">
                            <button onClick={handleDeleteClick} style={{background:'crimson', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}>Delete Match</button>
                            <button onClick={handleViewAffiliatesClick} style={{boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}>View Affiliates</button>
                            <button 
  onClick={handleEditAffiliatesClick} 
  style={{ 
    background: '#FFC107', 
    color: '#333', 
    border: 'none', 
    padding: '10px 20px', 
    borderRadius: '5px', 
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}>
  Edit Template
</button>
    <button onClick={closeFightPopup} style={{background:'gray' ,boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showAffiliatesPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <h2>Affiliates for {selectedMatch.matchFighterA} -VS- {selectedMatch.matchFighterB}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Player Name</th>
                                    <th>Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAffiliates.map((affiliate) => (
                                    <tr key={affiliate._id}>
                                        <td>{affiliate.firstName} {affiliate.lastName}</td>
                                        <td>{affiliate.email}</td>
                                        <td>{affiliate.playerName}</td>
                                        <td><img src={affiliate.profileUrl} alt={affiliate.playerName} style={{ width: '50px' }} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={closeAffiliatesPopup}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShadowFightsLibrary;
