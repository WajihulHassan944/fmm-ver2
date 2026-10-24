import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaArrowRight, FaBullhorn, FaTrophy, FaUsers } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';
import PromoTwo from '@/Components/Affiliates/PromoTwo';
import { getFightCategory, getFightRounds, safeArray } from '@/Utils/fightExperience';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { affiliateProfileImage, AFFILIATE_LOGO } from '@/Utils/affiliateProfileImage';
import { getAffiliateNameSlug } from '@/Utils/affiliatePublicLink';
import { rememberAffiliateRef } from '@/Utils/affiliateAttribution';

const API_BASE = PUBLIC_API_BASE_URL;

// Shown only when an old name-only link matches more than one affiliate (for example two
// people with the same name). We never guess: the visitor picks the right person, and each
// choice opens that account's own id-based page.
const AffiliateChooser = ({ choices }) => (
  <section className="public-affiliate-campaign-page">
    <div className="theme-container">
      <header className="public-affiliate-campaign-header">
        <span><p className="xp-eyebrow"><FaUsers /> More than one creator uses this name</p><h2>Which creator are you looking for?</h2></span>
      </header>
      <div className="public-affiliate-campaign-grid">
        {choices.map((choice) => {
          const name = [choice.firstName, choice.lastName].filter(Boolean).join(' ') || choice.playerName || 'Affiliate';
          const href = `/affiliate/${encodeURIComponent(getAffiliateNameSlug(choice) || choice._id)}?affiliateId=${encodeURIComponent(choice._id)}`;
          return (
            <a key={choice._id} href={href} className="public-affiliate-campaign-card" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="public-affiliate-campaign-owner">
                <img src={affiliateProfileImage(choice.profileUrl)} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = AFFILIATE_LOGO; }} alt={name} />
                <span><h3>{name}</h3><small>{[choice.playerName && choice.playerName !== name ? choice.playerName : '', choice.leagueName || ''].filter(Boolean).join(' · ') || 'Creator league'}</small></span>
              </div>
              <div className="public-affiliate-campaign-copy"><button type="button">Open this creator <FaArrowRight /></button></div>
            </a>
          );
        })}
      </div>
    </div>
  </section>
);

const AffiliateAllPromos = ({ affiliate, promoMatches, choices = [] }) => {
  const router = useRouter();
  const [promoMatchDetails, setPromoMatchDetails] = useState({ matchId: null, affiliateId: null });

  const visiblePromotions = useMemo(() => {
    if (!affiliate?._id) return [];
    return safeArray(promoMatches).filter((match) => (
      String(match?.affiliateId || '') === String(affiliate._id)
      || safeArray(match?.AffiliateIds).some(
        (affiliateObject) => String(affiliateObject?.AffiliateId || '') === String(affiliate._id),
      )
    ));
  }, [affiliate, promoMatches]);

  // Count a public-page view once per browser session. The previous page that did this
  // is no longer routed, so without this the admin "page views" number never moved.
  useEffect(() => {
    const id = String(affiliate?._id || '');
    if (!id) return;
    // Remember this affiliate so "Explore all fights" / "Join free" keep the referral.
    rememberAffiliateRef(id);
    try {
      const key = `fmm-affiliate-view-${id}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch (error) { /* storage unavailable: count this page load */ }
    fetch(`${PUBLIC_API_BASE_URL}/affiliate/${encodeURIComponent(id)}/incrementViews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }, [affiliate?._id]);

  if (!affiliate && choices.length > 1) return <AffiliateChooser choices={choices} />;

  if (!affiliate) {
    return <div className="public-promo-loading is-error">This affiliate profile is not currently available.</div>;
  }

  const handlePromoMatchClick = (matchId, affiliateId) => {
    setPromoMatchDetails({ matchId, affiliateId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (promoMatchDetails.matchId) {
    return (
      <div className="public-promo-detail-route">
        <button type="button" className="public-promo-back" onClick={() => setPromoMatchDetails({ matchId: null, affiliateId: null })}>
          <FaArrowLeft /> Back to campaigns
        </button>
        <PromoTwo matchId={promoMatchDetails.matchId} affiliateId={promoMatchDetails.affiliateId} />
      </div>
    );
  }

  const affiliateName = [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || affiliate.playerName || 'Affiliate';
  const memberCount = Array.isArray(affiliate.usersJoined)
    ? affiliate.usersJoined.length
    : Number(affiliate.usersJoined || 0);

  return (
    <section className="public-affiliate-campaign-page">
      <div className="theme-container">
        <header className="public-affiliate-campaign-header">
          <div className="public-affiliate-campaign-owner">
            <img src={affiliateProfileImage(affiliate.profileUrl)} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = AFFILIATE_LOGO; }} alt={affiliateName} />
            <span><p className="xp-eyebrow"><FaBullhorn /> Creator fight room</p><h2>{affiliateName}&apos;s campaigns</h2><small><FaUsers /> {memberCount} league members</small></span>
          </div>
          <button type="button" className="theme-btn theme-btn-secondary" onClick={() => router.push('/upcomingfights')}>Explore all fights <FaArrowRight /></button>
        </header>

        {visiblePromotions.length ? (
          <div className="public-affiliate-campaign-grid">
            {visiblePromotions.map((match, index) => (
              <article key={match?._id || index} className="public-affiliate-campaign-card" onClick={() => handlePromoMatchClick(match._id, affiliate._id)}>
                <div className="public-affiliate-campaign-media">
                  <figure><img src={match.fighterAImage} alt={match.matchFighterA || 'Fighter A'} /></figure>
                  <div><span>{getFightCategory(match)}</span><strong>VS</strong><small>{getFightRounds(match)}</small></div>
                  <figure><img src={match.fighterBImage} alt={match.matchFighterB || 'Fighter B'} /></figure>
                </div>
                <div className="public-affiliate-campaign-copy">
                  <p>Promotion {String(index + 1).padStart(2, '0')}</p>
                  <h3>{match.matchFighterA || 'Fighter A'} <span>vs</span> {match.matchFighterB || 'Fighter B'}</h3>
                  <div><span><FaTrophy /> {Number(match.pot || 0).toLocaleString()} FM COINS pot</span><span><FaCoins /> {match.matchTokens || 0} FM COINS entry</span></div>
                  <button type="button">Open promoted campaign <FaArrowRight /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="public-affiliate-campaign-empty"><FaBullhorn /><h3>No live promoted campaigns</h3><p>This creator has not published an active fight promotion yet.</p></div>
        )}
      </div>
    </section>
  );
};

export async function getServerSideProps(context) {
  const { affiliateName } = context.params;
  const queryId = (value) => String(Array.isArray(value) ? value[0] : value || '').trim();
  // Older links may carry the account id as ?affiliateId= or ?ref=.
  const requestedAffiliateId = queryId(context.query.affiliateId) || (/^[a-f\d]{24}$/i.test(queryId(context.query.ref)) ? queryId(context.query.ref) : '');
  let affiliate = null;
  let promoMatches = [];
  let choices = [];

  try {
    // ONE authoritative lookup (backend /api/public/affiliates/resolve):
    // exact account id and/or slug, never a substitute. If both are supplied they
    // must be the same record, otherwise the page is "not found".
    const params = new URLSearchParams({ slug: String(affiliateName || '') });
    if (requestedAffiliateId) params.set('id', requestedAffiliateId);
    const [resolveRes, promoRes, publicFightsRes] = await Promise.all([
      fetch(`${API_BASE}/api/public/affiliates/resolve?${params.toString()}`),
      fetch(`${API_BASE}/shadow`),
      fetch(`${API_BASE}/api/public/fights?limit=500`),
    ]);
    if (resolveRes.ok) {
      const resolved = await resolveRes.json();
      if (resolved?._id) affiliate = resolved;
    }
    // Old/renamed links: the unique account id is authoritative. If the name part no longer
    // matches (renamed account, old link format), send the visitor to that same account's
    // current page. The id never changes, so this can never switch to a different person.
    if (!affiliate && /^[a-f\d]{24}$/i.test(requestedAffiliateId)) {
      const byIdRes = await fetch(`${API_BASE}/api/public/affiliates/resolve?id=${encodeURIComponent(requestedAffiliateId)}`);
      const byId = byIdRes.ok ? await byIdRes.json() : null;
      if (byId?._id && String(byId._id) === requestedAffiliateId) {
        const slug = byId.slug || getAffiliateNameSlug(byId) || requestedAffiliateId;
        // Already on that address (e.g. an account with no name): show it, never loop.
        if (slug === String(affiliateName || '')) affiliate = byId;
        else return { redirect: { destination: `/affiliate/${encodeURIComponent(slug)}?affiliateId=${encodeURIComponent(requestedAffiliateId)}`, permanent: false } };
      }
    }
    // Name-only link that matches more than one account: list them so the visitor can choose.
    if (!affiliate && !requestedAffiliateId && resolveRes.status === 409) {
      const listRes = await fetch(`${API_BASE}/api/public/affiliates?limit=200`);
      const list = listRes.ok ? await listRes.json() : [];
      const wanted = String(affiliateName || '').toLowerCase();
      choices = safeArray(list).filter((row) => row?._id && getAffiliateNameSlug(row) === wanted);
    }
    if (!affiliate && choices.length < 2) context.res.statusCode = 404;
    const shadowRows = promoRes.ok ? await promoRes.json() : [];
    const publicFightPayload = publicFightsRes.ok ? await publicFightsRes.json() : [];
    const publicFightRows = Array.isArray(publicFightPayload)
      ? publicFightPayload
      : publicFightPayload.items || publicFightPayload.fights || publicFightPayload.matches || publicFightPayload.data || [];
    const byId = new Map([...safeArray(shadowRows), ...safeArray(publicFightRows)]
      .filter((row) => row?._id)
      .map((row) => [String(row._id), row]));
    promoMatches = [...byId.values()];
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  return { props: { affiliate, promoMatches, choices } };
}

export default AffiliateAllPromos;
