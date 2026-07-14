import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FaBullhorn,
  FaCalendarAlt,
  FaCoins,
  FaDollarSign,
  FaInfoCircle,
  FaSave,
  FaUsers,
} from 'react-icons/fa';
import {
  FMM_ASSET_BASE,
  getFightCategory,
  getFighterImage,
  safeArray,
} from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const AffiliateAddNewMatch = ({ matchId }) => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const [promoMatches, setPromoMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [buttonText, setButtonText] = useState('Publish fight promotion');
  const [formData, setFormData] = useState({
    shadowFightId: '',
    matchTokens: '',
    affiliateId: '',
    pot: '',
    profit: '',
    amountOverPotBudget: '',
    matchDate: '',
    matchTime: '',
    matchCategoryTwo: '',
  });

  useEffect(() => {
    let active = true;

    const fetchPromoMatches = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${API_BASE}/shadow`);
        if (!response.ok) throw new Error('Failed to fetch promo matches');
        const data = await response.json();
        if (active) setPromoMatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (active) {
          setPromoMatches([]);
          setLoadError('The approved fight template could not be loaded.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPromoMatches();
    return () => {
      active = false;
    };
  }, []);

  const promoDetails = useMemo(
    () => safeArray(promoMatches).find((match) => String(match?._id || '') === String(matchId || '')),
    [matchId, promoMatches],
  );

  useEffect(() => {
    if (!promoDetails) return;

    setFormData((current) => ({
      ...current,
      matchTokens: current.matchTokens || promoDetails.matchTokens || '',
      pot: current.pot || promoDetails.pot || '',
      profit: current.profit || promoDetails.profit || '',
      amountOverPotBudget: current.amountOverPotBudget || promoDetails.amountOverPotBudget || '',
      matchDate: current.matchDate || String(promoDetails.matchDate || '').slice(0, 10),
      matchTime: current.matchTime || String(promoDetails.matchTime || '').slice(0, 5),
    }));
  }, [promoDetails]);

  const requiredUsers = useMemo(() => {
    const pot = Number(formData.pot);
    const buyIn = Number(formData.matchTokens);
    if (!Number.isFinite(pot) || !Number.isFinite(buyIn) || pot <= 0 || buyIn <= 0) return 0;
    return Math.ceil(pot / buyIn);
  }, [formData.matchTokens, formData.pot]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const url = `${API_BASE}/addMatch`;
    const matchDetails = promoMatches.find((match) => match._id === matchId);

    if (!matchDetails) {
      alert('Match not found!');
      return;
    }

    const localDateTime = new Date(`${formData.matchDate}T${formData.matchTime}:00`);
    const matchTimeEST = localDateTime.toTimeString().substring(0, 5);
    const matchDate = formData.matchDate.split('T')[0];

    const data = new FormData();
    data.append('matchTokens', formData.matchTokens);
    data.append('shadowFightId', matchDetails._id);
    data.append('affiliateId', affiliate._id);
    data.append('pot', formData.pot);
    data.append('profit', formData.profit);
    data.append('amountOverPotBudget', formData.amountOverPotBudget);
    data.append('matchDate', matchDate);
    data.append('matchTime', matchTimeEST);
    data.append('fighterAImageUrl', matchDetails.fighterAImage);
    data.append('fighterBImageUrl', matchDetails.fighterBImage);
    data.append('fighterAImageDeleteUrlFromReq', matchDetails.fighterAImageDeleteUrl);
    data.append('fighterBImageDeleteUrlFromReq', matchDetails.fighterBImageDeleteUrl);
    data.append('promotionBackgroundUrl', matchDetails.promotionBackground);
    data.append('promotionBackgroundDeleteUrlFromReq', matchDetails.promotionBackgroundDeleteUrl);
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
    data.append('BoxingMatch', JSON.stringify(matchDetails.BoxingMatch));
    data.append('MMAMatch', JSON.stringify(matchDetails.MMAMatch));

    setButtonText('Saving, please wait...');

    try {
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
      setButtonText('Publish fight promotion');
    }
  };

  if (loading) {
    return <div className="affiliate-create-loading">Loading approved fight template…</div>;
  }

  if (loadError) {
    return <div className="affiliate-create-loading is-error">{loadError}</div>;
  }

  if (!promoDetails || !affiliate) {
    return <div className="affiliate-create-loading">Preparing campaign workspace…</div>;
  }

  const memberCount = safeArray(affiliate.usersJoined).length;
  const fullName = [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || affiliate.playerName || 'Affiliate';

  return (
    <section className="affiliate-create-promotion affiliate-create-promotion-premium">
      <header className="affiliate-create-header">
        <div className="affiliate-create-identity">
          <img src={affiliate.profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.webp`} alt={fullName} />
          <span>
            <small><FaBullhorn /> Promotion owner</small>
            <strong>{fullName}</strong>
            <em><FaUsers /> {memberCount} league members</em>
          </span>
        </div>

        <div className="affiliate-create-fight-summary">
          <figure>
            <img src={getFighterImage(promoDetails, 'A')} alt={promoDetails.matchFighterA || 'Fighter A'} />
            <figcaption>{promoDetails.matchFighterA || 'Fighter A'}</figcaption>
          </figure>
          <div>
            <span>{getFightCategory(promoDetails)}</span>
            <strong>VS</strong>
            <small>{promoDetails.matchName || 'Approved fight template'}</small>
          </div>
          <figure>
            <img src={getFighterImage(promoDetails, 'B')} alt={promoDetails.matchFighterB || 'Fighter B'} />
            <figcaption>{promoDetails.matchFighterB || 'Fighter B'}</figcaption>
          </figure>
        </div>
      </header>

      <form className="affiliate-create-form" onSubmit={handleSubmit}>
        <div className="affiliate-create-form-heading">
          <div>
            <p>Campaign configuration</p>
            <h2>Create a promo for this fight</h2>
          </div>
          <span><FaInfoCircle /> Configure the prize pool, entry cost, schedule, and commercial values before publishing the campaign.</span>
        </div>

        <div className="affiliate-create-field-grid">
          <label>
            <span><FaDollarSign /> Prize pot <small>Winner award</small></span>
            <input type="number" name="pot" min="1" step="1" value={formData.pot} onChange={handleChange} required />
          </label>
          <label>
            <span><FaCoins /> Player buy-in <small>Tokens per entry</small></span>
            <input type="number" name="matchTokens" min="1" step="1" value={formData.matchTokens} onChange={handleChange} required />
          </label>
          <label>
            <span><FaCalendarAlt /> Promotion date <small>Local calendar date</small></span>
            <input type="date" name="matchDate" value={formData.matchDate} onChange={handleChange} required />
          </label>
          <label>
            <span><FaCalendarAlt /> Start time <small>Local fight time</small></span>
            <input type="time" name="matchTime" value={formData.matchTime} onChange={handleChange} required />
          </label>
          <label>
            <span><FaDollarSign /> Projected profit <small>Optional manual value</small></span>
            <input type="number" name="profit" min="0" step="0.01" value={formData.profit} onChange={handleChange} />
          </label>
          <label>
            <span><FaDollarSign /> Amount over budget <small>Optional manual value</small></span>
            <input type="number" name="amountOverPotBudget" min="0" step="0.01" value={formData.amountOverPotBudget} onChange={handleChange} />
          </label>
        </div>

        <div className="affiliate-create-capacity-note">
          <FaUsers />
          <span>
            <strong>{requiredUsers || '—'} players required</strong>
            <small>
              {requiredUsers
                ? `At least ${requiredUsers} paid entries are needed for the buy-ins to cover the configured prize pot.`
                : 'Enter the prize pot and buy-in to preview the minimum campaign capacity.'}
            </small>
          </span>
        </div>

        <button type="submit" className="theme-btn theme-btn-primary affiliate-create-submit" disabled={buttonText !== 'Publish fight promotion'}>
          <FaSave /> {buttonText}
        </button>
      </form>
    </section>
  );
};

export default AffiliateAddNewMatch;
