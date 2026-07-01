import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { FaArrowRight, FaBullhorn, FaChartLine, FaHandshake, FaLayerGroup, FaUsers } from 'react-icons/fa';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const formatWebsite = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Partner profile';
  }
};

const Sponsors = ({ sponsors = [] }) => {
  const partnerList = Array.isArray(sponsors) ? sponsors.filter(Boolean) : [];

  return (
    <>
      <Head>
        <title>Sponsors & Brand Partners | Fantasy MMAdness</title>
        <meta name="description" content="Meet Fantasy MMAdness sponsors and explore premium partnership opportunities across combat sports prediction contests." />
      </Head>
      <div className="experience-page sponsors-experience-page">
        <ExperienceHero
          eyebrow="Brand partnership arena"
          title="Enter where fight fans"
          accent="already care."
          description="Connect your brand with an active combat-sports audience through fight cards, creator leagues, rewards, and measurable fan participation."
          backgroundImage="/images/fmm-pages/premium-affiliate-banner.webp"
          className="premium-sponsors-phase-two-hero"
          actions={[
            { href: '/contact', label: 'Become a sponsor' },
            { href: '#partner-board', label: 'Meet the partners', variant: 'secondary' },
          ]}
          stats={[
            { value: partnerList.length || 'Open', label: 'Partner roster', icon: FaHandshake },
            { value: '4', label: 'Activation formats', icon: FaLayerGroup },
            { value: 'Global', label: 'Combat audience', icon: FaUsers },
          ]}
        >
          <div className="xp-sponsor-hero-card">
            <div className="xp-sponsor-hero-art"><OptimizedImage src={`${FMM_ASSET_BASE}/fighter-duel-panel.jpg`} alt="Fight night partnership" width={520} height={420} sizes="(max-width: 768px) 100vw, 40vw" /></div>
            <div className="xp-sponsor-hero-copy">
              <span>Fight-night visibility</span>
              <h2>Own a moment before, during, and after the bell.</h2>
              <div><strong>01</strong><p>Branded fight cards</p></div>
              <div><strong>02</strong><p>League sponsorships</p></div>
              <div><strong>03</strong><p>Reward activations</p></div>
            </div>
          </div>
        </ExperienceHero>

        <main className="xp-page-main" id="partner-board">
          <div className="theme-container">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Current partner board"
                title="Brands in the fight"
                description="Partner profiles are populated from the existing sponsor endpoint. Each card keeps the approved logo, description, and destination intact."
              />

              {partnerList.length > 0 ? (
                <div className="xp-sponsor-grid">
                  {partnerList.map((sponsor, index) => (
                    <article className="xp-sponsor-card" key={sponsor._id || `${sponsor.name}-${index}`}>
                      <div className="xp-sponsor-card-index">{String(index + 1).padStart(2, '0')}</div>
                      <div className="xp-sponsor-logo-wrap">
                        {sponsor.image ? <OptimizedImage src={sponsor.image} alt={sponsor.name || 'Sponsor'} width={220} height={140} sizes="(max-width: 768px) 50vw, 180px" /> : <FaHandshake />}
                      </div>
                      <div className="xp-sponsor-card-copy">
                        <span>{formatWebsite(sponsor.websiteLink)}</span>
                        <h3>{sponsor.name || 'Fantasy MMAdness Partner'}</h3>
                        <p>{sponsor.description || 'Supporting premium combat-sports prediction experiences and the fan communities built around them.'}</p>
                        {sponsor.websiteLink ? (
                          <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer">Visit partner <FaArrowRight /></a>
                        ) : (
                          <Link href="/contact">Partner details <FaArrowRight /></Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <ExperienceEmptyState
                  title="The next partner could be your brand"
                  description="There are no public sponsor profiles in the live feed at this moment. Contact the team to discuss an activation."
                  action={{ href: '/contact', label: 'Start a conversation' }}
                />
              )}
            </section>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Activation formats"
                title="Built for more than logo placement"
                description="A flexible partnership system can place a brand inside the actual fan journey rather than around the edges of it."
              />
              <div className="xp-activation-grid">
                {[
                  { icon: FaBullhorn, number: '01', title: 'Fight-card presenting partner', copy: 'Own premium placement across a selected prediction contest, lock screen, and result experience.' },
                  { icon: FaUsers, number: '02', title: 'Creator league partner', copy: 'Build a recurring branded league around an affiliate or combat-sports creator community.' },
                  { icon: FaChartLine, number: '03', title: 'Performance campaign', copy: 'Pair visibility with measurable entries, league joins, clicks, and fan participation.' },
                  { icon: FaHandshake, number: '04', title: 'Reward-led activation', copy: 'Attach branded prizes or fan rewards to the moment users make and share their picks.' },
                ].map(({ icon: Icon, number, title, copy }) => (
                  <article className="xp-activation-card" key={number}>
                    <span>{number}</span><Icon /><h3>{title}</h3><p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="xp-sponsor-cta">
              <div>
                <p className="xp-eyebrow">Build a custom package</p>
                <h2>Your brand. Their fight night. One memorable activation.</h2>
                <p>Share your audience, campaign objective, and preferred fight format. The existing contact workflow remains unchanged.</p>
              </div>
              <Link href="/contact" className="theme-btn theme-btn-primary">Talk to partnerships <FaArrowRight /></Link>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default Sponsors;
