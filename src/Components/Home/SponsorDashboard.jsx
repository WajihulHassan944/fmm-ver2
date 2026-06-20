import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowRight,
  FaBullhorn,
  FaCalendarAlt,
  FaChartLine,
  FaExternalLinkAlt,
  FaGlobe,
  FaHandshake,
  FaInstagram,
  FaShieldAlt,
} from 'react-icons/fa';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const parseSponsor = (value) => {
  try {
    const parsed = JSON.parse(value || 'null');
    if (Array.isArray(parsed?.data)) return parsed.data[0] || null;
    if (parsed?.data && typeof parsed.data === 'object') return parsed.data;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const SponsorDashboard = () => {
  const router = useRouter();
  const [sponsor, setSponsor] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem('isSponsorAuthenticated') === 'true';
    const profile = parseSponsor(localStorage.getItem('sponsorData'));
    if (!authenticated || !profile) {
      router.replace({ pathname: '/auth', query: { mode: 'login', role: 'sponsor', next: '/sponsor-dashboard' } });
      setReady(true);
      return;
    }
    setSponsor(profile);
    setReady(true);
  }, [router]);

  const createdDate = (() => {
    if (!sponsor?.dateCreated && !sponsor?.createdAt) return 'Not available';
    const date = new Date(sponsor.dateCreated || sponsor.createdAt);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  if (!ready || !sponsor) return <div className="experience-page xp-route-loading">Preparing sponsor suite...</div>;

  return (
    <>
      <Head><title>Sponsor Dashboard | Fantasy MMAdness</title></Head>
      <div className="experience-page sponsor-dashboard-experience-page">
        <section className="xp-sponsor-dashboard-hero">
          <div className="xp-sponsor-dashboard-hero-grid" />
          <img className="xp-sponsor-dashboard-fighter" src={`${FMM_ASSET_BASE}/fighter-anthony-yarde.png`} alt="" aria-hidden="true" />
          <div className="theme-container xp-sponsor-dashboard-hero-layout">
            <div className="xp-sponsor-dashboard-intro">
              <p className="xp-eyebrow"><FaHandshake /> Partner command center</p>
              <h1>Welcome, <span>{sponsor.name || 'Partner'}.</span></h1>
              <p>Your approved brand profile is live inside the Fantasy MMAdness partner ecosystem. Review the public-facing information and jump directly to the relevant destinations.</p>
              <div>
                {sponsor.websiteLink && <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer" className="theme-btn theme-btn-primary">Visit website <FaExternalLinkAlt /></a>}
                <Link href="/Sponsors" className="theme-btn theme-btn-secondary">View partner board</Link>
              </div>
            </div>
            <div className="xp-sponsor-dashboard-brand-card">
              <span>Approved partner profile</span>
              <div>{sponsor.image ? <img src={sponsor.image} alt={sponsor.name || 'Sponsor logo'} /> : <FaHandshake />}</div>
              <h2>{sponsor.name || 'Fantasy MMAdness Partner'}</h2>
              <p><i /> Profile active</p>
            </div>
          </div>
        </section>

        <main className="xp-page-main xp-dashboard-main">
          <div className="theme-container">
            <section className="xp-dashboard-stat-grid xp-sponsor-dashboard-stats">
              <div><FaShieldAlt /><span><strong>Active</strong><small>Partner status</small></span></div>
              <div><FaCalendarAlt /><span><strong>{createdDate}</strong><small>Profile created</small></span></div>
              <div><FaGlobe /><span><strong>{sponsor.websiteLink ? 'Connected' : 'Pending'}</strong><small>Website destination</small></span></div>
              <div><FaInstagram /><span><strong>{sponsor.instaLink ? 'Connected' : 'Pending'}</strong><small>Instagram profile</small></span></div>
            </section>

            <section className="xp-sponsor-dashboard-grid">
              <article className="xp-sponsor-profile-panel">
                <p className="xp-eyebrow">Public partner profile</p>
                <h2>The details currently used across the website.</h2>
                <div className="xp-sponsor-profile-logo">{sponsor.image ? <img src={sponsor.image} alt={sponsor.name || 'Sponsor'} /> : <FaHandshake />}</div>
                <dl>
                  <div><dt>Brand name</dt><dd>{sponsor.name || 'Not provided'}</dd></div>
                  <div><dt>Website</dt><dd>{sponsor.websiteLink || 'Not provided'}</dd></div>
                  <div><dt>Instagram</dt><dd>{sponsor.instaLink || 'Not provided'}</dd></div>
                  <div><dt>Date created</dt><dd>{createdDate}</dd></div>
                </dl>
              </article>

              <article className="xp-sponsor-story-panel">
                <div className="xp-sponsor-story-art"><img src={`${FMM_ASSET_BASE}/fighter-duel-panel.jpg`} alt="Fantasy combat sports audience" /></div>
                <div>
                  <p className="xp-eyebrow">Brand story</p>
                  <h2>How your profile is presented.</h2>
                  <p>{sponsor.description || 'No public description has been added to this sponsor profile yet.'}</p>
                  <div className="xp-sponsor-story-actions">
                    {sponsor.websiteLink && <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer"><FaGlobe /> Open website</a>}
                    {sponsor.instaLink && <a href={sponsor.instaLink} target="_blank" rel="noopener noreferrer"><FaInstagram /> Open Instagram</a>}
                  </div>
                </div>
              </article>
            </section>

            <section className="xp-sponsor-opportunity-panel">
              <div>
                <p className="xp-eyebrow">Next activation</p>
                <h2>Move from partner profile to a full fight-night campaign.</h2>
                <p>Use the contact workflow to discuss branded fight cards, creator leagues, reward-led activations, or audience campaigns.</p>
              </div>
              <div className="xp-sponsor-opportunity-types">
                <span><FaBullhorn /> Fight-card placement</span>
                <span><FaChartLine /> Campaign reporting</span>
                <span><FaHandshake /> Custom activation</span>
              </div>
              <Link href="/contact" className="theme-btn theme-btn-primary">Plan next campaign <FaArrowRight /></Link>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default SponsorDashboard;
