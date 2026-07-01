import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaCalendarAlt, FaFire, FaSearch, FaTrophy, FaUsers } from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FeaturedFight, FightTimelineRow, FightVisualCard } from '@/Components/Theme/FightVisuals';
import {
  FMM_ASSET_BASE,
  getFightCategory,
  getFightId,
  getFightSearchText,
  safeArray,
  splitFightsByStatus,
} from '@/Utils/fightExperience';

const FILTERS = [
  { value: 'all', label: 'All fights' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live now' },
  { value: 'past', label: 'Past fights' },
];

const PAGE_COPY = {
  all: { eyebrow: 'The complete fight room', title: 'Every fight.', accent: 'One arena.', description: 'Move from the next opening bell to verified past results without leaving the page. Search the full combat archive, filter by discipline, and enter active prediction contests from one cinematic fight hub.' },
  upcoming: { eyebrow: 'Upcoming fight cards', title: 'Next cards.', accent: 'Built for predictions.', description: 'Browse the scheduled cards, inspect each matchup, and enter the existing prediction flow with a premium fight-night presentation.' },
  live: { eyebrow: 'Live fight cards', title: 'The action.', accent: 'Happening now.', description: 'Follow active fights and open scoreboards or entry flows using the same production state and routes.' },
  past: { eyebrow: 'Completed fight archive', title: 'Past fights.', accent: 'Verified records.', description: 'Review completed contests, fight history, and result pages in a searchable premium archive.' },
};

const FightsHub = ({ initialStatus = 'all', initialMatches = [] }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const reduxMatches = useSelector((state) => state.matches.data);
  const matches = safeArray(reduxMatches).length ? reduxMatches : initialMatches;
  const matchStatus = useSelector((state) => state.matches.status);
  const matchError = useSelector((state) => state.matches.error);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [activeFilter, setActiveFilter] = useState(FILTERS.some((item) => item.value === initialStatus) ? initialStatus : 'all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  useEffect(() => {
    if (!router.isReady) return;
    const requested = Array.isArray(router.query.status) ? router.query.status[0] : router.query.status;
    setActiveFilter(FILTERS.some((item) => item.value === requested) ? requested : (FILTERS.some((item) => item.value === initialStatus) ? initialStatus : 'all'));
  }, [initialStatus, router.isReady, router.query.status]);

  const groups = useMemo(() => splitFightsByStatus(safeArray(matches)), [matches]);

  const categories = useMemo(() => Array.from(new Set(safeArray(matches).map(getFightCategory))).sort(), [matches]);

  const sourceFights = useMemo(() => {
    if (activeFilter === 'upcoming') return groups.upcoming;
    if (activeFilter === 'live') return groups.live;
    if (activeFilter === 'past') return groups.past;
    return [...groups.live, ...groups.upcoming, ...groups.past];
  }, [activeFilter, groups]);

  const filteredFights = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sourceFights.filter((match) => {
      const matchesSearch = !needle || getFightSearchText(match).includes(needle);
      const matchesCategory = category === 'all' || getFightCategory(match) === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, search, sourceFights]);

  const featuredFight = useMemo(() => {
    if (activeFilter === 'past') return groups.past[0];
    return groups.live[0] || groups.upcoming[0] || groups.past[0];
  }, [activeFilter, groups]);

  const handleFilter = (value) => {
    setActiveFilter(value);
    router.replace({ pathname: router.pathname || '/fights', query: value === 'all' ? {} : { status: value } }, undefined, { shallow: true, scroll: false });
  };

  const handleFightAction = (match) => {
    const id = getFightId(match);
    const isPast = groups.past.some((item) => getFightId(item) === id);
    if (isPast) {
      router.push(id ? `/past-fight/${id}` : '/fights?status=past');
      return;
    }
    if (!isAuthenticated) {
      router.push({ pathname: '/auth', query: { mode: 'login', role: 'player', next: '/UserDashboard' } });
      return;
    }
    router.push('/UserDashboard');
  };

  const heroCopy = PAGE_COPY[activeFilter] || PAGE_COPY[initialStatus] || PAGE_COPY.all;
  const heroBackground = activeFilter === 'past'
    ? '/images/fmm-pages/premium-arena-banner.webp'
    : '/images/fmm-pages/premium-duel-banner.webp';
  const visibleUpcoming = filteredFights.filter((match) => !groups.past.some((item) => getFightId(item) === getFightId(match)));
  const visiblePast = filteredFights.filter((match) => groups.past.some((item) => getFightId(item) === getFightId(match)));

  return (
    <>
      <Head>
        <title>Fights | Upcoming & Past Combat Sports | Fantasy MMAdness</title>
        <meta name="description" content="Explore upcoming, live, and past MMA, boxing, kickboxing, and bare-knuckle fight cards in one premium Fantasy MMAdness fight hub." />
      </Head>
      <div className="experience-page fights-experience-page">
        <ExperienceHero
          eyebrow={heroCopy.eyebrow}
          title={heroCopy.title}
          accent={heroCopy.accent}
          description={heroCopy.description}
          backgroundImage={heroBackground}
          className={`premium-fights-phase-two-hero is-${activeFilter}`}
          actions={[
            { href: '#fight-directory', label: 'Explore fight cards' },
            { href: '/guides', label: 'How scoring works', variant: 'secondary' },
          ]}
          stats={[
            { value: groups.upcoming.length, label: 'Upcoming', icon: FaCalendarAlt },
            { value: groups.live.length, label: 'Live now', icon: FaFire },
            { value: groups.past.length, label: 'Results', icon: FaTrophy },
          ]}
        >
          <div className="xp-hero-feature-wrap">
            <span className="xp-hero-feature-label">Featured fight card</span>
            {featuredFight ? (
              <FeaturedFight match={featuredFight} onAction={handleFightAction} />
            ) : (
              <div className="xp-hero-poster-card">
                <img src="/images/fmm-pages/rewards-fighter-panel.webp" alt="Fantasy MMAdness fight arena" />
                <strong>Next card loading</strong>
              </div>
            )}
          </div>
        </ExperienceHero>

        <main className="xp-page-main" id="fight-directory">
          <div className="theme-container">
            <section className="xp-filter-dock" aria-label="Fight filters">
              <div className="xp-filter-tabs" role="tablist" aria-label="Fight status">
                {FILTERS.map((item) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === item.value}
                    className={activeFilter === item.value ? 'is-active' : ''}
                    key={item.value}
                    onClick={() => handleFilter(item.value)}
                  >
                    {item.label}
                    <span>{item.value === 'all' ? safeArray(matches).length : groups[item.value]?.length || 0}</span>
                  </button>
                ))}
              </div>
              <div className="xp-directory-toolbar">
                <label className="xp-search-field">
                  <FaSearch aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fighter, card, venue..." />
                </label>
                <label className="xp-select-wrap">
                  <span>Discipline</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="all">All disciplines</option>
                    {categories.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {matchStatus === 'loading' && (
              <div className="xp-loading-grid" aria-label="Loading fights">
                {[0, 1, 2].map((item) => <div className="xp-loading-card" key={item} />)}
              </div>
            )}

            {matchStatus === 'failed' && (
              <ExperienceEmptyState title="The fight feed is unavailable" description={matchError || 'Please refresh the page in a moment.'} />
            )}

            {matchStatus !== 'loading' && matchStatus !== 'failed' && filteredFights.length === 0 && (
              <ExperienceEmptyState
                title="No fights match these filters"
                description="Try another discipline, remove the search term, or return to all fights."
                action={{ href: router.pathname || '/fights', label: 'View all fights' }}
              />
            )}

            {visibleUpcoming.length > 0 && (
              <section className="xp-page-section">
                <ExperienceSectionHeading
                  eyebrow={activeFilter === 'live' ? 'In progress' : 'Prediction contests'}
                  title={activeFilter === 'live' ? 'Live fight cards' : activeFilter === 'all' ? 'Upcoming & live fights' : 'Upcoming fight cards'}
                  description="Every card presents both fighters, entry state, schedule, player count, and prize context at a glance."
                />
                <div className="xp-fight-card-grid">
                  {visibleUpcoming.map((match, index) => (
                    <FightVisualCard key={getFightId(match) || `${index}-${getFightSearchText(match)}`} match={match} index={index} onAction={handleFightAction} />
                  ))}
                </div>
              </section>
            )}

            {visiblePast.length > 0 && (
              <section className="xp-page-section xp-past-section">
                <ExperienceSectionHeading
                  eyebrow="Official archive"
                  title={activeFilter === 'past' ? 'Past fights & verified results' : 'Recently completed fights'}
                  description="Browse the fight ledger and open a completed contest to inspect the result and leaderboard."
                />
                <div className="xp-past-layout">
                  <aside className="xp-archive-poster">
                    <img src="/images/fmm-pages/rewards-fighter-panel.webp" alt="Fight archive" loading="lazy" />
                    <div>
                      <span><FaTrophy /> Fight archive</span>
                      <h3>Every bell leaves a record.</h3>
                      <p>Final outcomes, fight formats, dates, and Fantasy MMAdness contest records remain available in a single searchable ledger.</p>
                    </div>
                  </aside>
                  <div className="xp-timeline-list">
                    {visiblePast.map((match, index) => (
                      <FightTimelineRow key={getFightId(match) || `${index}-${getFightSearchText(match)}`} match={match} index={index} onAction={handleFightAction} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="xp-fights-cta">
              <div>
                <p className="xp-eyebrow"><FaUsers /> Built for fight fans</p>
                <h2>Pick every round. Own the leaderboard.</h2>
                <p>Build your prediction card before the lock, track the live fight, and compare your score against the global community.</p>
              </div>
              <div>
                <Link href="/auth?mode=signup&role=player" className="theme-btn theme-btn-primary">Create player account</Link>
                <Link href="/leaderboard" className="theme-btn theme-btn-secondary">View leaderboard</Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default FightsHub;
