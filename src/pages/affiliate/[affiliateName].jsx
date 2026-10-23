import { affiliateProfileImage, AFFILIATE_LOGO } from '@/Utils/affiliateProfileImage';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaArrowRight, FaBullhorn, FaTrophy, FaUsers } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';
import PromoTwo from '@/Components/Affiliates/PromoTwo';
import { getAffiliateNameSlug } from '@/Utils/affiliatePublicLink';
import { getFightCategory, getFightRounds, safeArray } from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const normalizeIdentifier = (value) => decodeURIComponent(String(value || '')).trim().toLowerCase();
const slugifyIdentifier = (value) => normalizeIdentifier(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const matchesAffiliateIdentifier = (affiliate, identifier) => {
  const normalized = normalizeIdentifier(identifier);
  const slug = slugifyIdentifier(identifier);
  const fullName = [affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ');
  const candidates = [affiliate?._id, affiliate?.id, affiliate?.playerName, affiliate?.affiliateName, affiliate?.leagueName, fullName, getAffiliateNameSlug(affiliate), `${getAffiliateNameSlug(affiliate)}-${String(affiliate?._id || affiliate?.id || '').slice(-6)}`]
    .filter(Boolean);
  return candidates.some((candidate) => normalizeIdentifier(candidate) === normalized || slugifyIdentifier(candidate) === slug);
};

const AffiliateAllPromos = ({ affiliate, promoMatches }) => {
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
  const requestedAffiliateId = String(context.query.affiliateId || '').trim();
  let affiliate = null;
  let promoMatches = [];

  try {
    // Original affiliate lookup: try the public directory and legacy name endpoint.
    // Older affiliate records may only be present in the legacy service.
    const lookupNames = [...new Set([
      String(affiliateName).replace(/-/g, ' '),
      String(affiliateName),
    ])];
    const candidateResponses = await Promise.all([
      fetch(`${API_BASE}/api/public/affiliates?limit=200`, { signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(`${API_BASE}/affiliates`, { signal: AbortSignal.timeout(8000) }).catch(() => null),
      ...lookupNames.map((name) => fetch(`${API_BASE}/affiliateByName?fullName=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null)),
    ]);
    for (const response of candidateResponses) {
      if (!response?.ok) continue;
      const payload = await response.json().catch(() => null);
      const rows = Array.isArray(payload) ? payload
        : Array.isArray(payload?.affiliates) ? payload.affiliates
        : Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload?.items) ? payload.items
        : payload && typeof payload === 'object' ? [payload] : [];
      const matches = rows.filter((row) => row && (row._id || row.id)
        && (requestedAffiliateId
          ? String(row._id || row.id) === requestedAffiliateId
          : matchesAffiliateIdentifier(row, affiliateName)));
      if (matches.length === 1) {
        affiliate = matches[0];
        break;
      }
    }

    const [promoRes, publicFightsRes] = await Promise.all([
      fetch(`${API_BASE}/shadow`),
      fetch(`${API_BASE}/api/public/fights?limit=500`),
    ]);
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

  return { props: { affiliate, promoMatches } };
}

export default AffiliateAllPromos;
