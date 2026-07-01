import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { FaArrowRight, FaFistRaised, FaSearch, FaShieldAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const FALLBACK_FIGHTERS = [
  `${FMM_ASSET_BASE}/fighter-jadden-addison.webp`,
  `${FMM_ASSET_BASE}/fighter-zaveer-davis.webp`,
  `${FMM_ASSET_BASE}/fighter-conor-benn.webp`,
  `${FMM_ASSET_BASE}/fighter-chris-eubank-jr.webp`,
  `${FMM_ASSET_BASE}/fighter-anthony-yarde.webp`,
  `${FMM_ASSET_BASE}/fighter-david-benavidez.webp`,
];

const Fighters = ({ fighters = [] }) => {
  const normalized = useMemo(() => (Array.isArray(fighters) ? fighters : []).filter((fighter) => fighter?.name), [fighters]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => Array.from(new Set(normalized.map((fighter) => fighter.category || 'MMA'))).sort(), [normalized]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return normalized.filter((fighter) => {
      const matchesCategory = category === 'all' || String(fighter.category || 'MMA') === category;
      const matchesSearch = !needle || `${fighter.name} ${fighter.category || ''}`.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [category, normalized, search]);
  const featured = normalized[0];
  const featuredFallback = FALLBACK_FIGHTERS[0];

  return (
    <>
      <Head>
        <title>Our Fighters | Fantasy MMAdness</title>
        <meta name="description" content="Explore the MMA, boxing, kickboxing, and bare-knuckle fighters featured across Fantasy MMAdness fight cards." />
      </Head>
      <div className="experience-page fighters-experience-page">
        <ExperienceHero
          eyebrow="Combat athlete directory"
          title="Names that move the crowd."
          accent="Fighters who define the card."
          description="Explore the athletes appearing across Fantasy MMAdness fight cards—from championship-calibre boxers to explosive MMA and kickboxing specialists."
          backgroundImage="/images/fmm-pages/premium-duel-banner.webp"
          className="premium-fighters-phase-two-hero"
          actions={[
            { href: '/fights', label: 'Browse fight cards' },
            { href: '/fighter-performance-tracker', label: 'Open fighter tracker', variant: 'secondary' },
          ]}
          stats={[
            { value: normalized.length, label: 'Featured fighters', icon: FaUsers },
            { value: categories.length, label: 'Disciplines', icon: FaFistRaised },
            { value: 'Live', label: 'Fight-card data', icon: FaShieldAlt },
          ]}
        >
          <div className="xp-featured-fighter-card">
            <div className="xp-featured-fighter-glow" />
            <OptimizedImage src={featured?.image || featuredFallback} fallbackSrc={featuredFallback} alt={featured?.name || 'Featured fighter'} width={520} height={620} sizes="(max-width: 768px) 80vw, 38vw" />
            <div className="xp-featured-fighter-copy">
              <span>Featured athlete</span>
              <h2>{featured?.name || 'Fight Night Contender'}</h2>
              <p>{featured?.category || 'Combat sports'}</p>
              <Link href="/fights">See active matchup <FaArrowRight /></Link>
            </div>
          </div>
        </ExperienceHero>

        <main className="xp-page-main">
          <div className="theme-container">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Athlete roster"
                title="Meet the fighters"
                description="Search by name or narrow the roster by combat discipline. Fighter imagery is pulled from the live fight-card feed with premium visual fallbacks."
              />

              <div className="xp-directory-toolbar xp-fighter-toolbar">
                <label className="xp-search-field"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fighter..." /></label>
                <div className="xp-filter-tabs is-compact" role="tablist" aria-label="Fighter disciplines">
                  <button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>All <span>{normalized.length}</span></button>
                  {categories.map((item) => (
                    <button type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>
                  ))}
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="xp-fighter-grid">
                  {filtered.map((fighter, index) => (
                    <article className="xp-fighter-card" key={`${fighter.name}-${index}`}>
                      <div className="xp-fighter-card-number">{String(index + 1).padStart(2, '0')}</div>
                      <div className="xp-fighter-card-media">
                        <div className="xp-fighter-card-light" />
                        <OptimizedImage src={fighter.image || FALLBACK_FIGHTERS[index % FALLBACK_FIGHTERS.length]} fallbackSrc={FALLBACK_FIGHTERS[index % FALLBACK_FIGHTERS.length]} alt={fighter.name} width={360} height={420} sizes="(max-width: 768px) 80vw, 280px" />
                        <span>{fighter.category || 'Combat sports'}</span>
                      </div>
                      <div className="xp-fighter-card-copy">
                        <p>Featured fighter</p>
                        <h3>{fighter.name}</h3>
                        <div className="xp-fighter-rule"><i /><FaTrophy /><i /></div>
                        <p>{fighter.description || `${fighter.name} has appeared in competitive ${fighter.category || 'combat sports'} matchups across the Fantasy MMAdness fight card.`}</p>
                        <Link href={`/fights?search=${encodeURIComponent(fighter.name)}`}>View fight cards <FaArrowRight /></Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <ExperienceEmptyState title="No fighters match those filters" description="Try a different name or select all disciplines." />
              )}
            </section>

            <section className="xp-fighter-editorial">
              <div>
                <p className="xp-eyebrow">Fight intelligence</p>
                <h2>Know the athlete. Read the matchup. Make the sharper pick.</h2>
                <p>Use the fighter directory alongside current fight cards and performance tools to build better round-by-round predictions.</p>
                <Link href="/fighter-performance-tracker" className="theme-btn theme-btn-primary">Explore performance tracker</Link>
              </div>
              <div className="xp-fighter-editorial-art">
                <OptimizedImage src={`${FMM_ASSET_BASE}/fighter-action-blue.jpg`} alt="Combat athlete in arena" width={620} height={420} sizes="(max-width: 768px) 100vw, 42vw" />
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default Fighters;
