import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaChevronDown,
  FaCrown,
  FaGift,
  FaSearch,
  FaShieldAlt,
  FaTrophy,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import styles from './FantasyLeagues.module.css';
import { useSelector } from 'react-redux';
import Login from '@/Components/Login/Login';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const safeArray = (value) => (Array.isArray(value) ? value : []);

const FantasyLeagues = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [users, setUsers] = useState([]);
  const [openCardIds, setOpenCardIds] = useState({});
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [pendingAffiliateJoin, setPendingAffiliateJoin] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const fetchLeagueData = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [affiliatesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/affiliates`),
        fetch(`${API_BASE}/users`),
      ]);

      if (!affiliatesRes.ok || !usersRes.ok) {
        throw new Error('League directory could not be loaded.');
      }

      const affiliatesData = await affiliatesRes.json();
      const usersData = await usersRes.json();

      setAffiliates(safeArray(affiliatesData));
      setUsers(safeArray(usersData));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAffiliates([]);
      setUsers([]);
      setLoadError('The fantasy league directory is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagueData();
  }, []);

  const userDirectory = useMemo(
    () => new Map(users.map((directoryUser) => [String(directoryUser?._id || ''), directoryUser])),
    [users],
  );

  const visibleAffiliates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return affiliates;

    return affiliates.filter((affiliate) => {
      const searchable = [
        affiliate?.firstName,
        affiliate?.lastName,
        affiliate?.playerName,
        affiliate?.rewardTitle,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [affiliates, query]);

  const totalMembers = useMemo(
    () => affiliates.reduce((total, affiliate) => total + safeArray(affiliate?.usersJoined).length, 0),
    [affiliates],
  );

  const rewardLeagues = useMemo(
    () => affiliates.filter((affiliate) => Boolean(affiliate?.rewardTitle)).length,
    [affiliates],
  );

  const toggleDropdown = (id) => {
    setOpenCardIds((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const hasUserJoined = (affiliate) => {
    if (!user?._id) return false;
    return safeArray(affiliate?.usersJoined).some(
      (joinedUser) => String(joinedUser?.userId || '') === String(user._id),
    );
  };

  useEffect(() => {
    if (isAuthenticated && user?._id && pendingAffiliateJoin) {
      handleJoinLeague(pendingAffiliateJoin);
      setPendingAffiliateJoin(null);
    }
    // handleJoinLeague intentionally uses current authenticated user data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, pendingAffiliateJoin]);

  const handleLoginSuccess = () => {
    setRedirectToLogin(false);
  };

  const handleJoinBtnClick = (affiliate) => {
    if (!isAuthenticated) {
      setRedirectToLogin(true);
      setPendingAffiliateJoin(affiliate);
      return;
    }

    handleJoinLeague(affiliate);
  };

  const handleJoinLeague = async (affiliate) => {
    const userId = user?._id;
    const userEmail = user?.email;

    if (!userId || !userEmail || !affiliate?._id) {
      console.warn('User or league information is not available yet.');
      return;
    }

    setJoiningId(affiliate._id);

    try {
      const response = await fetch(`${API_BASE}/affiliate/${affiliate._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });

      if (response.ok) {
        alert('Successfully joined the league');
        const updatedRes = await fetch(`${API_BASE}/affiliates`);
        const updatedAffiliates = await updatedRes.json();
        setAffiliates(safeArray(updatedAffiliates));
      } else {
        const data = await response.json();
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error('Error joining league:', error);
    } finally {
      setJoiningId(null);
    }
  };

  if (redirectToLogin) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Head>
        <title>Fantasy Leagues | Fantasy MMAdness</title>
        <meta
          name="description"
          content="Discover creator-led fantasy fight leagues, inspect their communities, and join through the existing Fantasy MMAdness league flow."
        />
      </Head>

      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><FaTrophy /> Community fight leagues</p>
              <h1>Pick your corner. <span>Climb the ranks.</span></h1>
              <p className={styles.heroDescription}>
                Join creator-led leagues, predict the same fight cards, and build your reputation inside a dedicated fight-night community.
              </p>
              <div className={styles.heroActions}>
                <a href="#league-directory" className={styles.primaryAction}>Explore leagues <FaArrowRight /></a>
                <a href="/myLeagueRecords" className={styles.secondaryAction}>My league records</a>
              </div>
            </div>

            <aside className={styles.heroScorecard}>
              <div className={styles.heroScorecardTop}>
                <span><FaCrown /> League night</span>
                <strong>Live directory</strong>
              </div>
              <div className={styles.heroStatGrid}>
                <article><strong>{affiliates.length}</strong><span>Active leagues</span></article>
                <article><strong>{totalMembers}</strong><span>League members</span></article>
                <article><strong>{rewardLeagues}</strong><span>Reward leagues</span></article>
              </div>
              <p><FaShieldAlt /> Joining still uses the existing account and affiliate league APIs.</p>
            </aside>
          </div>
        </section>

        <main className={styles.main} id="league-directory">
          <div className={styles.container}>
            <header className={styles.directoryHeader}>
              <div>
                <p className={styles.eyebrow}>League registry</p>
                <h2>Find your fight community</h2>
                <p>Search by creator, league identity, or available reward.</p>
              </div>
              <label className={styles.searchBox}>
                <FaSearch />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search fantasy leagues"
                  aria-label="Search fantasy leagues"
                />
              </label>
            </header>

            {isLoading ? (
              <div className={styles.loadingGrid} aria-label="Loading fantasy leagues">
                {Array.from({ length: 6 }).map((_, index) => <div key={index} className={styles.loadingCard} />)}
              </div>
            ) : loadError ? (
              <section className={styles.emptyState}>
                <FaShieldAlt />
                <h3>League directory unavailable</h3>
                <p>{loadError}</p>
                <button type="button" onClick={fetchLeagueData}>Try again</button>
              </section>
            ) : visibleAffiliates.length ? (
              <div className={styles.grid}>
                {visibleAffiliates.map((affiliate, index) => {
                  const affiliateId = affiliate?._id || `league-${index}`;
                  const members = safeArray(affiliate?.usersJoined);
                  const joined = isAuthenticated && hasUserJoined(affiliate);
                  const isOpen = Boolean(openCardIds[affiliateId]);
                  const leagueName = affiliate?.playerName
                    || [affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ')
                    || `Fight League ${index + 1}`;

                  return (
                    <article className={styles.card} key={affiliateId}>
                      <div className={styles.cardGlow} aria-hidden="true" />
                      <header className={styles.cardHeader}>
                        <span className={styles.cardIndex}>#{String(index + 1).padStart(2, '0')}</span>
                        <span className={styles.cardStatus}><i /> Open league</span>
                      </header>

                      <div className={styles.identityRow}>
                        <div className={styles.logoWrapper}>
                          <img
                            src={affiliate?.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'}
                            alt={leagueName}
                            className={styles.logo}
                          />
                          <span><FaBolt /></span>
                        </div>
                        <div className={styles.details}>
                          <p>Creator-led fight league</p>
                          <h3>{leagueName}</h3>
                          <span>{[affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ') || 'Fantasy MMAdness creator'}</span>
                        </div>
                      </div>

                      <div className={styles.cardMetrics}>
                        <div><FaUsers /><span><strong>{members.length}</strong><small>Members</small></span></div>
                        <div><FaTrophy /><span><strong>{affiliate?.rewardTitle ? 'Reward' : 'Ranked'}</strong><small>Format</small></span></div>
                      </div>

                      {affiliate?.rewardTitle && (
                        <div className={styles.rewardPanel}>
                          <div className={styles.rewardVisual}>
                            {affiliate?.rewardImageUrl ? <img src={affiliate.rewardImageUrl} alt="" /> : <FaGift />}
                          </div>
                          <div><span>Featured reward</span><strong>{affiliate.rewardTitle}</strong></div>
                        </div>
                      )}

                      <p className={styles.description}>
                        Compete on upcoming fight cards, compare predictions with this community, and chase the league standings.
                      </p>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.memberButton}
                          onClick={() => toggleDropdown(affiliateId)}
                          aria-expanded={isOpen}
                        >
                          <FaUser /> View members <FaChevronDown className={isOpen ? styles.chevronOpen : ''} />
                        </button>
                        <button
                          type="button"
                          className={joined ? styles.joinedButton : styles.joinButton}
                          onClick={() => handleJoinBtnClick(affiliate)}
                          disabled={joined || joiningId === affiliateId}
                        >
                          {joiningId === affiliateId ? 'Joining…' : joined ? <><FaCheck /> Joined</> : <>Join league <FaArrowRight /></>}
                        </button>
                      </div>

                      {isOpen && (
                        <div className={styles.memberRoster}>
                          <div className={styles.memberRosterHeader}>
                            <strong>League roster</strong>
                            <span>{members.length} members</span>
                          </div>
                          {members.length ? (
                            <div className={styles.memberList}>
                              {members.map((joinedUser, memberIndex) => {
                                const member = userDirectory.get(String(joinedUser?.userId || ''));
                                if (!member) return null;
                                const memberName = [member?.firstName, member?.lastName].filter(Boolean).join(' ') || member?.playerName || 'League member';
                                return (
                                  <div key={member?._id || `${affiliateId}-${memberIndex}`} className={styles.userItem}>
                                    <img src={member?.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={memberName} className={styles.userImage} />
                                    <span><strong>{memberName}</strong><small>{member?.playerName || 'Fantasy player'}</small></span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : <p className={styles.noMembers}>Be the first player in this league.</p>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <section className={styles.emptyState}>
                <FaSearch />
                <h3>No leagues match that search</h3>
                <p>Clear the search field to see the complete directory.</p>
                <button type="button" onClick={() => setQuery('')}>Clear search</button>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default FantasyLeagues;
