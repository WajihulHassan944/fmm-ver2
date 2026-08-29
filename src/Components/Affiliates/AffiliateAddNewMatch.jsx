import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { affiliateHeaders } from '@/Utils/authFetch';
import {
  FaBullhorn,
  FaCalendarAlt,
  FaCoins,
  FaDollarSign,
  FaInfoCircle,
  FaSave,
  FaShieldAlt,
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
    prizeMode: 'paid',
    matchTokens: '',
    affiliateId: '',
    promoterStake: '',
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

  // The default deal costs the promoter nothing: if the card fills it runs, and
  // if it does not it voids at lock and every entry is refunded. Nobody is ever
  // short — not the players, not the platform, not them.
  //
  // Staking is the optional upgrade. Put the pot up front and the card is
  // GUARANTEED: it runs however few turn up, and the shortfall comes out of the
  // stake instead of voiding. A free card has no fees, so there is nothing to
  // fill and nothing to guarantee.
  const economics = useMemo(() => {
    const free = formData.prizeMode === 'free';
    const pot = Number(formData.pot) || 0;
    const buyIn = free ? 0 : Number(formData.matchTokens) || 0;
    const stake = Number(formData.promoterStake) || 0;
    const breakEven = free || buyIn <= 0 || pot <= 0 ? 0 : Math.ceil(pot / buyIn);
    // Everything past break-even is surplus, split 50/50 with the platform.
    const atDouble = breakEven ? Math.floor((breakEven * buyIn) / 2) : 0;
    return {
      free,
      pot,
      buyIn,
      stake,
      breakEven,
      guaranteed: !free && pot > 0 && stake >= pot,
      partialStake: !free && stake > 0 && stake < pot,
      shortfall: free ? 0 : Math.max(0, pot - stake),
      profitAtDouble: atDouble,
    };
  }, [formData.matchTokens, formData.pot, formData.promoterStake, formData.prizeMode]);

  const requiredUsers = economics.breakEven;
  const leagueSize = safeArray(affiliate?.usersJoined).length;

  // Advice sized to THIS card and THIS league, not a generic tips box. A short
  // card no longer costs the promoter money — it just voids — but it still costs
  // them the thing that is harder to get back: a league that turned up and got
  // nothing. So the guidance is about protecting their audience, and it gets out
  // of the way once the numbers work.
  const coach = useMemo(() => {
    if (economics.free) {
      return {
        tone: 'ok',
        title: 'Good card to start on',
        body: 'Free cards cost you nothing but the award, so run these while you are still building. Every player who enters one joins your league and can be invited to a paid card later.',
      };
    }
    if (!requiredUsers) return null;
    if (!leagueSize) {
      return {
        tone: 'warn',
        title: 'No league members yet',
        body: `This card needs ${requiredUsers.toLocaleString()} entries to run, and nobody has joined your league yet. It will simply void and refund — no cost to you — but that is a wasted card. Run a free one first, build the list, then put money in the pot.`,
      };
    }
    // Rule of thumb from the entry data: a promoter converts a fraction of
    // their league on any single card, so break-even above the whole league is
    // a stake they will not get back.
    if (requiredUsers > leagueSize) {
      return {
        tone: 'warn',
        title: 'Bigger than your league',
        body: `You need ${requiredUsers.toLocaleString()} entries but your league is ${leagueSize.toLocaleString()}. Even a full turnout leaves it short, so it will void. Drop the pot or raise the buy-in until the fill number sits comfortably under your following.`,
      };
    }
    if (requiredUsers > Math.ceil(leagueSize / 2)) {
      return {
        tone: 'caution',
        title: 'Tight, but reachable',
        body: `It fills at ${requiredUsers.toLocaleString()} of your ${leagueSize.toLocaleString()} members — more than half have to turn up. Doable, but a card that voids twice teaches your league not to bother. Start smaller, win the room, then scale the prize.`,
      };
    }
    return {
      tone: 'ok',
      title: 'Sized right',
      body: `${requiredUsers.toLocaleString()} entries out of ${leagueSize.toLocaleString()} members and it runs, with everything past that split with the platform as profit. This is the shape you want before you go bigger.`,
    };
  }, [economics.free, leagueSize, requiredUsers]);

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

    // A part-stake is the one combination that helps nobody: it does not
    // guarantee the card, and the money is tied up anyway. Make them choose.
    if (economics.partialStake) {
      const proceed = window.confirm(
        `${economics.stake.toLocaleString()} does not cover the ${economics.pot.toLocaleString()} pot, so the card is NOT guaranteed — `
        + 'it still voids and refunds if it comes up short. Stake the full pot to guarantee it, or leave the stake at 0. Publish anyway?'
      );
      if (!proceed) { setButtonText('Publish fight promotion'); return; }
    }

    const data = new FormData();
    data.append('matchTokens', economics.free ? 0 : formData.matchTokens);
    data.append('promoterStake', economics.free ? 0 : economics.stake);
    data.append('potTarget', economics.free ? 0 : economics.pot);
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
        headers: affiliateHeaders(),
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

        <div className="affiliate-prize-mode" role="group" aria-label="Prize type">
          {[
            ['paid', 'Paid entry', 'Players buy in. Entries fund the prize.'],
            ['free', 'Free to play', 'No buy-in. Winners take apparel, crowns or awards.'],
          ].map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              className={formData.prizeMode === value ? 'is-active' : ''}
              onClick={() => setFormData((current) => ({ ...current, prizeMode: value }))}
            >
              <strong>{label}</strong>
              <small>{hint}</small>
            </button>
          ))}
        </div>

        <div className="affiliate-create-field-grid">
          <label>
            <span><FaDollarSign /> Prize pot <small>{economics.free ? 'Value of the apparel or award' : 'Winner award'}</small></span>
            <input type="number" name="pot" min="1" step="1" value={formData.pot} onChange={handleChange} required />
          </label>
          {!economics.free && (
            <label>
              <span><FaCoins /> Player buy-in <small>Tokens per entry</small></span>
              <input type="number" name="matchTokens" min="1" step="1" value={formData.matchTokens} onChange={handleChange} required />
            </label>
          )}
          {!economics.free && (
            <label className={economics.partialStake ? 'is-short' : ''}>
              <span>
                <FaShieldAlt /> Guarantee the prize
                <small>{economics.guaranteed ? 'Card runs no matter what' : 'Optional — leave at 0'}</small>
              </span>
              <input type="number" name="promoterStake" min="0" step="1" value={formData.promoterStake} onChange={handleChange} />
            </label>
          )}
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

        {economics.free ? (
          <div className="affiliate-create-capacity-note">
            <FaUsers />
            <span>
              <strong>Free card &mdash; nothing to cover</strong>
              <small>
                No buy-in, so entries never fund the prize and there is no shortfall to guard against.
                The apparel or award is a fixed cost you are choosing to carry.
              </small>
            </span>
          </div>
        ) : (
          <div className={`affiliate-stake-panel${economics.guaranteed ? ' is-covered' : ''}`}>
            <div>
              <span>{economics.guaranteed ? 'Your stake back at' : 'This card fills at'}</span>
              <strong>{requiredUsers || '—'}</strong>
              <small>
                {requiredUsers
                  ? `entries at ${economics.buyIn.toLocaleString()} each. Every entry past that is surplus, split 50/50 with the platform.`
                  : 'Enter the prize pot and buy-in to see where the card fills.'}
              </small>
            </div>
            <div>
              <span>You clear at double</span>
              <strong>{economics.profitAtDouble ? economics.profitAtDouble.toLocaleString() : '—'}</strong>
              <small>
                Your half of the surplus if {requiredUsers ? (requiredUsers * 2).toLocaleString() : 'twice break-even'} enter.
              </small>
            </div>
            <p>
              {economics.guaranteed
                ? `Guaranteed card. It runs however few turn up, and any shortfall comes out of your ${economics.stake.toLocaleString()} — never out of the players' prize.`
                : `Costs you nothing to run. If it fills, it goes ahead; if it comes up short it voids at lock and every entry is refunded automatically. Stake ${economics.pot.toLocaleString()} to guarantee it runs either way.`}
            </p>
          </div>
        )}

        {coach && (
          <aside className={`affiliate-coach is-${coach.tone}`}>
            <strong>{coach.title}</strong>
            <p>{coach.body}</p>
          </aside>
        )}

        <button type="submit" className="theme-btn theme-btn-primary affiliate-create-submit" disabled={buttonText !== 'Publish fight promotion'}>
          <FaSave /> {buttonText}
        </button>
      </form>
    </section>
  );
};

export default AffiliateAddNewMatch;
