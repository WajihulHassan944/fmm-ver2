import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaFistRaised, FaSearch, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { WrestlingEmptyState, WrestlingHero, WrestlingModeNav, WrestlingSectionHeading } from './WrestlingPrimitives';
import { safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingWrestlersPage = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    wrestlingRequest('/api/wrestling/wrestlers?limit=100')
      .then((payload) => { if (active) setWrestlers(safeWrestlingArray(payload?.data)); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return wrestlers;
    return wrestlers.filter((wrestler) => [wrestler.displayName, wrestler.promotion, wrestler.wrestlingStyle, wrestler.country].filter(Boolean).join(' ').toLowerCase().includes(normalized));
  }, [query, wrestlers]);

  return (
    <>
      <Head><title>Pro Wrestling Roster | Fantasy MMADNESS</title></Head>
      <div className="pw-page pw-wrestlers-page">
        <WrestlingHero compact eyebrow="Wrestler intelligence" title="Study the roster." accent="Predict with context." description="Explore wrestling styles, career records, signature moves, finishers, and historical action totals before building a scorecard." actions={[{ href: '/pro-wrestling', label: 'Open contests', icon: FaFistRaised }, { href: '/pro-wrestling/how-to-play', label: 'Scoring guide', secondary: true, icon: FaShieldAlt }]} stats={[{ value: wrestlers.length, label: 'Active profiles', icon: FaTrophy }]} background="/images/pro-wrestling/wrestling-roster-premium.webp" />
        <WrestlingModeNav active="wrestlers" />
        <main className="theme-container pw-main">
          <section className="pw-section">
            <WrestlingSectionHeading eyebrow="Roster directory" title="Find a wrestler" description="Search by name, promotion, country, or wrestling style." />
            <label className="pw-search"><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the wrestling roster" /><span>{visible.length} profiles</span></label>
            {loading ? <div className="pw-loading-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} />)}</div> : error ? <WrestlingEmptyState title="Roster unavailable" description={error} /> : visible.length ? (
              <div className="pw-wrestler-grid">{visible.map((wrestler, index) => <Link href={`/pro-wrestling/wrestlers/${wrestler.slug || wrestler._id}`} key={wrestler._id}><div className="pw-wrestler-card-media">{wrestler.featured && <span>Featured</span>}<img src={wrestler.profileImage || "/images/pro-wrestling/wrestler-placeholder-a.webp"} alt={wrestler.displayName} /></div><div><p>{wrestler.promotion || 'Pro Wrestling'}</p><h2>{wrestler.displayName}</h2><span>{wrestler.wrestlingStyle || 'All-around competitor'}</span><dl><div><dt>W</dt><dd>{wrestler.careerRecord?.wins || 0}</dd></div><div><dt>L</dt><dd>{wrestler.careerRecord?.losses || 0}</dd></div><div><dt>D</dt><dd>{wrestler.careerRecord?.draws || 0}</dd></div></dl><strong>Open profile <FaArrowRight /></strong></div></Link>)}</div>
            ) : <WrestlingEmptyState title="No wrestler profiles match this search" description="Try a broader name, promotion, or wrestling style." />}
          </section>
        </main>
      </div>
    </>
  );
};
export default WrestlingWrestlersPage;
