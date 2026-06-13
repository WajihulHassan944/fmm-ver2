import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
const AffiliateAddNewMatch = ({ matchId }) => {

  const [formData, setFormData] = useState({
    shadowFightId: '',
    matchTokens: '',
    affiliateId: '',
    pot: '',
    profit: '',
    amountOverPotBudget: '',
    matchDate: '',
    matchTime: '',
    matchCategoryTwo:'',
  });

  const [promoMatches, setPromoMatches] = useState([]);
  const [requiredUsers, setRequiredUsers] = useState(null);  // Default initial value

  useEffect(() => {
    const fetchPromoMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/shadow');
        if (!response.ok) {
          throw new Error('Failed to fetch promo matches');
        }
        const data = await response.json();
        setPromoMatches(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchPromoMatches();
  }, []);

  const [buttonText, setButtonText] = useState('Create');
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const promoDetails = promoMatches.find((m) => m._id === matchId);

  if(!promoDetails) {
    return <p>Loading...</p>;
  }

  if (!affiliate) {
    return <div>Loading...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numericFields = ['matchTokens', 'pot', 'profit', 'amountOverPotBudget'];
    const dateFields = ['matchDate', 'matchTime'];

    let newValue;

    if (numericFields.includes(name)) {
      newValue = parseFloat(value) || 0;
    } else if (dateFields.includes(name)) {
      newValue = value; // Keep date and time as string
    } else {
      newValue = value;
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: newValue,
    }));

    // Dynamically calculate the required number of players in real-time
    if (name === 'pot' || name === 'matchTokens') {
      const potValue = name === 'pot' ? newValue : formData.pot;
      const matchTokensValue = name === 'matchTokens' ? newValue : formData.matchTokens;

      // Avoid division by zero for matchTokens
      if (matchTokensValue > 0) {
        setRequiredUsers(potValue / matchTokensValue);
      } else {
        setRequiredUsers(0);  // Set to 0 if matchTokens is invalid
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const url = 'https://fantasymmadness-game-server-three.vercel.app/addMatch';
  
    const matchDetails = promoMatches.find((m) => m._id === matchId);
    if (!matchDetails) {
      alert('Match not found!');
      return;
    }
  
    // Parse local date and time from form data (assuming it's in the user's local timezone)
    const localDateTime = new Date(`${formData.matchDate}T${formData.matchTime}:00`);
  
    const matchTimeEST = localDateTime.toTimeString().substring(0, 5); // Time part in HH:MM format
  
    const matchDate = formData.matchDate.split('T')[0];

    const data = new FormData();
    data.append('matchTokens', formData.matchTokens);
    data.append('shadowFightId', matchDetails._id);
    data.append('affiliateId', affiliate._id);
    data.append('pot', formData.pot);
    data.append('profit', formData.profit);
    data.append('amountOverPotBudget', formData.amountOverPotBudget);
    data.append('matchDate', matchDate);  // Store adjusted date
    data.append('matchTime', matchTimeEST);  // Store local time
  
    // Append image URLs directly if available
    data.append('fighterAImageUrl', matchDetails.fighterAImage);
    data.append('fighterBImageUrl', matchDetails.fighterBImage);
    data.append('fighterAImageDeleteUrlFromReq', matchDetails.fighterAImageDeleteUrl);
    data.append('fighterBImageDeleteUrlFromReq', matchDetails.fighterBImageDeleteUrl);
   
    data.append('promotionBackgroundUrl', matchDetails.promotionBackground);
    data.append('promotionBackgroundDeleteUrlFromReq', matchDetails.promotionBackgroundDeleteUrl);
  
   
    // Append other match details
    data.append('matchStatus', matchDetails.matchStatus);
    data.append('matchCategory', matchDetails.matchCategory);
    data.append('matchCategoryTwo', matchDetails.matchCategoryTwo);
    data.append('matchName', matchDetails.matchName);
    data.append('matchFighterA', matchDetails.matchFighterA);
    data.append('matchFighterB', matchDetails.matchFighterB);
    data.append('matchDescription', matchDetails.matchDescription);
    data.append('matchVideoUrl', matchDetails.matchVideoUrl);
    data.append('matchType', 'SHADOW');
    data.append('maxRounds', matchDetails.maxRounds);
    data.append('notify', false);
 
    // Append BoxingMatch and MMAMatch stats
    data.append('BoxingMatch', JSON.stringify(matchDetails.BoxingMatch));
    data.append('MMAMatch', JSON.stringify(matchDetails.MMAMatch));
  
    setButtonText('Saving, please wait...');
  
    try {
      console.log(data);
      const response = await fetch(url, {
        method: 'POST',
        body: data,
      });
  
      if (response.ok) {
        const responseData = await response.json();
        alert('Match added successfully!');
        console.log(responseData.data);
        window.location.reload();
      } else {
        alert('Failed to add match.');
      }
    } catch (error) {
      console.error('Error adding match:', error);
      window.location.reload();
    } finally {
      setButtonText('Add Match');
    }
  };
  
  return (
    <div className='addNewMatch' style={{ marginLeft: '0', width: '100%', flexDirection: 'column' }}>
      <div className='member-header' style={{ marginBottom: '20px' }}>
        <div className='member-header-image'>
          <img src={affiliate.profileUrl} alt="Logo" />
        </div>
        <h3><span className='toRemove'>Affiliate Name:</span> {affiliate.firstName} {affiliate.lastName}</h3>
        <h3>Users <span className="toRemove"> in my League</span> : {affiliate.usersJoined.length}</h3>
      </div>

      <div className='registerCard' style={{ maxWidth: '700px', marginTop: '10px' }}>
        <h1>Create a promo for a fight</h1>

        <form>
          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Fight Name</label>
              <input type='text' name='matchName' value={promoDetails.matchName} disabled style={{ background: '#fff' }} />
            </div>
            <div className='input-group'>
              <label>POT - Winner Award <span>*</span></label>
              <input type='number' name='pot' value={formData.pot} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Player Buy in (Tokens) <span>*</span></label>
              <input type='number' name='matchTokens' value={formData.matchTokens} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-one'>
            <div className='input-group' style={{ flexBasis: '100%', margin: '10px 0' }}>
              <label style={{ color: 'yellow' }}>Note - You will need {requiredUsers > 0 ? Math.ceil(requiredUsers) : ' '} players in order for this fight to start. If the budget is not reached by the start time, the fight will not start so you need to have sufficient players in your league.</label>
            </div>
          </div>

   {/*        <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Match Date <span>*</span></label>
              <input type='date' name='matchDate' value={formData.matchDate} onChange={handleChange} />
            </div>
            <div className='input-group'>
              <label>Match time <span>*</span></label>
              <input type='time' name='matchTime' value={formData.matchTime} onChange={handleChange} />
            </div>
          </div>
*/}
          <button type="submit" className='btn-grad' style={{ width: '50%' }} onClick={handleSubmit}>{buttonText}</button>
        </form>
      </div>
    </div>
  );
};

export default AffiliateAddNewMatch;
