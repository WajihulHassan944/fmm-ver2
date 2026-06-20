import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowRight, FaChevronDown, FaCrown, FaGift, FaSearch, FaShieldAlt, FaTrophy, FaUserFriends } from 'react-icons/fa';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE, safeArray } from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_IMAGES = [
  `${FMM_ASSET_BASE}/fighter-jadden-addison.png`,
  `${FMM_ASSET_BASE}/fighter-zaveer-davis.png`,
  `${FMM_ASSET_BASE}/fighter-conor-benn.png`,
  `${FMM_ASSET_BASE}/fighter-chris-eubank-jr.png`,
];

const getLeagueName = (affiliate) => affiliate?.leagueName || affiliate?.playerName || `${affiliate?.firstName || 'Fantasy'} ${affiliate?.lastName || 'League'}`.trim();
const getLeagueId = (affiliate) => affiliate?._id || affiliate?.id;
const getMembers = (affiliate) => safeArray(affiliate?.usersJoined);

const FantasyLeagues = () => {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [affiliates, setAffiliates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [openLeagueId, setOpenLeagueId] = useState(null);
  const [joiningLeagueId, setJoiningLeagueId] = useState(null);
  const autoJoinAttempted = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [affiliatesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/affiliates`),
        fetch(`${API_BASE}/users`),
      ]);
      if (!affiliatesRes.ok || !usersRes.ok) throw new Error('Unable to load leagues');
      const [affiliatesData, usersData] = await Promise.all([affiliatesRes.json(), usersRes.json()]);
      setAffiliates(safeArray(affiliatesData?.data || affiliatesData));
      setUsers(safeArray(usersData?.data || usersData));
    } catch (error) {
      console.error(error);
      toast.error('The league directory could not be loaded.');
      setAffiliates([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getMemberProfile = (member) => users.find((item) => String(item?._id) === String(member?.userId));
  const hasJoined = useCallback((affiliate) => Boolean(user?._id && getMembers(affiliate).some((member) => String(member?.userId) === String(user._id))), [user?._id]);

  const handleJoinLeague = useCallback(async (affiliate) => {
    const leagueId = getLeagueId(affiliate);
    if (!leagueId) return;
    if (!isAuthenticated || !user?._id || !user?.email) {
      if (typeof window !== 'undefined') sessionStorage.setItem('pendingLeagueId', String(leagueId));
      router.push({ pathname: '/auth', query: { mode: 'login', role: 'player', next: '/FantasyLeagues', league: leagueId } });
      return;
    }
    if (hasJoined(affiliate)) {
      toast.info('You are already part of this league.');
      return;
    }

    setJoiningLeagueId(leagueId);
    try {
      const response = await fetch(`${API_BASE}/affiliate/${leagueId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, userEmail: user.email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to join league');
      toast.success(`You joined ${getLeagueName(affiliate)}.`);
      if (typeof window !== 'undefined') sessionStorage.removeItem('pendingLeagueId');
      await loadData();
      router.replace('/FantasyLeagues', undefined, { shallow: true });
    } catch (error) {
      toast.error(error.message || 'Unable to join this league.');
    } finally {
      setJoiningLeagueId(null);
    }
  }, [hasJoined, isAuthenticated, loadData, router, user?._id, user?.email]);

  useEffect(() => {
    if (!router.isReady || !isAuthenticated || !user?._id || autoJoinAttempted.current || loading) return;
    const queryLeague = Array.isArray(router.query.league) ? router.query.league[0] : router.query.league;
    const storedLeague = typeof window !== 'undefined' ? sessionStorage.getItem('pendingLeagueId') : null;
    const pendingId = queryLeague || storedLeague;
    if (!pendingId) return;
    const affiliate = affiliates.find((item) => String(getLeagueId(item)) === String(pendingId));
    if (!affiliate) return;
    autoJoinAttempted.current = true;
    handleJoinLeague(affiliate);
  }, [affiliates, handleJoinLeague, isAuthenticated, loading, router.isReady, router.query.league, user?._id]);

  const leagues = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = affiliates.filter((affiliate) => {
      const haystack = `${getLeagueName(affiliate)} ${affiliate?.firstName || ''} ${affiliate?.lastName || ''} ${affiliate?.rewardTitle || ''}`.toLowerCase();
      return !needle || haystack.includes(needle);
    });
    return [...result].sort((a, b) => {
      if (sort === 'newest') return new Date(b?.dateCreated || b?.createdAt || 0) - new Date(a?.dateCreated || a?.createdAt || 0);
      if (sort === 'name') return getLeagueName(a).localeCompare(getLeagueName(b));
      return getMembers(b).length - getMembers(a).length;
    });
  }, [affiliates, search, sort]);

  const totalMembers = affiliates.reduce((sum, affiliate) => sum + getMembers(affiliate).length, 0);
  const rewardLeagues = affiliates.filter((affiliate) => affiliate?.rewardTitle).length;

  return (
    <>
      <Head>
        <title>Fantasy Leagues | Fantasy MMAdness</title>
        <meta name="description" content="Discover and join creator-led Fantasy MMAdness leagues, compete on community leaderboards, and follow special fight rewards." />
      </Head>
      <div className="experience-page leagues-experience-page">
        <ExperienceHero
          eyebrow="Creator-led competition"
          title="Your fight picks."
          accent="Your league. Your people."
          description="Join a creator or affiliate league, enter the same fight cards, and compete inside a community with its own identity, members, and rewards."
          backgroundImage={`${FMM_ASSET_BASE}/fighter-action-blue.jpg`}
          actions={[
            { href: '#league-directory', label: 'Explore leagues' },
            { href: '/auth?mode=signup&role=affiliate', label: 'Launch a league', variant: 'secondary' },
          ]}
          stats={[
            { value: affiliates.length, label: 'Active leagues', icon: FaTrophy },
            { value: totalMembers, label: 'League members', icon: FaUserFriends },
            { value: rewardLeagues, label: 'Reward leagues', icon: FaGift },
          ]}
        >
          <div className="xp-league-hero-card">
            <img src={`${FMM_ASSET_BASE}/fighter-conor-benn.png`} alt="League contender" />
            <div className="xp-league-hero-card-copy">
              <span><FaCrown /> Featured league format</span>
              <h2>Fight-night rivalry, built around a community.</h2>
              <div className="xp-league-mini-standings">
                <div><strong>01</strong><span>Make picks</span></div>
                <div><strong>02</strong><span>Score points</span></div>
                <div><strong>03</strong><span>Top the league</span></div>
              </div>
            </div>
          </div>
        </ExperienceHero>

        <main className="xp-page-main" id="league-directory">
          <div className="theme-container">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Public league directory"
                title="Find your corner"
                description="Search the live affiliate directory, compare community size and rewards, then join with your player account."
              />

              <div className="xp-directory-toolbar xp-league-toolbar">
                <label className="xp-search-field"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search league or creator..." /></label>
                <label className="xp-select-wrap"><span>Sort leagues</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popular">Most members</option><option value="newest">Newest</option><option value="name">Name A–Z</option></select></label>
              </div>

              {loading ? (
                <div className="xp-loading-grid">{[0, 1, 2].map((item) => <div className="xp-loading-card" key={item} />)}</div>
              ) : leagues.length > 0 ? (
                <div className="xp-league-grid">
                  {leagues.map((affiliate, index) => {
                    const leagueId = getLeagueId(affiliate);
                    const members = getMembers(affiliate);
                    const joined = hasJoined(affiliate);
                    const isOpen = openLeagueId === leagueId;
                    return (
                      <article className={`xp-league-card ${affiliate?.rewardTitle ? 'has-reward' : ''}`} key={leagueId || index}>
                        <div className="xp-league-card-top">
                          <span className="xp-league-rank">#{String(index + 1).padStart(2, '0')}</span>
                          {affiliate?.rewardTitle && <span className="xp-league-reward"><FaGift /> {affiliate.rewardTitle}</span>}
                        </div>
                        <div className="xp-league-avatar-wrap">
                          <div className="xp-league-avatar-ring"><img src={affiliate?.profileUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={getLeagueName(affiliate)} loading="lazy" /></div>
                          <div className="xp-league-avatar-light" />
                        </div>
                        <div className="xp-league-card-copy">
                          <span>Creator league</span>
                          <h3>{getLeagueName(affiliate)}</h3>
                          <p>Compete on every eligible card and measure your fight IQ against this community.</p>
                        </div>
                        <div className="xp-league-card-meta">
                          <button type="button" onClick={() => setOpenLeagueId(isOpen ? null : leagueId)}><FaUserFriends /> {members.length} members <FaChevronDown className={isOpen ? 'is-open' : ''} /></button>
                          <span><FaShieldAlt /> Public</span>
                        </div>
                        <button type="button" className={`theme-btn ${joined ? 'theme-btn-secondary' : 'theme-btn-primary'} xp-league-join`} onClick={() => handleJoinLeague(affiliate)} disabled={joined || joiningLeagueId === leagueId}>
                          {joined ? 'Joined' : joiningLeagueId === leagueId ? 'Joining...' : isAuthenticated ? 'Join league' : 'Sign in to join'}
                        </button>
                        {isOpen && (
                          <div className="xp-league-members">
                            <strong>League members</strong>
                            {members.length ? members.slice(0, 8).map((member, memberIndex) => {
                              const profile = getMemberProfile(member);
                              return (
                                <div key={`${member?.userId}-${memberIndex}`}>
                                  <img src={profile?.profileUrl || FALLBACK_IMAGES[memberIndex % FALLBACK_IMAGES.length]} alt={profile?.firstName || 'League member'} />
                                  <span>{[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Fantasy player'}</span>
                                </div>
                              );
                            }) : <p>No members yet. Be the first in the corner.</p>}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <ExperienceEmptyState title="No leagues match that search" description="Remove the search term or check back as new creator leagues are approved." />
              )}
            </section>

            <section className="xp-league-launch-banner">
              <div className="xp-league-launch-art"><img src={`${FMM_ASSET_BASE}/fighter-duel-panel.jpg`} alt="Creator league fight night" /></div>
              <div>
                <p className="xp-eyebrow">For affiliates & creators</p>
                <h2>Turn your audience into a fight-night league.</h2>
                <p>Apply once, promote approved fight templates, grow your member base, and give your community a permanent place to compete.</p>
                <Link href="/auth?mode=signup&role=affiliate" className="theme-btn theme-btn-primary">Apply as an affiliate <FaArrowRight /></Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default FantasyLeagues;
