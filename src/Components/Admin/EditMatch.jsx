import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaCoins,
  FaFistRaised,
  FaFilm,
  FaImage,
  FaSlidersH,
  FaLayerGroup,
  FaSave,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.webp';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.webp';
const FALLBACK_PROMOTION = 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743561422/home/qf8hkfqxlaobsriijvmj.png';

const resolveDisplayCategory = (category, categoryTwo) => {
  if (categoryTwo === 'kickboxing' || categoryTwo === 'Bare-knuckle') return categoryTwo;
  return category || 'boxing';
};

const previewSource = (value, fallback) => {
  if (typeof File !== 'undefined' && value instanceof File) return URL.createObjectURL(value);
  return value || fallback;
};

const stringifyScoreConfig = (value) => {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return '';
  try { return JSON.stringify(value, null, 2); } catch { return ''; }
};

const parseScoreConfig = (label, value) => {
  if (!String(value || '').trim()) return null;
  try { return JSON.parse(value); } catch (error) { throw new Error(`${label} must be valid JSON before saving.`); }
};

const EditMatch = ({ matchId, isShadow }) => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const match = (Array.isArray(matches) ? matches : []).find((item) => String(item?._id || item?.id) === String(matchId));

  const [formData, setFormData] = useState({
    matchCategory: 'boxing',
    matchName: '',
    matchFighterA: '',
    matchFighterB: '',
    matchDescription: '',
    matchVideoUrl: '',
    matchPromotionalVideoUrl: '',
    matchStatus: '',
    matchShadowStatus: '',
    matchShadowOpenStatus: '',
    matchDate: '',
    matchTime: '',
    matchTokens: '',
    pot: '',
    addToShadowTemplates: false,
    fighterAImage: null,
    fighterBImage: null,
    promotionBackground: null,
    maxRounds: '',
    matchCategoryTwo: '',
    BoxingMatch: '',
    MMAMatch: '',
  });

  const [buttonText, setButtonText] = useState('Edit Match');
  const [displayCategory, setDisplayCategory] = useState('boxing');

  useEffect(() => {
    if (!isShadow && matchStatus === 'idle') {
      dispatch(fetchMatches({ includeDrafts: true }));
    } else if (isShadow) {
      const fetchShadowMatches = async () => {
        try {
          let specificMatch = null;
          const singleResponse = await fetch(`${API_BASE}/api/shadow/${matchId}`);
          if (singleResponse.ok) {
            const singleData = await singleResponse.json();
            specificMatch = singleData?.match || singleData;
          }
          if (!specificMatch) {
            const response = await fetch(`${API_BASE}/shadow`);
            const data = await response.json();
            specificMatch = (Array.isArray(data) ? data : []).find((item) => String(item?._id || item?.id) === String(matchId));
          }
          if (specificMatch) {
            setFormData((current) => ({
              ...current,
              matchCategory: specificMatch.matchCategory || 'boxing',
              matchName: specificMatch.matchName || '',
              matchFighterA: specificMatch.matchFighterA || '',
              matchFighterB: specificMatch.matchFighterB || '',
              matchDescription: specificMatch.matchDescription || '',
              matchVideoUrl: specificMatch.matchVideoUrl || '',
              matchPromotionalVideoUrl: specificMatch.matchPromotionalVideoUrl || specificMatch.promotionalVideoUrl || '',
              matchStatus: specificMatch.matchStatus || '',
              matchShadowStatus: specificMatch.matchShadowStatus || '',
              matchShadowOpenStatus: specificMatch.matchShadowOpenStatus || '',
              fighterAImage: specificMatch.fighterAImage || null,
              fighterBImage: specificMatch.fighterBImage || null,
              promotionBackground: specificMatch.promotionBackground || null,
              maxRounds: specificMatch.maxRounds || '',
              matchCategoryTwo: specificMatch.matchCategoryTwo || '',
              BoxingMatch: stringifyScoreConfig(specificMatch.BoxingMatch),
              MMAMatch: stringifyScoreConfig(specificMatch.MMAMatch),
              addToShadowTemplates: false,
            }));
            setDisplayCategory(resolveDisplayCategory(specificMatch.matchCategory, specificMatch.matchCategoryTwo));
          }
        } catch (error) {
          console.error('Error fetching shadow matches:', error);
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
        matchPromotionalVideoUrl: match.matchPromotionalVideoUrl || match.promotionalVideoUrl || '',
        matchStatus: match.matchStatus || '',
        matchShadowStatus: match.matchShadowStatus || '',
        matchShadowOpenStatus: match.matchShadowOpenStatus || '',
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
        promotionBackground: match.promotionBackground || null,
        matchTime: match.matchTime || '',
        matchTokens: match.matchTokens || '',
        pot: match.pot || '',
        fighterAImage: match.fighterAImage || null,
        fighterBImage: match.fighterBImage || null,
        maxRounds: match.maxRounds || '',
        matchCategoryTwo: match.matchCategoryTwo || '',
        BoxingMatch: stringifyScoreConfig(match.BoxingMatch),
        MMAMatch: stringifyScoreConfig(match.MMAMatch),
        addToShadowTemplates: match.shadowTemplatesAdditionStatus || false,
      });
      setDisplayCategory(resolveDisplayCategory(match.matchCategory, match.matchCategoryTwo));
    }
  }, [match, matchStatus, isShadow, dispatch, matchId]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
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

      setFormData((current) => ({ ...current, matchCategory: categoryOne, matchCategoryTwo: categoryTwo }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const url = isShadow ? `${API_BASE}/editShadow` : `${API_BASE}/editMatch`;
    const localDateTime = new Date(`${formData.matchDate}T${formData.matchTime}:00`);
    const matchTimeEST = localDateTime.toTimeString().substring(0, 5);
    const matchDate = formData.matchDate?.split('T')[0];

    let parsedBoxingMatch = null;
    let parsedMMAMatch = null;
    try {
      parsedBoxingMatch = parseScoreConfig('Boxing scoring JSON', formData.BoxingMatch);
      parsedMMAMatch = parseScoreConfig('MMA scoring JSON', formData.MMAMatch);
    } catch (validationError) {
      alert(validationError.message);
      return;
    }

    const data = new FormData();
    data.append('matchId', matchId);
    data.append('matchCategory', formData.matchCategory);
    data.append('matchCategoryTwo', formData.matchCategoryTwo);
    data.append('matchName', formData.matchName);
    data.append('matchFighterA', formData.matchFighterA);
    data.append('matchFighterB', formData.matchFighterB);
    data.append('matchDescription', formData.matchDescription);
    data.append('matchVideoUrl', formData.matchVideoUrl || '');
    data.append('matchPromotionalVideoUrl', formData.matchPromotionalVideoUrl || '');
    data.append('matchStatus', formData.matchStatus || '');
    data.append('matchShadowStatus', formData.matchShadowStatus || '');
    data.append('matchShadowOpenStatus', formData.matchShadowOpenStatus || '');
    if (parsedBoxingMatch) data.append('BoxingMatch', JSON.stringify(parsedBoxingMatch));
    if (parsedMMAMatch) data.append('MMAMatch', JSON.stringify(parsedMMAMatch));
    data.append('fighterAImage', formData.fighterAImage ? formData.fighterAImage : match?.fighterAImage);
    data.append('fighterBImage', formData.fighterBImage ? formData.fighterBImage : match?.fighterBImage);
    data.append('maxRounds', formData.maxRounds);
    data.append('promotionBackground', formData.promotionBackground);
    data.append('addToShadow', formData.addToShadowTemplates);

    if (!isShadow) {
      data.append('matchDate', matchDate);
      data.append('matchTime', matchTimeEST);
      data.append('matchTokens', formData.matchTokens);
      data.append('pot', formData.pot);
    }

    setButtonText('Updating, please wait...');

    try {
      const response = await fetch(url, { method: 'POST', body: data });

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
          shadowData.append('matchType', 'SHADOW');
          shadowData.append('fighterAImageUrl', formData.fighterAImage ? formData.fighterAImage : match?.fighterAImage);
          shadowData.append('fighterBImageUrl', formData.fighterBImage ? formData.fighterBImage : match?.fighterBImage);
          shadowData.append('fighterAImageDeleteUrlFromReq', match.fighterAImageDeleteUrl);
          shadowData.append('fighterBImageDeleteUrlFromReq', match.fighterBImageDeleteUrl);
          shadowData.append('promotionBackgroundUrl', match.promotionBackground);
          shadowData.append('promotionBackgroundDeleteUrlFromReq', formData.promotionBackground ? formData.promotionBackground : match.promotionBackgroundDeleteUrl);
          shadowData.append('BoxingMatch', JSON.stringify(match.BoxingMatch));
          shadowData.append('MMAMatch', JSON.stringify(match.MMAMatch));
          shadowData.append('notify', true);

          const shadowResponse = await fetch(`${API_BASE}/addShadow`, { method: 'POST', body: shadowData });

          if (shadowResponse.ok) alert('Fight added to shadow templates successfully.');
          else console.warn('Failed to add fight to shadow templates.');
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
    <div className="admin-edit-fight-workspace">
      <section className="admin-edit-fight-banner">
        <div>
          <span>{isShadow ? 'Shadow template' : 'Production fight'}</span>
          <h3>{formData.matchName || 'Edit fight record'}</h3>
          <p>Every original edit field and submission flow remains available in a structured fight-operations form.</p>
        </div>
        <div className="admin-edit-fight-faceoff" aria-hidden="true">
          <img src={previewSource(formData.fighterAImage, FALLBACK_A)} alt="" />
          <b>VS</b>
          <img src={previewSource(formData.fighterBImage, FALLBACK_B)} alt="" />
        </div>
      </section>

      <form className="admin-edit-fight-form" onSubmit={handleSubmit}>
        <section className="admin-edit-form-section">
          <header><span><FaLayerGroup /></span><div><small>Fight identity</small><h4>Core match details</h4><p>Update the sport, title, competitors, description, and round configuration.</p></div></header>
          <div className="admin-edit-form-grid">
            <label><span>Select category</span><select name="matchCategory" value={displayCategory} onChange={handleChange}><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="Bare-knuckle">Bare-knuckle</option></select></label>
            <label><span>Match name</span><input type="text" name="matchName" value={formData.matchName} onChange={handleChange} /></label>
            <label><span>Fighter A</span><input type="text" name="matchFighterA" value={formData.matchFighterA} onChange={handleChange} /></label>
            <label><span>Fighter B</span><input type="text" name="matchFighterB" value={formData.matchFighterB} onChange={handleChange} /></label>
            <label className="is-wide"><span>Match description</span><textarea name="matchDescription" value={formData.matchDescription} onChange={handleChange} rows="5" /></label>
            <label><span>Max rounds</span><input type="number" name="maxRounds" value={formData.maxRounds} onChange={handleChange} /></label>
          </div>
        </section>

        <section className="admin-edit-form-section admin-edit-video-section">
          <header><span><FaFilm /></span><div><small>Video & visibility</small><h4>Fight video and status</h4><p>Update the regular fight video, promotional video, and public/admin status without leaving this edit screen.</p></div></header>
          <div className="admin-edit-form-grid">
            <label className="is-wide"><span>Fight video URL</span><input type="url" name="matchVideoUrl" value={formData.matchVideoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." /></label>
            <label className="is-wide"><span>Promotional video URL</span><input type="url" name="matchPromotionalVideoUrl" value={formData.matchPromotionalVideoUrl} onChange={handleChange} placeholder="Optional promo / trailer URL" /></label>
            {!isShadow && <label><span>Public fight status</span><select name="matchStatus" value={formData.matchStatus} onChange={handleChange}><option value="">Keep current</option><option value="Draft">Draft</option><option value="Scheduled">Scheduled</option><option value="Live">Live</option><option value="Open">Open</option><option value="Finished">Finished</option><option value="Closed">Closed</option></select></label>}
            {isShadow && <label><span>Shadow status</span><select name="matchShadowStatus" value={formData.matchShadowStatus} onChange={handleChange}><option value="">Keep current</option><option value="Template">Template</option><option value="Open">Open</option><option value="Live">Live</option><option value="Finished">Finished</option><option value="Closed">Closed</option></select></label>}
            {isShadow && <label><span>Shadow open status</span><select name="matchShadowOpenStatus" value={formData.matchShadowOpenStatus} onChange={handleChange}><option value="">Keep current</option><option value="Open">Open</option><option value="Closed">Closed</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>}
          </div>
        </section>

        <section className="admin-edit-form-section admin-edit-scoring-section">
          <header><span><FaSlidersH /></span><div><small>Scoring data</small><h4>Manual scoring configuration</h4><p>Use this only when you need to update stored scoring JSON. Total punches stay manual and separate from head/body punches.</p></div></header>
          <div className="admin-edit-form-grid">
            <label className="is-wide"><span>Boxing scoring JSON</span><textarea name="BoxingMatch" value={formData.BoxingMatch} onChange={handleChange} rows="7" placeholder='{"fighterOneStats":[],"fighterTwoStats":[]}' /></label>
            <label className="is-wide"><span>MMA scoring JSON</span><textarea name="MMAMatch" value={formData.MMAMatch} onChange={handleChange} rows="7" placeholder='{"fighterOneStats":[],"fighterTwoStats":[]}' /></label>
          </div>
        </section>

        {!isShadow && (
          <section className="admin-edit-form-section">
            <header><span><FaCalendarAlt /></span><div><small>Schedule & finance</small><h4>Event configuration</h4><p>Maintain the existing date, time, entry token, and prize-pot values.</p></div></header>
            <div className="admin-edit-form-grid">
              <label><span><FaCalendarAlt /> Match date</span><input type="date" name="matchDate" value={formData.matchDate} onChange={handleChange} /></label>
              <label><span><FaClock /> Match time</span><input type="time" name="matchTime" value={formData.matchTime} onChange={handleChange} /></label>
              <label><span><FaCoins /> Match tokens</span><input type="number" name="matchTokens" value={formData.matchTokens} onChange={handleChange} /></label>
              <label><span><FaTrophy /> Pot</span><input type="number" name="pot" value={formData.pot} onChange={handleChange} /></label>
            </div>
          </section>
        )}

        <section className="admin-edit-form-section">
          <header><span><FaUsers /></span><div><small>Fight artwork</small><h4>Fighter images</h4><p>Review the current artwork and optionally upload replacement fighter assets.</p></div></header>
          <div className="admin-edit-media-grid">
            <label className="admin-edit-upload-card is-red">
              <span>Fighter A image</span>
              <img src={previewSource(formData.fighterAImage, FALLBACK_A)} alt={formData.matchFighterA || 'Fighter A'} />
              <strong><FaImage /> Choose replacement</strong>
              <input type="file" name="fighterAImage" onChange={handleChange} />
              <small>{formData.matchFighterA || 'Red corner'}</small>
            </label>
            <label className="admin-edit-upload-card is-blue">
              <span>Fighter B image</span>
              <img src={previewSource(formData.fighterBImage, FALLBACK_B)} alt={formData.matchFighterB || 'Fighter B'} />
              <strong><FaImage /> Choose replacement</strong>
              <input type="file" name="fighterBImage" onChange={handleChange} />
              <small>{formData.matchFighterB || 'Blue corner'}</small>
            </label>
          </div>
        </section>

        {!isShadow && (
          <section className="admin-edit-form-section">
            <header><span><FaImage /></span><div><small>Promotion artwork</small><h4>Fight background</h4><p>Keep the current promotional artwork or choose a replacement file.</p></div></header>
            <label className="admin-edit-promotion-upload">
              <img src={previewSource(formData.promotionBackground, FALLBACK_PROMOTION)} alt="Promotion background" />
              <div><strong><FaImage /> Choose promotion background</strong><small>The selected file will be submitted through the original edit-match request.</small></div>
              <input type="file" name="promotionBackground" onChange={handleChange} />
            </label>
          </section>
        )}

        <section className="admin-edit-form-section admin-edit-shadow-section">
          <header><span><FaFistRaised /></span><div><small>Template distribution</small><h4>Shadow template setting</h4><p>Preserves the existing add-to-shadow toggle and follow-up request behavior.</p></div></header>
          <label className="admin-edit-toggle-row" htmlFor="addToShadowTemplates">
            <div><strong>In shadow templates?</strong><small>{formData.addToShadowTemplates ? 'This fight is marked for the shadow template library.' : 'This fight is not currently marked for shadow distribution.'}</small></div>
            <span className={`admin-edit-toggle ${formData.addToShadowTemplates ? 'is-active' : ''}`}>
              <input type="checkbox" id="addToShadowTemplates" checked={formData.addToShadowTemplates} onChange={() => setFormData((current) => ({ ...current, addToShadowTemplates: !current.addToShadowTemplates }))} />
              <i><FaCheck /></i>
            </span>
          </label>
        </section>

        <footer className="admin-edit-form-actions">
          <div><small>Match ID</small><strong>{matchId}</strong></div>
          <button type="submit" className="admin-primary-action"><FaSave /> {buttonText}</button>
        </footer>
      </form>
    </div>
  );
};

export default EditMatch;
