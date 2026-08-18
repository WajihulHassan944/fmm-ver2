import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaArrowRight,
  FaCheckCircle,
  FaCoins,
  FaCrown,
  FaShieldAlt,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import { getFightCategory, getFightRounds, safeArray } from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const PromoTwo = ({ matchId, affiliateId }) => {
  const dispatch = useDispatch();
  const [affiliate, setAffiliate] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const match = useMemo(
    () => safeArray(matches).find((item) => String(item?.shadowFightId || '') === String(matchId || '') && String(item?.affiliateId || '') === String(affiliateId || '')),
    [affiliateId, matchId, matches],
  );

  useEffect(() => {
    let active = true;

    const fetchAffiliates = async () => {
      setAffiliateLoading(true);
      try {
        const response = await fetch(`${API_BASE}/affiliates`);
        if (!response.ok) throw new Error('Failed to fetch affiliates');
        const affiliates = await response.json();
        const matchedAffiliate = safeArray(affiliates).find((item) => String(item?._id || '') === String(affiliateId || ''));
        if (active) setAffiliate(matchedAffiliate || null);
      } catch (error) {
        console.error('Error fetching affiliates:', error);
        if (active) setAffiliate(null);
      } finally {
        if (active) setAffiliateLoading(false);
      }
    };

    fetchAffiliates();
    return () => {
      active = false;
    };
  }, [affiliateId]);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  const handleJoinLeague = async () => {
    if (!isAuthenticated) {
      window.open('/login', '_blank');
      return;
    }

    const userId = user._id;
    const userEmail = user.email;

    try {
      const response = await fetch(`${API_BASE}/affiliate/${affiliate._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });

      if (response.ok) {
        alert('Successfully joined the league');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  if (affiliateLoading || matchStatus === 'loading') {
    return <div className="public-promo-loading">Preparing the creator fight room…</div>;
  }

  if (!affiliate || !match) {
    return <div className="public-promo-loading is-error">This promoted campaign is not currently available.</div>;
  }

  const affiliateName = [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || 'Affiliate';
  const memberCount = safeArray(affiliate.usersJoined).length;
  const category = getFightCategory(match);

  return (
    <section className="public-promo-experience">
      <div className="public-promo-ambient" aria-hidden="true" />
      <div className="public-promo-stage">
        <div className="public-promo-copy">
          <p className="xp-eyebrow"><FaCrown /> {affiliateName}&apos;s featured campaign</p>
          <span className="public-promo-live"><i /> Creator league promotion</span>
          <h1>{match.matchName || `${match.matchFighterA} vs ${match.matchFighterB}`}</h1>
          <p>
            Enter a premium creator-led fight room, join the league, and put your round-by-round
            prediction against the rest of the community.
          </p>
          <div className="public-promo-meta">
            <span><FaTrophy /> {category}</span>
            <span><FaCoins /> {match.matchTokens || 0} token entry</span>
            <span><FaUsers /> {memberCount} league members</span>
          </div>
          <button type="button" className="theme-btn theme-btn-primary public-promo-join" onClick={handleJoinLeague}>
            <FaUserPlus /> Join {affiliate.firstName || 'creator'}&apos;s league <FaArrowRight />
          </button>
          <div className="public-promo-trust"><FaShieldAlt /><span><strong>Existing league flow</strong><small>Authentication, membership checks, and join API behavior remain unchanged.</small></span></div>
        </div>

        <div className="public-promo-fight-card">
          <div className="public-promo-fighter is-a">
            <img src={match.fighterAImage} alt={match.matchFighterA || 'Fighter A'} />
            <span>{match.matchFighterA || 'Fighter A'}</span>
          </div>
          <div className="public-promo-versus"><small>{category}</small><strong>VS</strong><em>{getFightRounds(match)}</em></div>
          <div className="public-promo-fighter is-b">
            <img src={match.fighterBImage} alt={match.matchFighterB || 'Fighter B'} />
            <span>{match.matchFighterB || 'Fighter B'}</span>
          </div>
          <div className="public-promo-prize-strip">
            <span><small>Prize pot</small><strong>${Number(match.pot || 0).toLocaleString()}</strong></span>
            <span><small>Entry</small><strong>{match.matchTokens || 0} tokens</strong></span>
            <span><small>Status</small><strong><FaCheckCircle /> Approved</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoTwo;
