import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link, { affiliateCommandHref, useAffiliateCommandAccount } from '@/Components/Affiliates/AffiliateCommandContext';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaHistory,
  FaTrophy,
} from 'react-icons/fa';
import { fetchMatches } from '../../../Redux/matchSlice';
import AffiliateExperienceNav from '../AffiliateExperienceNav';
import { ExperienceEmptyState, ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import {
  FMM_ASSET_BASE,
  formatFightDate,
  getFightCategory,
  getFightId,
  getFighterImage,
  safeArray,
  sortFights,
} from '@/Utils/fightExperience';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

const API_BASE = PUBLIC_API_BASE_URL;
const FIGHTS_PER_PAGE = 6;

const PastPromotions = () => {
  const dispatch = useDispatch();
  const { affiliate, authLoading, ownerAccount } = useAffiliateCommandAccount();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  const [promoMatches, setPromoMatches] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [promotionError, setPromotionError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    let active = true;

    const fetchPromoMatches = async () => {
      setLoadingPromotions(true);
      setPromotionError('');

      try {
        const response = await fetch(`${API_BASE}/shadow?compact=promotion&limit=150`);
        if (!response.ok) throw new Error('Failed to fetch promo matches');
        const data = await response.json();
        if (active) setPromoMatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (active) {
          setPromoMatches([]);
          setPromotionError('Completed promotions could not be loaded.');
        }
      } finally {
        if (active) setLoadingPromotions(false);
      }
    };

    fetchPromoMatches();
    return () => {
      active = false;
    };
  }, []);

  const affiliateId = String(affiliate?._id || '');
  const workspaceHref = (href) => ownerAccount ? affiliateCommandHref(affiliateId, href) : href;
  const [finishedCampaigns, setFinishedCampaigns] = useState([]);

  useEffect(() => {
    if (!affiliateId) return undefined;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/affiliate/${encodeURIComponent(affiliateId)}/promoted-fights?limit=100&includeShadow=true`, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) return;
      const { items } = await response.json();
      if (!controller.signal.aborted) {
        setFinishedCampaigns(safeArray(items).filter((fight) => (
          fight.prizesSettledAt || fight.settledAt || /^(finished|completed|final|result|closed)$/i.test(String(fight.matchStatus || fight.status || '').trim())
        )).map((fight) => ({ ...fight, _resultId: getFightId(fight) })));
      }
    }).catch(() => {
      // The older archive records can still be loaded independently.
    });
    return () => controller.abort();
  }, [affiliateId]);

  const promotedFights = useMemo(() => {
    const allMatches = safeArray(matches);
    const completed = safeArray(promoMatches).reduce((items, shadowMatch) => {
      const affiliateRecord = safeArray(shadowMatch?.AffiliateIds).find(
        (affiliateObject) => String(affiliateObject?.AffiliateId || '') === affiliateId,
      );
      if (!affiliateRecord) return items;

      const linkedMatch = allMatches.find(
        (match) => String(getFightId(match)) === String(affiliateRecord?.matchId || ''),
      );
      if (!linkedMatch || linkedMatch?.matchShadowOpenStatus !== 'closed') return items;

      items.push({
        ...shadowMatch,
        ...linkedMatch,
        _shadowId: getFightId(shadowMatch),
        _resultId: getFightId(linkedMatch),
      });
      return items;
    }, []);

    const byResult = new Map([...completed, ...finishedCampaigns].map((fight) => [String(fight._resultId), fight]));
    return sortFights([...byResult.values()], 'desc');
  }, [affiliateId, matches, promoMatches, finishedCampaigns]);

  const totalPages = Math.max(1, Math.ceil(promotedFights.length / FIGHTS_PER_PAGE));
  const visibleFights = promotedFights.slice((page - 1) * FIGHTS_PER_PAGE, page * FIGHTS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!affiliate) {
    return (
      <div className="experience-page affiliate-auth-state">
        <div className="theme-container xp-route-loading">
          {authLoading ? 'Preparing promotion history…' : 'Sign in as an affiliate to view completed promotion campaigns.'}
          {!authLoading && (
            <Link className="theme-btn theme-btn-primary" href="/auth?mode=login&role=affiliate&next=/past-promotions">
              Affiliate sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Past Promotions | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-past-promotions-page">
        <ExperienceHero
          eyebrow="Creator campaign archive"
          title="Past promotions."
          accent="Permanent fight history."
          description="Review completed affiliate fight cards, reopen available results, and maintain a polished record of every campaign your league has promoted."
          backgroundImage="/images/fmm-pages/premium-arena-banner.webp"
          actions={[
            { href: workspaceHref('/AffiliateDashboard'), label: 'Affiliate dashboard' },
            { href: workspaceHref('/affiliate-league'), label: 'League manager', variant: 'secondary' },
          ]}
          stats={[
            { value: promotedFights.length, label: 'Completed campaigns', icon: FaHistory },
          ]}
        >
        </ExperienceHero>

        <AffiliateExperienceNav />

        <main className="xp-page-main affiliate-past-main-final">
          <div className="theme-container">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Completed campaign cards"
                title="Promotion history"
                description="Review previous campaigns and open their official results."
              />

              {loadingPromotions || (matchStatus === 'loading' && !safeArray(matches).length) ? (
                <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /><div className="xp-loading-card" /></div>
              ) : promotionError && !visibleFights.length ? (
                <ExperienceEmptyState
                  title="Promotion history unavailable"
                  description={promotionError}
                  action={{ href: workspaceHref('/AffiliateDashboard#available-fights'), label: 'Browse upcoming fights' }}
                />
              ) : visibleFights.length ? (
                <div className="affiliate-past-promotion-grid">
                  {visibleFights.map((fight, index) => {
                    const resultId = fight?._resultId;
                    return (
                      <article className="affiliate-past-promotion-card" key={resultId || fight?._shadowId || index}>
                        <div className="affiliate-past-promotion-media">
                          <figure>
                            <img src={getFighterImage(fight, 'A', index)} alt={fight?.matchFighterA || 'Fighter A'} loading="lazy" decoding="async" />
                            <figcaption>{fight?.matchFighterA || 'Fighter A'}</figcaption>
                          </figure>
                          <div><span>{getFightCategory(fight)}</span><strong>VS</strong><small>Final</small></div>
                          <figure>
                            <img src={getFighterImage(fight, 'B', index)} alt={fight?.matchFighterB || 'Fighter B'} loading="lazy" decoding="async" />
                            <figcaption>{fight?.matchFighterB || 'Fighter B'}</figcaption>
                          </figure>
                        </div>
                        <div className="affiliate-past-promotion-copy">
                          <p><FaCalendarAlt /> {formatFightDate(fight, { short: true })}</p>
                          <h3>{fight?.matchName || `${fight?.matchFighterA || 'Fighter A'} vs ${fight?.matchFighterB || 'Fighter B'}`}</h3>
                          <div>
                            <span><FaTrophy /> Prize pot {Number(fight?.pot || 0).toLocaleString()}</span>
                            <span>{Number(fight?.matchTokens || 0).toLocaleString()} FM COINS buy-in</span>
                          </div>
                          {resultId ? (
                            <Link href={`/past-fight/${resultId}`} className="theme-btn theme-btn-secondary">
                              View official result <FaArrowRight />
                            </Link>
                          ) : (
                            <span className="affiliate-past-unavailable">Result identifier unavailable</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <ExperienceEmptyState
                  title="No past promoted fights"
                  description="Completed affiliate promotions will appear here once their corresponding fight is closed."
                  action={{ href: workspaceHref('/AffiliateDashboard#available-fights'), label: 'Browse upcoming fights' }}
                />
              )}

              {promotedFights.length > FIGHTS_PER_PAGE && (
                <nav className="affiliate-past-pagination" aria-label="Past promotion pages">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    <FaArrowLeft /> Previous
                  </button>
                  <span>Page <strong>{page}</strong> of {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    Next <FaArrowRight />
                  </button>
                </nav>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default PastPromotions;
