import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaCopy,
  FaCrown,
  FaDollarSign,
  FaEye,
  FaHistory,
  FaPlus,
  FaTrophy,
  FaUserFriends,
} from 'react-icons/fa';
import AffiliateAddNewMatch from './AffiliateAddNewMatch';
import AffiliateMatchDetails from './AffiliateMatchDetails';
import { fetchMatches } from '../../Redux/matchSlice';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import { ExperienceEmptyState, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import {
  FMM_ASSET_BASE,
  getFightCategory,
  getFightId,
  getFightRounds,
  getFighterImage,
  safeArray,
} from '@/Utils/fightExperience';
import { fetchPublicFights, normalizePublicFightRows } from '@/Utils/publicApi';
import { formatTokenAmount, formatWrestlingDate, getWrestlerImage, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const MAX_CARDS = 5;
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app').replace(/\/$/, '');

const isShadowLikeFight = (match = {}) => {
  const source = `${match?.matchType || ''} ${match?.sourceType || ''} ${match?.__source || ''} ${match?.collection || ''}`.toLowerCase();
  return source.includes('shadow');
};

const isPromotedByAffiliate = (match = {}, affiliateId = '') => {
  if (!affiliateId) return false;
  if (String(match?.affiliateId || match?.promotedByAffiliateId || '') === affiliateId) return true;
  if (match?.affiliatePromoted || match?.isPromotedByCurrentAffiliate) return true;
  return safeArray(match?.AffiliateIds || match?.affiliateIds).some((affiliateObject) => (
    String(affiliateObject?.AffiliateId || affiliateObject?.affiliateId || affiliateObject?.id || '') === affiliateId
  ));
};

const dedupeAffiliateFightRows = (rows = []) => {
  const selected = new Map();
  safeArray(rows).forEach((fight) => {
    const id = getFightId(fight) || `${fight?.matchName || ''}-${fight?.matchFighterA || ''}-${fight?.matchFighterB || ''}`;
    if (!id) return;
    const current = selected.get(id);
    if (!current || (isPromotedByAffiliate(fight, fight?.affiliateId) && !isPromotedByAffiliate(current, current?.affiliateId))) {
      selected.set(id, fight);
    }
  });
  return Array.from(selected.values());
};

const extractAffiliatePromotedRows = (payload = {}) => normalizePublicFightRows(
  Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.promotedFights)
        ? payload.promotedFights
        : Array.isArray(payload?.fights)
          ? payload.fights
          : Array.isArray(payload)
            ? payload
            : [],
);


const AffiliateDashboard = () => {
  const dispatch = useDispatch();
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  const [shadowMatchId, setShadowMatchId] = useState(null);
  const [promoMatchDetails, setPromoMatchDetails] = useState({ matchId: null, affiliateId: null, initialMatch: null });
  const [promoMatches, setPromoMatches] = useState([]);
  const [affiliatePromotedFights, setAffiliatePromotedFights] = useState([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [promoError, setPromoError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [promoStartIndex, setPromoStartIndex] = useState(0);
  const [promotedStartIndex, setPromotedStartIndex] = useState(0);
  const [wrestlingSummary, setWrestlingSummary] = useState(null);
  const [wrestlingLoading, setWrestlingLoading] = useState(false);

  useEffect(() => {
    if (shadowMatchId || promoMatchDetails.matchId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [promoMatchDetails.matchId, shadowMatchId]);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    if (!affiliate?._id) return undefined;
    let active = true;
    setWrestlingLoading(true);
    wrestlingRequest('/api/affiliates/me/wrestling-summary', { affiliate: true })
      .then((payload) => { if (active) setWrestlingSummary(payload); })
      .catch((error) => {
        // The affiliate dashboard remains fully usable if the optional game mode is disabled.
        console.info('Pro Wrestling affiliate summary unavailable:', error.message);
        if (active) setWrestlingSummary(null);
      })
      .finally(() => { if (active) setWrestlingLoading(false); });
    return () => { active = false; };
  }, [affiliate?._id]);

  useEffect(() => {
    let active = true;

    const fetchPromoMatches = async () => {
      setPromoLoading(true);
      setPromoError('');

      try {
        const [legacyResult, publicRows] = await Promise.allSettled([
          fetch(`${API_BASE}/shadow?limit=500&includeDrafts=true`).then(async (response) => {
            if (!response.ok) throw new Error('Failed to fetch shadow templates');
            return response.json();
          }),
          fetchPublicFights({ limit: 500, includeDrafts: true }),
        ]);

        const legacyRows = legacyResult.status === 'fulfilled'
          ? normalizePublicFightRows(Array.isArray(legacyResult.value) ? legacyResult.value : legacyResult.value?.items || legacyResult.value?.data || [])
          : [];
        const publicShadowRows = publicRows.status === 'fulfilled'
          ? safeArray(publicRows.value).filter(isShadowLikeFight)
          : [];

        if (active) setPromoMatches(dedupeAffiliateFightRows([...legacyRows, ...publicShadowRows]));
      } catch (error) {
        console.error(error);
        if (active) {
          setPromoMatches([]);
          setPromoError('Fight templates could not be loaded.');
        }
      } finally {
        if (active) setPromoLoading(false);
      }
    };

    fetchPromoMatches();
    return () => {
      active = false;
    };
  }, [shadowMatchId]);

  useEffect(() => {
    const affiliateId = affiliate?._id ? String(affiliate._id) : '';
    if (!affiliateId) {
      setAffiliatePromotedFights([]);
      return undefined;
    }

    let active = true;
    const fetchAffiliatePromotedFights = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/affiliate/${encodeURIComponent(affiliateId)}/promoted-fights?limit=500&includeShadow=true`);
        if (!response.ok) throw new Error(`Promoted fights failed with ${response.status}`);
        const payload = await response.json();
        if (active) setAffiliatePromotedFights(dedupeAffiliateFightRows(extractAffiliatePromotedRows(payload)));
      } catch (error) {
        console.info('Affiliate promoted fights endpoint unavailable:', error.message);
        if (active) setAffiliatePromotedFights([]);
      }
    };

    fetchAffiliatePromotedFights();
    return () => { active = false; };
  }, [affiliate?._id, shadowMatchId]);

  const affiliateId = affiliate?._id ? String(affiliate._id) : '';
  const liveMatches = safeArray(matches);
  const joinedMembers = safeArray(affiliate?.usersJoined);

  const promotionFights = useMemo(
    () => dedupeAffiliateFightRows(safeArray(promoMatches).filter(isShadowLikeFight)),
    [promoMatches],
  );

  const legacyPromotedFights = useMemo(
    () => dedupeAffiliateFightRows(safeArray(promoMatches).filter((match) => isPromotedByAffiliate(match, affiliateId))),
    [affiliateId, promoMatches],
  );

  const promotedFights = useMemo(
    () => dedupeAffiliateFightRows([...safeArray(affiliatePromotedFights), ...legacyPromotedFights]),
    [affiliatePromotedFights, legacyPromotedFights],
  );

  const totalPromotions = liveMatches.filter(
    (match) => String(match?.affiliateId || '') === affiliateId,
  ).length;

  const fullName = [affiliate?.firstName, affiliate?.lastName]
    .filter(Boolean)
    .join(' ') || affiliate?.playerName || 'Affiliate';
  const profileImage = affiliate?.profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.webp`;
  const wrestlingMatches = safeWrestlingArray(wrestlingSummary?.matches);
  const wrestlingCommission = Number(wrestlingSummary?.totalCommissionTokens || 0);

  const handleCopy = async (event, match) => {
    event.stopPropagation();

    try {
      const encodedMatchName = encodeURIComponent(match?.matchName || 'fight');
      const encodedFullName = encodeURIComponent(fullName);
      const url = `https://fantasymmadness.com/shadow/${encodedMatchName}/${encodedFullName}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(getFightId(match));
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy promotion link:', error);
    }
  };

  const renderPagination = ({ startIndex, total, onPrevious, onNext, label }) => {
    if (total <= MAX_CARDS) return null;

    const currentPage = Math.floor(startIndex / MAX_CARDS) + 1;
    const totalPages = Math.ceil(total / MAX_CARDS);

    return (
      <nav className="affiliate-dashboard-pagination" aria-label={`${label} pages`}>
        <button type="button" disabled={startIndex <= 0} onClick={onPrevious}>
          <FaArrowLeft /> Previous
        </button>
        <span>Page <strong>{currentPage}</strong> of {totalPages}</span>
        <button type="button" disabled={startIndex + MAX_CARDS >= total} onClick={onNext}>
          Next <FaArrowRight />
        </button>
      </nav>
    );
  };

  if (promoMatchDetails.matchId) {
    return (
      <div className="experience-page affiliate-dashboard-detail-page">
        <button
          type="button"
          className="xp-dashboard-back"
          onClick={() => setPromoMatchDetails({ matchId: null, affiliateId: null, initialMatch: null })}
        >
          <FaArrowLeft /> Back to affiliate dashboard
        </button>
        <AffiliateMatchDetails
          matchId={promoMatchDetails.matchId}
          affiliateId={promoMatchDetails.affiliateId}
          initialMatch={promoMatchDetails.initialMatch}
        />
      </div>
    );
  }

  if (shadowMatchId) {
    return (
      <div className="experience-page affiliate-dashboard-detail-page">
        <button type="button" className="xp-dashboard-back" onClick={() => setShadowMatchId(null)}>
          <FaArrowLeft /> Back to affiliate dashboard
        </button>
        <AffiliateAddNewMatch matchId={shadowMatchId} />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="experience-page affiliate-auth-state">
        <div className="theme-container xp-route-loading">
          {authLoading ? 'Preparing affiliate command center…' : 'Sign in as an affiliate to open the creator command center.'}
          {!authLoading && (
            <Link className="theme-btn theme-btn-primary" href="/auth?mode=login&role=affiliate&next=/AffiliateDashboard">
              Affiliate sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Affiliate Dashboard | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-dashboard-experience-page">
        <section className="xp-affiliate-hero affiliate-dashboard-hero-final">
          <div className="xp-affiliate-hero-grid" aria-hidden="true" />
          <div className="theme-container xp-affiliate-hero-layout">
            <div className="xp-affiliate-profile-card">
              <div className="xp-affiliate-avatar"><img src={profileImage} alt={fullName} /></div>
              <div>
                <p className="xp-eyebrow"><FaBullhorn /> Creator command center</p>
                <h1>Build the card. <span>Move the crowd.</span></h1>
                <p>
                  Welcome back, {fullName}. Turn approved shadow templates into branded promotions,
                  grow your league, and manage every active campaign from one fight-night workspace.
                </p>
                <div className="xp-affiliate-hero-actions">
                  <a href="#shadow-templates" className="theme-btn theme-btn-primary">
                    Create a promotion <FaPlus />
                  </a>
                  <Link href="/affiliate-league" className="theme-btn theme-btn-secondary">
                    Manage league
                  </Link>
                </div>
              </div>
            </div>

            <aside className="xp-affiliate-pipeline-card">
              <span>Campaign pipeline</span>
              <h2>{promotedFights.length} live promotions</h2>
              <div className="xp-affiliate-pipeline">
                <div><i /><strong>{promotionFights.length}</strong><small>Templates ready</small></div>
                <div><i /><strong>{promotedFights.length}</strong><small>Promotions live</small></div>
                <div><i /><strong>{joinedMembers.length}</strong><small>League members</small></div>
              </div>
            </aside>
          </div>
        </section>

        <AffiliateExperienceNav />

        <main className="xp-page-main xp-dashboard-main affiliate-dashboard-main-final">
          <div className="theme-container">
            <section className="xp-dashboard-stat-grid xp-affiliate-stat-grid">
              <div><FaDollarSign /><span><strong>{Number(affiliate.tokens || 0).toLocaleString()}</strong><small>Affiliate balance</small></span></div>
              <div><FaEye /><span><strong>{Number(affiliate.totalViews || 0).toLocaleString()}</strong><small>Promotion views</small></span></div>
              <div><FaUserFriends /><span><strong>{joinedMembers.length}</strong><small>League members</small></span></div>
              <div><FaBullhorn /><span><strong>{totalPromotions}</strong><small>Total promotions</small></span></div>
            </section>

            <section className="xp-page-section" id="shadow-templates">
              <ExperienceSectionHeading
                eyebrow="Approved fight inventory"
                title="Shadow fight templates"
                description="All available Shadow/template fights appear here. Create a new promotion, or reopen a campaign you already promoted."
              />

              {promoLoading ? (
                <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /><div className="xp-loading-card" /></div>
              ) : promoError ? (
                <ExperienceEmptyState title="Templates unavailable" description={promoError} />
              ) : promotionFights.length ? (
                <>
                  <div className="xp-affiliate-fight-grid">
                    {promotionFights.slice(promoStartIndex, promoStartIndex + MAX_CARDS).map((match, index) => {
                      const fightId = getFightId(match);
                      const displayIndex = promoStartIndex + index;
                      return (
                        <article className="xp-affiliate-fight-card is-template" key={fightId || displayIndex}>
                          <div className="xp-affiliate-fight-media">
                            <figure><img src={getFighterImage(match, 'A', displayIndex)} alt={match?.matchFighterA || 'Fighter A'} /></figure>
                            <span>VS</span>
                            <figure><img src={getFighterImage(match, 'B', displayIndex)} alt={match?.matchFighterB || 'Fighter B'} /></figure>
                            <i>{getFightCategory(match)}</i>
                          </div>
                          <div className="xp-affiliate-fight-copy">
                            <p>Template {String(displayIndex + 1).padStart(2, '0')}</p>
                            <h3>{match?.matchFighterA || 'Fighter A'} <span>VS</span> {match?.matchFighterB || 'Fighter B'}</h3>
                            <div><span>{getFightRounds(match)}</span><span>{match?.matchName || 'Fight promotion'}</span></div>
                            <button
                              type="button"
                              className="theme-btn theme-btn-primary"
                              onClick={() => isPromotedByAffiliate(match, affiliateId)
                                ? setPromoMatchDetails({ matchId: fightId, affiliateId: affiliate._id, initialMatch: match })
                                : setShadowMatchId(fightId)}
                            >
                              {isPromotedByAffiliate(match, affiliateId) ? 'Open campaign' : 'Create promotion'} <FaArrowRight />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {renderPagination({
                    startIndex: promoStartIndex,
                    total: promotionFights.length,
                    label: 'Shadow template',
                    onPrevious: () => setPromoStartIndex((current) => Math.max(0, current - MAX_CARDS)),
                    onNext: () => setPromoStartIndex((current) => (
                      current + MAX_CARDS < promotionFights.length ? current + MAX_CARDS : current
                    )),
                  })}
                </>
              ) : (
                <ExperienceEmptyState
                  title="No new templates are available"
                  description="Approved templates that have not yet been promoted will appear here."
                />
              )}
            </section>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Live campaign room"
                title="Promoted fights"
                description="Open campaign details or copy the existing public promotion link for your audience."
                action={{ href: '/past-promotions', label: 'View campaign archive' }}
              />

              {promotedFights.length ? (
                <>
                  <div className="xp-affiliate-fight-grid">
                    {promotedFights.slice(promotedStartIndex, promotedStartIndex + MAX_CARDS).map((match, index) => {
                      const fightId = getFightId(match);
                      const displayIndex = promotedStartIndex + index;
                      return (
                        <article
                          className="xp-affiliate-fight-card is-promoted"
                          key={fightId || displayIndex}
                          onClick={() => setPromoMatchDetails({ matchId: fightId, affiliateId: affiliate._id, initialMatch: match })}
                        >
                          <div className="xp-affiliate-live-badge"><i /> Live promotion</div>
                          <div className="xp-affiliate-fight-media">
                            <figure><img src={getFighterImage(match, 'A', displayIndex + 2)} alt={match?.matchFighterA || 'Fighter A'} /></figure>
                            <span>VS</span>
                            <figure><img src={getFighterImage(match, 'B', displayIndex + 2)} alt={match?.matchFighterB || 'Fighter B'} /></figure>
                            <i>{getFightCategory(match)}</i>
                          </div>
                          <div className="xp-affiliate-fight-copy">
                            <p>Campaign {String(displayIndex + 1).padStart(2, '0')}</p>
                            <h3>{match?.matchFighterA || 'Fighter A'} <span>VS</span> {match?.matchFighterB || 'Fighter B'}</h3>
                            <div><span>{getFightRounds(match)}</span><span>{match?.matchName || 'Fight promotion'}</span></div>
                            <div className="xp-affiliate-card-actions">
                              <button
                                type="button"
                                className="theme-btn theme-btn-primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPromoMatchDetails({ matchId: fightId, affiliateId: affiliate._id, initialMatch: match });
                                }}
                              >
                                Open campaign <FaChartLine />
                              </button>
                              <button
                                type="button"
                                className="xp-copy-promo"
                                onClick={(event) => handleCopy(event, match)}
                                aria-label="Copy public promotion link"
                              >
                                {copiedId === fightId ? <FaCheck /> : <FaCopy />}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {renderPagination({
                    startIndex: promotedStartIndex,
                    total: promotedFights.length,
                    label: 'Promoted fight',
                    onPrevious: () => setPromotedStartIndex((current) => Math.max(0, current - MAX_CARDS)),
                    onNext: () => setPromotedStartIndex((current) => (
                      current + MAX_CARDS < promotedFights.length ? current + MAX_CARDS : current
                    )),
                  })}
                </>
              ) : (
                <ExperienceEmptyState
                  title="No live promotions yet"
                  description="Select a shadow template above to create your first active campaign."
                />
              )}
            </section>

            {(wrestlingLoading || wrestlingSummary) && (
              <section className="affiliate-wrestling-command-module">
                <div className="affiliate-wrestling-command-copy">
                  <p className="xp-eyebrow"><FaCrown /> Pro Wrestling game mode</p>
                  <h2>Bring your audience into the wrestling arena.</h2>
                  <p>
                    Pro Wrestling contests use the same Fantasy MMADNESS account, wallet, and affiliate attribution.
                    Share an assigned card and monitor entries and earned commission from this creator workspace.
                  </p>
                  <div className="affiliate-wrestling-command-stats">
                    <span><strong>{wrestlingLoading ? '—' : wrestlingMatches.length}</strong><small>Assigned cards</small></span>
                    <span><strong>{wrestlingLoading ? '—' : Number(wrestlingSummary?.attributedEntries || 0).toLocaleString()}</strong><small>Attributed entries</small></span>
                    <span><strong>{wrestlingLoading ? '—' : formatTokenAmount(wrestlingCommission)}</strong><small>Commission tokens</small></span>
                  </div>
                  <div className="affiliate-wrestling-command-actions">
                    <Link href="/pro-wrestling" className="theme-btn theme-btn-primary">Open wrestling lobby <FaArrowRight /></Link>
                    <Link href="/pro-wrestling/how-to-play" className="theme-btn theme-btn-secondary">Scoring guide</Link>
                  </div>
                </div>
                <div className="affiliate-wrestling-command-cards">
                  {wrestlingLoading ? (
                    <div className="affiliate-wrestling-command-empty">Loading assigned wrestling cards…</div>
                  ) : wrestlingMatches.length ? wrestlingMatches.slice(0, 2).map((match, index) => (
                    <Link
                      href={`/pro-wrestling/matches/${match._id}?affiliateId=${affiliateId}${match.referralCode ? `&referralCode=${encodeURIComponent(match.referralCode)}` : ''}`}
                      key={match._id}
                    >
                      <div><img src={getWrestlerImage(match.competitorA, 'A')} alt="" /><b>VS</b><img src={getWrestlerImage(match.competitorB, 'B')} alt="" /></div>
                      <p>{match.status} · {formatWrestlingDate(match.matchDate)}</p>
                      <h3>{match.matchTitle}</h3>
                      <span>{formatTokenAmount(match.currentPot)} token pot <FaArrowRight /></span>
                    </Link>
                  )) : (
                    <div className="affiliate-wrestling-command-empty"><FaCrown /><strong>No wrestling card is assigned yet.</strong><span>Assigned Pro Wrestling campaigns will appear here automatically.</span></div>
                  )}
                </div>
              </section>
            )}

            <section className="affiliate-dashboard-community-final">
              <div>
                <p className="xp-eyebrow">Creator operations</p>
                <h2>Your audience is the fight-night advantage.</h2>
                <p>
                  Keep your public identity current, review league membership, understand the program,
                  and maintain a clean archive of completed promotions.
                </p>
              </div>
              <div className="affiliate-dashboard-link-grid">
                <Link href="/affiliate-league"><FaTrophy /><span><strong>League manager</strong><small>Members and standings</small></span><FaArrowRight /></Link>
                <Link href="/AffiliateProfile"><FaUserFriends /><span><strong>Creator profile</strong><small>Public identity and referral</small></span><FaArrowRight /></Link>
                <Link href="/past-promotions"><FaHistory /><span><strong>Past promotions</strong><small>Completed campaigns</small></span><FaArrowRight /></Link>
                <Link href="/HowItWorks"><FaBullhorn /><span><strong>How it works</strong><small>Creator operating guide</small></span><FaArrowRight /></Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default AffiliateDashboard;
