import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaCopy,
  FaDollarSign,
  FaEye,
  FaLink,
  FaPlus,
  FaTrophy,
  FaUserFriends,
} from 'react-icons/fa';
import AffiliateAddNewMatch from './AffiliateAddNewMatch';
import AffiliateMatchDetails from './AffiliateMatchDetails';
import { fetchMatches } from '@/Redux/matchSlice';
import { ExperienceEmptyState, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import {
  FMM_ASSET_BASE,
  getFightCategory,
  getFightId,
  getFightRounds,
  getFighterImage,
  safeArray,
} from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const AffiliateDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const isAuthenticatedAffiliate = useSelector((state) => state.affiliateAuth.isAuthenticatedAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [shadowMatchId, setShadowMatchId] = useState(null);
  const [promoMatchDetails, setPromoMatchDetails] = useState({ matchId: null, affiliateId: null });
  const [promoMatches, setPromoMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  useEffect(() => {
    if (!router.isReady || authLoading) return;
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('affiliateAuthToken'));
    if (!isAuthenticatedAffiliate && !hasToken && !affiliate?._id) {
      router.replace({ pathname: '/auth', query: { mode: 'login', role: 'affiliate', next: '/AffiliateDashboard' } });
    }
  }, [affiliate?._id, authLoading, isAuthenticatedAffiliate, router, router.isReady]);

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      try {
        const response = await fetch(`${API_BASE}/shadow`);
        if (!response.ok) throw new Error('Failed to load fight templates');
        const data = await response.json();
        if (!cancelled) setPromoMatches(safeArray(data?.data || data));
      } catch (error) {
        console.error(error);
        if (!cancelled) setPromoMatches([]);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!affiliate?.usersJoined?.length) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/users`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (cancelled) return;
        const allUsers = safeArray(data?.data || data);
        setMembers(safeArray(affiliate.usersJoined).map((joined) => ({
          ...allUsers.find((user) => String(user?._id) === String(joined?.userId)),
          joinedAt: joined?.joinedAt,
        })).filter((item) => item?._id));
      })
      .catch((error) => console.error('Failed to load league members:', error));
    return () => { cancelled = true; };
  }, [affiliate]);

  useEffect(() => {
    if (shadowMatchId || promoMatchDetails.matchId) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [promoMatchDetails.matchId, shadowMatchId]);

  const affiliateId = affiliate?._id ? String(affiliate._id) : '';
  const promotionFights = useMemo(() => promoMatches.filter((match) => (
    match?.matchType === 'SHADOW' && !safeArray(match?.AffiliateIds).some((item) => String(item?.AffiliateId) === affiliateId)
  )), [affiliateId, promoMatches]);

  const promotedFights = useMemo(() => promoMatches.filter((match) => safeArray(match?.AffiliateIds).some((item) => (
    String(item?.AffiliateId) === affiliateId && safeArray(matches).some((liveMatch) => String(getFightId(liveMatch)) === String(item?.matchId) && liveMatch?.matchShadowOpenStatus === 'open')
  ))), [affiliateId, matches, promoMatches]);

  const totalPromotions = safeArray(matches).filter((match) => String(match?.affiliateId) === affiliateId).length;
  const fullName = [affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ') || affiliate?.playerName || 'Affiliate';
  const profileImage = affiliate?.profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.png`;

  const handleCopy = async (event, match) => {
    event.stopPropagation();
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fantasymmadness.com';
      const url = `${origin}/shadow/${encodeURIComponent(match.matchName)}/${encodeURIComponent(fullName)}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(getFightId(match));
      toast.success('Promotion link copied.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Unable to copy this promotion link.');
    }
  };

  if (promoMatchDetails.matchId) {
    return (
      <div className="experience-page xp-dashboard-detail-view">
        <button type="button" className="xp-dashboard-back" onClick={() => setPromoMatchDetails({ matchId: null, affiliateId: null })}><FaArrowLeft /> Back to affiliate dashboard</button>
        <AffiliateMatchDetails matchId={promoMatchDetails.matchId} affiliateId={promoMatchDetails.affiliateId} />
      </div>
    );
  }

  if (shadowMatchId) {
    return (
      <div className="experience-page xp-dashboard-detail-view">
        <button type="button" className="xp-dashboard-back" onClick={() => setShadowMatchId(null)}><FaArrowLeft /> Back to affiliate dashboard</button>
        <AffiliateAddNewMatch matchId={shadowMatchId} />
      </div>
    );
  }

  if (!affiliate?.firstName) return <div className="experience-page xp-route-loading">Preparing affiliate command center...</div>;

  return (
    <>
      <Head><title>Affiliate Dashboard | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-dashboard-experience-page">
        <section className="xp-affiliate-hero">
          <div className="xp-affiliate-hero-grid" />
          <img className="xp-affiliate-hero-fighter" src={`${FMM_ASSET_BASE}/fighter-david-benavidez.png`} alt="" aria-hidden="true" />
          <div className="theme-container xp-affiliate-hero-layout">
            <div className="xp-affiliate-profile-card">
              <div className="xp-affiliate-avatar"><img src={profileImage} alt={fullName} /></div>
              <div>
                <p className="xp-eyebrow"><FaBullhorn /> Creator command center</p>
                <h1>Build the card. <span>Move the crowd.</span></h1>
                <p>Welcome back, {fullName}. Turn approved fight templates into branded promotions, grow your league, and follow each campaign from one dashboard.</p>
                <div className="xp-affiliate-hero-actions">
                  <a href="#shadow-templates" className="theme-btn theme-btn-primary">Create a promotion <FaPlus /></a>
                  <Link href="/affiliate-league" className="theme-btn theme-btn-secondary">Manage league</Link>
                </div>
              </div>
            </div>
            <div className="xp-affiliate-pipeline-card">
              <span>Campaign pipeline</span>
              <h2>{promotedFights.length} live promotions</h2>
              <div className="xp-affiliate-pipeline">
                <div><i /><strong>{promotionFights.length}</strong><small>Templates ready</small></div>
                <div><i /><strong>{promotedFights.length}</strong><small>Promotions live</small></div>
                <div><i /><strong>{safeArray(affiliate.usersJoined).length}</strong><small>League members</small></div>
              </div>
            </div>
          </div>
        </section>

        <main className="xp-page-main xp-dashboard-main">
          <div className="theme-container">
            <section className="xp-dashboard-stat-grid xp-affiliate-stat-grid">
              <div><FaDollarSign /><span><strong>{Number(affiliate.tokens || 0).toLocaleString()}</strong><small>Affiliate balance</small></span></div>
              <div><FaEye /><span><strong>{Number(affiliate.totalViews || 0).toLocaleString()}</strong><small>Promotion views</small></span></div>
              <div><FaUserFriends /><span><strong>{safeArray(affiliate.usersJoined).length}</strong><small>League members</small></span></div>
              <div><FaBullhorn /><span><strong>{totalPromotions}</strong><small>Total promotions</small></span></div>
            </section>

            <section className="xp-page-section" id="shadow-templates">
              <ExperienceSectionHeading
                eyebrow="Approved fight inventory"
                title="Shadow templates"
                description="Choose a pre-approved fight template, configure your promotion, and publish it to your audience with the existing campaign flow."
              />
              {loadingTemplates ? <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /><div className="xp-loading-card" /></div> : promotionFights.length ? (
                <div className="xp-affiliate-fight-grid">
                  {promotionFights.map((match, index) => (
                    <article className="xp-affiliate-fight-card is-template" key={getFightId(match) || index}>
                      <div className="xp-affiliate-fight-media">
                        <figure><img src={getFighterImage(match, 'A', index)} alt={match.matchFighterA || 'Fighter A'} /></figure>
                        <span>VS</span>
                        <figure><img src={getFighterImage(match, 'B', index)} alt={match.matchFighterB || 'Fighter B'} /></figure>
                        <i>{getFightCategory(match)}</i>
                      </div>
                      <div className="xp-affiliate-fight-copy">
                        <p>Template {String(index + 1).padStart(2, '0')}</p>
                        <h3>{match.matchFighterA || 'Fighter A'} <span>VS</span> {match.matchFighterB || 'Fighter B'}</h3>
                        <div><span>{getFightRounds(match)}</span><span>{match.matchName || 'Fight promotion'}</span></div>
                        <button type="button" className="theme-btn theme-btn-primary" onClick={() => setShadowMatchId(getFightId(match))}>Create promotion <FaArrowRight /></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <ExperienceEmptyState title="No new templates are available" description="Your current approved templates may already be promoted. Check the live campaign section below." />}
            </section>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Live campaign room"
                title="Promoted fights"
                description="Open campaign details, monitor the active fight, or copy the public promotion link for your audience."
              />
              {promotedFights.length ? (
                <div className="xp-affiliate-fight-grid">
                  {promotedFights.map((match, index) => (
                    <article className="xp-affiliate-fight-card is-promoted" key={getFightId(match) || index} onClick={() => setPromoMatchDetails({ matchId: getFightId(match), affiliateId: affiliate._id })}>
                      <div className="xp-affiliate-live-badge"><i /> Live promotion</div>
                      <div className="xp-affiliate-fight-media">
                        <figure><img src={getFighterImage(match, 'A', index + 2)} alt={match.matchFighterA || 'Fighter A'} /></figure>
                        <span>VS</span>
                        <figure><img src={getFighterImage(match, 'B', index + 2)} alt={match.matchFighterB || 'Fighter B'} /></figure>
                        <i>{getFightCategory(match)}</i>
                      </div>
                      <div className="xp-affiliate-fight-copy">
                        <p>Campaign {String(index + 1).padStart(2, '0')}</p>
                        <h3>{match.matchFighterA || 'Fighter A'} <span>VS</span> {match.matchFighterB || 'Fighter B'}</h3>
                        <div><span>{getFightRounds(match)}</span><span>{match.matchName || 'Fight promotion'}</span></div>
                        <div className="xp-affiliate-card-actions">
                          <button type="button" className="theme-btn theme-btn-primary" onClick={() => setPromoMatchDetails({ matchId: getFightId(match), affiliateId: affiliate._id })}>Open campaign <FaChartLine /></button>
                          <button type="button" className="xp-copy-promo" onClick={(event) => handleCopy(event, match)} aria-label="Copy public promotion link">{copiedId === getFightId(match) ? <FaCheck /> : <FaCopy />}</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <ExperienceEmptyState title="No live promotions yet" description="Select a shadow template above to create your first active campaign." />}
            </section>

            <section className="xp-affiliate-community-panel">
              <div>
                <p className="xp-eyebrow">League momentum</p>
                <h2>Your community is the real fight-night advantage.</h2>
                <p>Promotions bring members into the league. The league gives every future fight card a built-in audience.</p>
                <div className="xp-affiliate-quick-links"><Link href="/affiliate-league"><FaTrophy /> League manager</Link><Link href="/AffiliateProfile"><FaUserFriends /> Public profile</Link><Link href="/affiliate-guides"><FaLink /> Promotion guide</Link></div>
              </div>
              <div className="xp-affiliate-member-list">
                <div><strong>Recent members</strong><span>{members.length} loaded</span></div>
                {members.slice(0, 5).map((member, index) => (
                  <article key={member._id || index}>
                    <img src={member.profileUrl || `${FMM_ASSET_BASE}/fighter-jadden-addison.png`} alt={member.firstName || 'League member'} />
                    <span><strong>{[member.firstName, member.lastName].filter(Boolean).join(' ') || 'Fantasy player'}</strong><small>{member.joinedAt ? `Joined ${new Date(member.joinedAt).toLocaleDateString()}` : 'League member'}</small></span>
                  </article>
                ))}
                {!members.length && <p>Your newest league members will appear here.</p>}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default AffiliateDashboard;
