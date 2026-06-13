import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '@/Redux/matchSlice';
const EditMatch = ({ matchId, isShadow }) => {
    
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  const match = matches.find((m) => m._id === matchId);

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
    pot: '',
    addToShadowTemplates:false,
    fighterAImage: null,
    fighterBImage: null,
    promotionBackground: null,
    maxRounds: '',
    matchCategoryTwo: '',
  });

  const [buttonText, setButtonText] = useState('Edit Match');
  const [displayCategory, setDisplayCategory] = useState('boxing');

  useEffect(() => {
    if (!isShadow && matchStatus === 'idle') {
      dispatch(fetchMatches());
    } else if (isShadow) {
      const fetchShadowMatches = async () => {
        try {
          const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/shadow");
          const data = await response.json();
          const specificMatch = data.find((m) => m._id === matchId);
          if (specificMatch) {
            setFormData({
              ...formData,
              matchCategory: specificMatch.matchCategory || 'boxing',
              matchName: specificMatch.matchName || '',
              matchFighterA: specificMatch.matchFighterA || '',
              matchFighterB: specificMatch.matchFighterB || '',
              matchDescription: specificMatch.matchDescription || '',
              fighterAImage: specificMatch.fighterAImage || null,
              fighterBImage: specificMatch.fighterBImage || null,
              promotionBackground:specificMatch.promotionBackground || null ,
              maxRounds: specificMatch.maxRounds || '',
              matchCategoryTwo: specificMatch.matchCategoryTwo || '',
              addToShadowTemplates: false,
    
            });
          }
        } catch (error) {
          console.error("Error fetching shadow matches:", error);
        }
      };
      fetchShadowMatches();
    }

    if (match && !isShadow) {
      setFormData({
        matchCategory: match.matchCategory || 'boxing',
        matchName: match.matchName || '',
        matchFighterA: match.matchFighterA || '',
        matchFighterB: match.matchFighterB || '',
        matchDescription: match.matchDescription || '',
        matchVideoUrl: match.matchVideoUrl || '',
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
        promotionBackground: match.promotionBackground || null ,
        matchTime: match.matchTime || '',
        matchTokens: match.matchTokens || '',
        pot: match.pot || '',
        fighterAImage: match.fighterAImage || null,
        fighterBImage: match.fighterBImage || null,
        maxRounds: match.maxRounds || '',
        matchCategoryTwo: match.matchCategoryTwo || '',
        addToShadowTemplates: match.shadowTemplatesAdditionStatus || false,
      });
      setDisplayCategory(match.matchCategory || 'boxing');
    }
  }, [match, matchStatus, isShadow, dispatch, matchId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'matchCategory') {
      let categoryOne = value;
      let categoryTwo = '';

      setDisplayCategory(value);

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
        [name]: files ? files[0] : value,
      });
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const url = isShadow
      ? 'https://fantasymmadness-game-server-three.vercel.app/editShadow'
      : 'https://fantasymmadness-game-server-three.vercel.app/editMatch';
  
    // Parse local date and time from form data (this should be in the user's local timezone)
    const localDateTime = new Date(`${formData.matchDate}T${formData.matchTime}:00`);
  
    const matchTimeEST = localDateTime.toTimeString().substring(0, 5); // Time part in HH:MM format
    const matchDate = formData.matchDate?.split('T')[0];


    const data = new FormData();
    data.append('matchId', matchId);
    data.append('matchCategory', formData.matchCategory);
    data.append('matchCategoryTwo', formData.matchCategoryTwo);
    data.append('matchName', formData.matchName);
    data.append('matchFighterA', formData.matchFighterA);
    data.append('matchFighterB', formData.matchFighterB);
    data.append('matchDescription', formData.matchDescription);
    data.append('fighterAImage', formData.fighterAImage ? formData.fighterAImage : match?.fighterAImage);
    data.append('fighterBImage', formData.fighterBImage ? formData.fighterBImage : match?.fighterBImage);
    data.append('maxRounds', formData.maxRounds);
    data.append('promotionBackground', formData.promotionBackground);
    data.append('addToShadow', formData.addToShadowTemplates);

  
    if (!isShadow) {
      data.append('matchDate', matchDate);  // Use adjusted date
      data.append('matchTime', matchTimeEST);  // Use local time
      data.append('matchTokens', formData.matchTokens);
      data.append('pot', formData.pot);
    }
    
    setButtonText('Updating, please wait...');
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: data,
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Response received:', result);
        alert('Match updated successfully!');

        if (formData.addToShadowTemplates && match?.shadowTemplatesAdditionStatus === false) {
          const shadowData = new FormData();
          shadowData.append('matchCategory', formData.matchCategory);
          shadowData.append('matchCategoryTwo', formData.matchCategoryTwo);
          shadowData.append('matchName', formData.matchName);
          shadowData.append('matchFighterA', formData.matchFighterA);
          shadowData.append('matchFighterB', formData.matchFighterB);
          shadowData.append('matchDescription', formData.matchDescription);
          shadowData.append('matchVideoUrl', formData.matchVideoUrl);
          shadowData.append('maxRounds', formData.maxRounds);
          shadowData.append('matchType', "SHADOW");
  
          shadowData.append('fighterAImageUrl', formData.fighterAImage ? formData.fighterAImage : match?.fighterAImage);
          shadowData.append('fighterBImageUrl', formData.fighterBImage ? formData.fighterBImage : match?.fighterBImage);
          shadowData.append('fighterAImageDeleteUrlFromReq', match.fighterAImageDeleteUrl);
          shadowData.append('fighterBImageDeleteUrlFromReq', match.fighterBImageDeleteUrl);
          shadowData.append('promotionBackgroundUrl', match.promotionBackground);
          shadowData.append('promotionBackgroundDeleteUrlFromReq', formData.promotionBackground ? formData.promotionBackground : match.promotionBackgroundDeleteUrl);
          shadowData.append('BoxingMatch', JSON.stringify(match.BoxingMatch));
          shadowData.append('MMAMatch', JSON.stringify(match.MMAMatch));
          shadowData.append('notify', true);
     
          const shadowResponse = await fetch(
            'https://fantasymmadness-game-server-three.vercel.app/addShadow',
            {
              method: 'POST',
              body: shadowData,
            }
          );
  
          if (shadowResponse.ok) {
            alert('Fight added to shadow templates successfully.');
          } else {
            console.warn('Failed to add fight to shadow templates.');
          }
        }





        window.location.reload();
      } else {
        alert('Failed to update match.');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('An error occurred while updating the match.');
    } finally {
      setButtonText('Edit Match');
    }
  };
    
  return (
    <div className='addNewMatch'>
      <div className='registerCard'>
        <h1>Update <span style={{ color: 'crimson' }}>{formData.matchName}</span></h1>

        <form onSubmit={handleSubmit}>
          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Select Category </label>
              <select name='matchCategory' value={displayCategory} onChange={handleChange}>
                <option value="boxing">Boxing</option>
                <option value="mma">MMA</option>
                <option value="kickboxing">Kickboxing</option>
                <option value="Bare-knuckle">Bare-knuckle</option>
              </select>
            </div>

            <div className='input-group'>
              <label>Match Name </label>
              <input type='text' name='matchName' value={formData.matchName} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-two'>
            <div className='input-group'>
              <label>Fighter A </label>
              <input type='text' name='matchFighterA' value={formData.matchFighterA} onChange={handleChange} />
            </div>
            <div className='input-group'>
              <label>Fighter B </label>
              <input type='text' name='matchFighterB' value={formData.matchFighterB} onChange={handleChange} />
            </div>
          </div>

          <div className='input-wrap-one'>
            <div className='input-group' style={{ flexBasis: '100%' }}>
              <label>Match Description</label>
              <textarea name='matchDescription' style={{ border: '3px solid #ccc' }} value={formData.matchDescription} onChange={handleChange} />
            </div>
          </div>

          {/* Conditional rendering for fields only when isShadow is false */}
          {!isShadow && (
            <>
              <div className='input-wrap-one'>
                <div className='input-group'>
                  <label>Match Date </label>
                  <input type='date' name='matchDate' value={formData.matchDate} onChange={handleChange} />
                </div>
                <div className='input-group'>
                  <label>Match Time </label>
                  <input type='time' name='matchTime' value={formData.matchTime} onChange={handleChange} />
                </div>
              </div>

              <div className='input-wrap-one'>
                <div className='input-group'>
                  <label>Match Tokens </label>
                  <input type='number' name='matchTokens' value={formData.matchTokens} onChange={handleChange} />
                </div>
                <div className='input-group'>
                  <label>POT </label>
                  <input type='number' name='pot' value={formData.pot} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Fighter A Image </label>
              {formData.fighterAImage instanceof File
                ? <img src={URL.createObjectURL(formData.fighterAImage)} alt="Fighter A" style={{ width: '80px', objectFit: 'cover', borderRadius: '50%', height: '80px' }} />
                : <img src={formData.fighterAImage} alt="Fighter A" style={{ width: '80px', objectFit: 'cover', borderRadius: '50%', height: '80px' }} />
              }
              <input type='file' name='fighterAImage' onChange={handleChange} style={{display:'block', marginTop:'10px'}} />
            </div>
            <div className='input-group'>
              <label>Fighter B Image </label>
              {formData.fighterBImage instanceof File
                ? <img src={URL.createObjectURL(formData.fighterBImage)} alt="Fighter B" style={{ width: '80px', objectFit: 'cover', borderRadius: '50%', height: '80px' }} />
                : <img src={formData.fighterBImage} alt="Fighter B" style={{ width: '80px', objectFit: 'cover', borderRadius: '50%', height: '80px' }} />
              }
              <input type='file' name='fighterBImage' onChange={handleChange} style={{display:'block',marginTop:'10px'}}/>
            </div>
          </div>

          {isShadow || !isShadow && (
            

             <div className='input-group' style={{display:'flex', flexDirection:'column'}}>
              <label>Promotion Background </label>
              {formData.promotionBackground instanceof File ? (
  // If promotionBackground is a File instance, display the selected file
  <img
    src={URL.createObjectURL(formData.promotionBackground)}
    alt="promotionBackground"
    style={{ width: '70%', objectFit: 'cover', height: 'auto', margin: 'auto' }}
  />
) : formData.promotionBackground ? (
  // If promotionBackground is not a File but contains a URL, display the URL
  <img
    src={formData.promotionBackground}
    alt="promotionBackground"
    style={{ width: '70%', objectFit: 'cover', height: 'auto', margin: 'auto' }}
  />
) : (
  // If neither condition is met, display the default promoBackground
  <img
    src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743561422/home/qf8hkfqxlaobsriijvmj.png"
    alt="promotionBackground"
    style={{ width: '70%', objectFit: 'cover', height: 'auto', margin: 'auto' }}
  />
)}


  <input
    type="file"
    name="promotionBackground"
    id="promotionBackground"
    onChange={handleChange}
    style={{ display: 'none' }} // Hide the default input
  />
  <label htmlFor="promotionBackground" className="custom-file-label" style={{marginTop:"10px"}}>
    Choose File
  </label>
            </div>

        )}




          <div className='input-wrap-one'>
          <div className='input-group'>
            <label>Max Rounds </label>
            <input type='number' name='maxRounds' value={formData.maxRounds} onChange={handleChange} />
          </div>
        </div>
        
        
  <div className="input-wrap-one">
    <div className="input-group" style={{flexDirection:'row',gap:'20px', marginTop:'10px'}}>
      <label   style={{
        color: formData.addToShadowTemplates ? 'rgb(0, 213, 75)' : 'white', // Dynamic color
        transition: 'color 0.3s ease', // Add animation
      }}>In Shadow Templates ? </label>
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

        
        
          <button type='submit' className='btn-grad' style={{ width: '50%' }}>
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditMatch;
