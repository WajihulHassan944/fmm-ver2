import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EditMatch from './EditMatch';
import { toast } from 'react-toastify';
import { fetchMatches } from '@/Redux/matchSlice';
import { useRouter } from 'next/router';

const DeleteFights = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState('default'); // 'default' or 'confirmReturnTokens'
  const [returnTokens, setReturnTokens] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMatches, setFilteredMatches] = useState([]);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
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

  const handleMatchClick = (id, affiliateId) => {
    setSelectedMatchId(id);
    setSelectedAffiliateId(affiliateId);
    setShowPopup(true);
    setPopupStep('default');
    setPopupMessage('Delete or Edit this match?');
  };

  const modifyThisPopup = () => {
    setPopupStep('confirmReturnTokens');
    setPopupMessage('Return tokens to all users?');
  };

  const handleConfirmDelete = async () => {
    if (selectedMatchId) {
      const deleteMatchPromise = new Promise(async (resolve, reject) => {
        try {
          let url = `https://fantasymmadness-game-server-three.vercel.app/api/matches/${selectedMatchId}?updateWallet=${returnTokens}`;
          if (selectedAffiliateId) {
            url += `&affiliateId=${selectedAffiliateId}`;
          }

          const response = await fetch(url, { method: 'DELETE' });

          if (response.ok) {
            dispatch(fetchMatches());
            resolve();

            setTimeout(() => {
              setShowPopup(false);
              setSelectedMatchId(null);
              setSelectedAffiliateId(null);
            }, 1000);
          } else {
            reject(new Error('Failed to delete the match'));
          }
        } catch (error) {
          reject(new Error('Server error, please try again later'));
        }
      });

      toast.promise(deleteMatchPromise, {
        pending: 'Deleting match...',
        success: 'Match deleted successfully 👌',
        error: {
          render({ data }) {
            return data.message || 'Failed to delete match';
          },
        },
      }).finally(() => {
        setTimeout(() => {
          setShowPopup(false);
        }, 1000);
      });
    }
  };

  const handleCancelDelete = () => {
    setShowPopup(false);
    setSelectedMatchId(null);
    setSelectedAffiliateId(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setShowPopup(false);
  };

  if (isEditing && selectedMatchId) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left"
          aria-hidden="true"
          onClick={() => setIsEditing(false)}
          style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
        ></i>
        <EditMatch matchId={selectedMatchId} isShadow={false} />
      </>
    );
  }

  return (
    <>
      <div>
        <div className='adminWrapper'>
          <i
            className="fa fa-arrow-circle-left"
            aria-hidden="true"
            onClick={() => router.push(-1)}
            style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
          ></i>
          <div className='homeSecond' style={{ background: 'transparent' }}>
            <h1 className='second-main-heading'>Delete / Update Fights</h1>
            <input
              type="text"
              placeholder='Search here...'
              className='searchbar-fights'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="fightswrap">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <div
                    className="fightItem"
                    key={match._id}
                    onClick={() => handleMatchClick(match._id, match.affiliateId || null)}
                  >
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
                          <h1>{match.matchCategoryTwo || match.matchCategory}</h1>
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
                <p className='noMatch'>No matches found</p>
              )}
            </div>
          </div>
        </div>
        {showPopup && (
          <div className="popup">
            <div className="popup-content">
              <h2 style={{color:'#fff', fontFamily:'sans-serif', fontSize:'19px'}}>{popupMessage}</h2>
              {popupStep === 'default' ? (
                <div className="popup-actions">
                  <button onClick={modifyThisPopup}>Delete</button>
                  <button onClick={handleEditClick}>Edit</button>
                  <button onClick={handleCancelDelete}>Cancel</button>
                </div>
              ) : (
                <div>
                  <label style={{marginRight:'20px'}}>
                    <input type="radio" name="returnTokens" value="true" onChange={() => setReturnTokens(true)} /> Yes
                  </label>
                  <label>
                    <input type="radio" name="returnTokens" value="false" onChange={() => setReturnTokens(false)} defaultChecked /> No
                  </label>
                  <div className="popup-actions">
                    <button onClick={handleConfirmDelete}>Submit</button>
                    <button onClick={handleCancelDelete}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeleteFights;
