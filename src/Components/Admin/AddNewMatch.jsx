import React, { useState } from 'react';
import AdminPredictions from './AdminPredictions';
import { useRouter } from 'next/router';
const AddNewMatch = () => {
  const router = useRouter();  
  const [formData, setFormData] = useState({
    matchCategory: 'boxing',
    matchName: '',
    matchFighterA: '',
    matchFighterB: '',
    matchDescription: '',
    matchVideoUrl: '',
    matchDate: '',
    matchTime: '',
    matchTokens: '',
    matchType: 'LIVE',
    pot: '',
    fighterAImage: null,
    notify:true,
    addToShadowTemplates:false,
    fighterBImage: null,
    promotionBackground: null,
    maxRounds: '',
    matchCategoryTwo: '',
  });
  
  const [buttonText, setButtonText] = useState('Add Match');  // State for button text
  const [displayCategory, setDisplayCategory] = useState('boxing');
  const [matchId, setMatchId] = useState(null); // State to store matchId for AdminPredictions
  const [showPopup, setShowPopup] = useState(false); // State for popup visibility
  const [showAdminPredictions, setShowAdminPredictions] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'matchCategory') {
      let categoryOne = value;
      let categoryTwo = '';

      setDisplayCategory(value); // Update the displayed value

      if (value === 'kickboxing') {
        categoryOne = 'mma';
        categoryTwo = 'kickboxing';
      } else if (value === 'Bare-knuckle') {
        categoryOne = 'boxing';
        categoryTwo = 'Bare-knuckle';
      }

      setFormData({
        ...formData,
        matchCategory: categoryOne,
        matchCategoryTwo: categoryTwo,
      });
    } else {
      setFormData({
        ...formData,
        [name]: files ? files[0] : value // Handles both text and file inputs
      });
    }
  };
  
  
  
  
  
  
  
  
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const url =
      formData.matchType === 'LIVE'
        ? 'https://fantasymmadness-game-server-three.vercel.app/addMatch'
        : 'https://fantasymmadness-game-server-three.vercel.app/addShadow';
  
    // Parse local date and time from form data (assuming it's in the user's local timezone)
    const localDateTime = new Date(`${formData.matchDate}T${formData.matchTime}:00`);
    const matchTimeEST = localDateTime.toTimeString().substring(0, 5); // Time part in HH:MM format
    const matchDate = formData.matchDate.split('T')[0];

    const data = new FormData();
    data.append('matchCategory', formData.matchCategory);
    data.append('matchCategoryTwo', formData.matchCategoryTwo);
    data.append('matchName', formData.matchName);
    data.append('matchFighterA', formData.matchFighterA);
    data.append('matchFighterB', formData.matchFighterB);
    data.append('matchDescription', formData.matchDescription);
    data.append('matchVideoUrl', formData.matchVideoUrl);
    data.append('fighterAImage', formData.fighterAImage);
    data.append('fighterBImage', formData.fighterBImage);
    data.append('maxRounds', formData.maxRounds);
    data.append('matchDate', matchDate);
    data.append('matchTime', matchTimeEST);
    data.append('matchType', formData.matchType);
    data.append('matchTokens', formData.matchTokens);
    data.append('pot', formData.pot);
    data.append('notify', formData.notify);
    data.append('promotionBackground', formData.promotionBackground);
    data.append('addToShadow', formData.addToShadowTemplates);

    setButtonText('Saving, please wait...'); // Update button text
  
    try {
      // Send the main request
      const response = await fetch(url, {
        method: 'POST',
        body: data,
      });
  
      if (response.ok) {
        const result = await response.json(); // Parse the JSON response
        console.log('Response received:', result); // Log the full response
        alert('Match added successfully!');
  
        // If matchType is 'LIVE' and addToShadowTemplates is true, add the fight to shadow templates
        if (formData.matchType === 'LIVE' && formData.addToShadowTemplates) {
          const shadowData = new FormData();
          shadowData.append('matchCategory', formData.matchCategory);
          shadowData.append('matchCategoryTwo', formData.matchCategoryTwo);
          shadowData.append('matchName', formData.matchName);
          shadowData.append('matchFighterA', formData.matchFighterA);
          shadowData.append('matchFighterB', formData.matchFighterB);
          shadowData.append('matchDescription', formData.matchDescription);
          shadowData.append('matchVideoUrl', formData.matchVideoUrl);
          shadowData.append('fighterAImage', formData.fighterAImage);
          shadowData.append('fighterBImage', formData.fighterBImage);
          shadowData.append('maxRounds', formData.maxRounds);
          shadowData.append('matchType', formData.matchType); // Force matchType to SHADOW
          shadowData.append('notify', formData.notify);
          shadowData.append('promotionBackground', formData.promotionBackground);
  
          const shadowResponse = await fetch(
            'https://fantasymmadness-game-server-three.vercel.app/addShadow',
            {
              method: 'POST',
              body: shadowData,
            }
          );
  
          if (shadowResponse.ok) {
            alert('Fight also added to shadow templates successfully.');
          } else {
            console.warn('Failed to add fight to shadow templates.');
          }
        }
  
        if (formData.matchType === 'SHADOW') {
          setMatchId(result.matchId); // Store the matchId
          setShowPopup(true); // Show the popup
        } else {
          window.location.reload(); // Reload for LIVE matches
        }
      } else {
        alert('Failed to add match.');
      }
    } catch (error) {
      console.error('Error adding match:', error);
      alert('An error occurred while adding the match.');
    } finally {
      setButtonText('Add Match'); // Revert button text
    }
  };
  
  
  const handlePopupResponse = (response) => {
    setShowPopup(false); // Hide the popup
    if (response === 'yes') {
      setShowAdminPredictions(true); // Trigger rendering of AdminPredictions
    } else {
      window.location.reload();
    }
  };
  
  if (showAdminPredictions && matchId) {
    return <AdminPredictions matchId={matchId} filter={'shadowTemplate'} />;
  }
 
  return (
    <div className='addNewMatch'>
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
      <div className='registerCard'>
        <h1>Add New Match</h1>

        <form onSubmit={handleSubmit}>
          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Select Category <span>*</span></label>
              <select name='matchCategory' value={displayCategory} onChange={handleChange}>
                <option value="boxing">Boxing</option>
                <option value="mma">MMA</option>
                <option value="kickboxing">Kickboxing</option>
                <option value="Bare-knuckle">Bare-knuckle</option>
              </select>
            </div>

            <div className='input-group'>
              <label>Match Name <span>*</span></label>
              <input type='text' name='matchName' value={formData.matchName} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-two'>
            <div className='input-group'>
              <label>Fighter A <span>*</span></label>
              <input type='text' name='matchFighterA' value={formData.matchFighterA} onChange={handleChange} />
            </div>
            <div className='input-group'>
              <label>Fighter B <span>*</span></label>
              <input type='text' name='matchFighterB' value={formData.matchFighterB} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-one'>
            <div className='input-group' style={{ flexBasis: '100%' }}>
              <label>Match Description <span>*</span></label>
              <textarea name='matchDescription' style={{ border: '3px solid #ccc' }} value={formData.matchDescription} onChange={handleChange} />
            </div>
          </div>

          {formData.matchType === 'LIVE' && (
            <>
              <div className='input-wrap-one'>
                <div className='input-group'>
                  <label>Match Date <span>*</span></label>
                  <input type='date' name='matchDate' value={formData.matchDate} onChange={handleChange} />
                </div>
                <div className='input-group'>
                  <label>Match Time <span>*</span></label>
                  <input type='time' name='matchTime' value={formData.matchTime} onChange={handleChange} />
                </div>
              </div>

              <div className='input-wrap-one'>
                <div className='input-group'>
                  <label>Match Tokens <span>*</span></label>
                  <input type='number' name='matchTokens' value={formData.matchTokens} onChange={handleChange} />
                </div>
                <div className='input-group'>
                  <label>POT <span>*</span></label>
                  <input type='number' name='pot' value={formData.pot} onChange={handleChange} />
                </div>
              </div>
            </>
          )}




         
          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Fighter 1 Image <span>*</span></label>
              <input type='file' name='fighterAImage' onChange={handleChange} style={{display:'block'}} />
            </div>
            <div className='input-group'>
              <label>Fighter 2 Image <span>*</span></label>
              <input type='file' name='fighterBImage' onChange={handleChange} style={{display:'block'}} />
            </div>
          </div>

            
            <div className='input-wrap-one' style={{flexDirection:'column'}}>
            {formData.promotionBackground instanceof File
                ? <img src={URL.createObjectURL(formData.promotionBackground)} alt="promotionBackground" style={{ width: '70%', objectFit: 'cover', height: 'auto', margin:'auto' }} />
                : <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743561422/home/qf8hkfqxlaobsriijvmj.png" alt="promotionBackground" style={{ width: '70%', objectFit: 'cover',  height: 'auto', margin:'auto' }} />
              }
            <div className="input-group">
  <label>Promotion Background <span>*</span></label>
  <input
    type="file"
    name="promotionBackground"
    id="promotionBackground"
    onChange={handleChange}
    style={{ display: 'none' }} // Hide the default input
  />
  <label htmlFor="promotionBackground" className="custom-file-label">
    Choose File
  </label>
</div>
 </div>



          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Fight <span>*</span></label>
              <select name='matchType' value={formData.matchType} onChange={handleChange}>
                <option value="LIVE">LIVE</option>
                <option value="SHADOW">SHADOW</option>
              </select>
            </div>
            <div className='input-group'>
              <label>Max Rounds <span>*</span></label>
              <input type='number' name='maxRounds' value={formData.maxRounds} onChange={handleChange} />
            </div>
          </div>
          
          
          <div className="input-wrap-one">
    <div className="input-group" style={{flexDirection:'row',gap:'20px', marginTop:'10px'}}>
      <label   style={{
        color: formData.notify ? 'rgb(0, 213, 75)' : 'white', // Dynamic color
        transition: 'color 0.3s ease', // Add animation
      }}>Notify Users</label>
      <div className="toggle-switch">
      <input
        type="checkbox"
        id="notify-switch"
        checked={formData.notify}
        onChange={() => setFormData((prevData) => ({
      ...prevData,
      notify: !prevData.notify,
    }))}
    />
        <label htmlFor="notify-switch" className="switch"></label>
      </div>
    </div>
  </div>








  <div className="input-wrap-one">
    <div className="input-group" style={{flexDirection:'row',gap:'20px', marginTop:'10px'}}>
      <label   style={{
        color: formData.addToShadowTemplates ? 'rgb(0, 213, 75)' : 'white', // Dynamic color
        transition: 'color 0.3s ease', // Add animation
      }}>Add To Shadow Templates</label>
      <div className="toggle-switch">
      <input
        type="checkbox"
        id="addToShadowTemplates"
        checked={formData.addToShadowTemplates}
        onChange={() => setFormData((prevData) => ({
      ...prevData,
      addToShadowTemplates: !prevData.addToShadowTemplates,
    }))}
    />
        <label htmlFor="addToShadowTemplates" className="switch"></label>
      </div>
    </div>
  </div>

          <button type="submit" className='btn-grad' style={{ width: '50%' }}>{buttonText}</button>
        </form>

       
      </div>



      {showPopup && (
        <div className='popup'>
          <h2>Want to submit scores now?</h2>
          <button onClick={() => handlePopupResponse('yes')}>Yes</button>
          <button onClick={() => handlePopupResponse('no')}>Not Now</button>
        </div>
      )}

      

    </div>
  );
};

export default AddNewMatch;
