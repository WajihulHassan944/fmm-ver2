
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaArrowRight, FaCalendarAlt, FaSignOutAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';

const isSameId = (a, b) => String(a || '') === String(b || '');
const joinedUsers = (affiliate) => Array.isArray(affiliate?.usersJoined) ? affiliate.usersJoined : [];

const Leagues = () => {
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [affiliates, setAffiliates] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [leavingAffiliateId, setLeavingAffiliateId] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates');
        const data = await response.json();
        setAffiliates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching affiliates:', error);
      }
    };
    fetchAffiliates();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const joinedLeagues = useMemo(() => affiliates.filter((affiliate) => joinedUsers(affiliate).some((joinedUser) => isSameId(joinedUser.userId, user?._id))), [affiliates, user?._id]);
  const openLeagues = useMemo(() => affiliates.filter((affiliate) => !joinedUsers(affiliate).some((joinedUser) => isSameId(joinedUser.userId, user?._id))), [affiliates, user?._id]);

  const getLeagueUpcoming = (affiliateId) => (Array.isArray(matches) ? matches : [])
    .filter((match) => isSameId(match.affiliateId, affiliateId) && match.matchDate?.split('T')[0] >= today)
    .map((match) => match.matchName || `${match.matchFighterA || 'Fighter A'} vs ${match.matchFighterB || 'Fighter B'}`);

  const handleJoinLeague = async (affiliate) => {
    const userId = user._id;
    const userEmail = user.email;
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/join`, {
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

  const handleLeaveLeague = async (affiliate) => {
    setLeavingAffiliateId(affiliate._id);
    try {
      const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/remove-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      if (!res.ok) throw new Error('Failed to leave league');
      alert('Successfully left the league');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('An error occurred while trying to leave the league.');
    } finally {
      setLeavingAffiliateId(null);
    }
  };

  const openUpcomingPopup = (affiliateId) => {
    setUpcomingMatches(getLeagueUpcoming(affiliateId));
    setShowPopup(true);
  };

  if (!user || !user.firstName) {
    return <section className="xp-league-page"><div className="theme-container"><div className="xp-empty-card">Loading league records...</div></div></section>;
  }

  const renderLeagueCard = (affiliate, joined) => {
    const upcoming = getLeagueUpcoming(affiliate._id);
    const joinedRecord = joinedUsers(affiliate).find((joinedUser) => isSameId(joinedUser.userId, user._id));
    return (
      <article className="xp-league-card" key={affiliate._id}>
        <button type="button" className={`xp-league-avatar ${upcoming.length ? 'has-upcoming' : ''}`} onClick={() => upcoming.length && openUpcomingPopup(affiliate._id)}>
          <img src={affiliate.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={`${affiliate.firstName || 'Affiliate'} ${affiliate.lastName || ''}`} />
        </button>
        <div className="xp-league-card-copy">
          <span>{joined ? 'Joined league' : 'Open creator league'}</span>
          <h3>{affiliate.firstName} {affiliate.lastName}</h3>
          <p>{joined ? `Joined: ${joinedRecord?.joinedAt ? new Date(joinedRecord.joinedAt).toLocaleDateString() : 'Record available'}` : 'Join this creator community and follow upcoming fight cards.'}</p>
        </div>
        <div className="xp-league-card-stats">
          <span><FaUsers /> {joinedUsers(affiliate).length} users</span>
          <button type="button" onClick={() => openUpcomingPopup(affiliate._id)}><FaCalendarAlt /> {upcoming.length} upcoming</button>
        </div>
        {joined ? (
          <button className="theme-btn theme-btn-secondary" type="button" onClick={() => handleLeaveLeague(affiliate)} disabled={leavingAffiliateId === affiliate._id}>
            <FaSignOutAlt /> {leavingAffiliateId === affiliate._id ? 'Leaving...' : 'Leave'}
          </button>
        ) : (
          <button className="theme-btn theme-btn-primary" type="button" onClick={() => handleJoinLeague(affiliate)}>
            Join now <FaArrowRight />
          </button>
        )}
      </article>
    );
  };

  return (
    <section className="xp-league-page">
      <div className="theme-container">
        <button className="xp-dashboard-back" type="button" onClick={() => router.push(-1)}>← Back</button>
        <div className="xp-league-hero">
          <div>
            <span><FaTrophy /> League records</span>
            <h1>Your league footprint.</h1>
            <p>Review joined creator leagues, discover open communities, and preview upcoming league fights. All join and leave actions still use the original endpoints.</p>
          </div>
          <div className="xp-league-hero-stats">
            <article><strong>{joinedLeagues.length}</strong><span>Joined</span></article>
            <article><strong>{openLeagues.length}</strong><span>Open</span></article>
            <article><strong>{affiliates.length}</strong><span>Total leagues</span></article>
          </div>
        </div>

        <div className="xp-league-layout">
          <section>
            <div className="xp-dashboard-section-heading"><span>01</span><div><h2>Joined leagues</h2><p>Communities you are already part of.</p></div></div>
            <div className="xp-league-grid">{joinedLeagues.length ? joinedLeagues.map((affiliate) => renderLeagueCard(affiliate, true)) : <div className="xp-empty-card">No joined leagues yet.</div>}</div>
          </section>
          <section>
            <div className="xp-dashboard-section-heading"><span>02</span><div><h2>Open leagues</h2><p>Creator communities you can join now.</p></div></div>
            <div className="xp-league-grid">{openLeagues.length ? openLeagues.map((affiliate) => renderLeagueCard(affiliate, false)) : <div className="xp-empty-card">No open leagues available.</div>}</div>
          </section>
        </div>
      </div>

      {showPopup && (
        <div className="xp-modal-backdrop" onClick={() => setShowPopup(false)}>
          <div className="xp-dashboard-modal" onClick={(event) => event.stopPropagation()}>
            <button className="xp-modal-close" type="button" onClick={() => setShowPopup(false)}>×</button>
            <h2>Upcoming matches</h2>
            {upcomingMatches.length ? <ul className="xp-league-match-list">{upcomingMatches.map((matchName, index) => <li key={`${matchName}-${index}`}>{matchName}</li>)}</ul> : <p>No upcoming matches for this league.</p>}
            <button className="theme-btn theme-btn-secondary" type="button" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Leagues;
