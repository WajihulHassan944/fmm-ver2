import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FIGHTS_PER_PAGE = 6;

const PastPromotions = () => {
  const dispatch = useDispatch();
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
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
        const response = await fetch(`${API_BASE}/shadow`);
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

    return sortFights(completed, 'desc');
  }, [affiliateId, matches, promoMatches]);

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
            { href: '/AffiliateDashboard', label: 'Affiliate dashboard' },
            { href: '/affiliate-league', label: 'League manager', variant: 'secondary' },
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
                description="The existing shadow-fight records are matched with closed affiliate fights, preserving the original campaign history logic."
              />

              {loadingPromotions || (matchStatus === 'loading' && !safeArray(matches).length) ? (
                <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /><div className="xp-loading-card" /></div>
              ) : promotionError ? (
                <ExperienceEmptyState
                  title="Promotion history unavailable"
                  description={promotionError}
                  action={{ href: '/AffiliateDashboard', label: 'Return to dashboard' }}
                />
              ) : visibleFights.length ? (
                <div className="affiliate-past-promotion-grid">
                  {visibleFights.map((fight, index) => {
                    const resultId = fight?._resultId;
                    return (
                      <article className="affiliate-past-promotion-card" key={resultId || fight?._shadowId || index}>
                        <div className="affiliate-past-promotion-media">
                          <figure>
                            <img src={getFighterImage(fight, 'A', index)} alt={fight?.matchFighterA || 'Fighter A'} />
                            <figcaption>{fight?.matchFighterA || 'Fighter A'}</figcaption>
                          </figure>
                          <div><span>{getFightCategory(fight)}</span><strong>VS</strong><small>Final</small></div>
                          <figure>
                            <img src={getFighterImage(fight, 'B', index)} alt={fight?.matchFighterB || 'Fighter B'} />
                            <figcaption>{fight?.matchFighterB || 'Fighter B'}</figcaption>
                          </figure>
                        </div>
                        <div className="affiliate-past-promotion-copy">
                          <p><FaCalendarAlt /> {formatFightDate(fight, { short: true })}</p>
                          <h3>{fight?.matchName || `${fight?.matchFighterA || 'Fighter A'} vs ${fight?.matchFighterB || 'Fighter B'}`}</h3>
                          <div>
                            <span><FaTrophy /> Prize pot {Number(fight?.pot || 0).toLocaleString()}</span>
                            <span>{Number(fight?.matchTokens || 0).toLocaleString()} token buy-in</span>
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
                  action={{ href: '/AffiliateDashboard', label: 'Create a promotion' }}
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
