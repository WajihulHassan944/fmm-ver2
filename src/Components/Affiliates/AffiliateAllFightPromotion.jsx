import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaBullhorn, FaCheck, FaCoins, FaCopy, FaExternalLinkAlt, FaEye, FaHistory, FaUsers } from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import AffiliateExperienceNav from './AffiliateExperienceNav';

const safeNumber = (value) => Number(value || 0).toLocaleString();

export default function AffiliateAllFightPromotion() {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const dispatch = useDispatch();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [matchStatus, dispatch]);

  const promoUrl = useMemo(() => {
    if (!affiliate) return '';
    // IDs do not change when a promoter edits their name or league branding.
    // The public route still accepts legacy name/username links.
    const publicIdentifier = affiliate._id || affiliate.id || affiliate.playerName
      || `${affiliate.firstName || ''} ${affiliate.lastName || ''}`.trim();
    return `https://fantasymmadness.com/affiliate/${encodeURIComponent(publicIdentifier)}`;
  }, [affiliate]);

  const promoted = (Array.isArray(matches) ? matches : []).filter(
    (match) => String(match.affiliateId || '') === String(affiliate?._id || ''),
  );
  const leagueCount = affiliate?.usersJoined?.length || 0;

  const copyPromotionUrl = async () => {
    try {
      await navigator.clipboard.writeText(promoUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy promotion URL:', error);
    }
  };

  if (!affiliate) {
    return <div className="affiliate-auth-state"><div className="xp-route-loading">Preparing your promotion center…</div></div>;
  }

  const fullName = `${affiliate.firstName || ''} ${affiliate.lastName || ''}`.trim() || affiliate.playerName || 'Affiliate';
  const avatar = affiliate.profileUrl || '/images/fmm-experience/avatar-placeholder.svg';

  return (
    <>
      <Head><title>Promotion Center | FANTASY MMADNESS</title></Head>
      <div className="experience-page affiliate-promotion-center-page">
        <AffiliateExperienceNav />
        <section className="affiliate-promotion-center-hero">
          <div className="theme-container affiliate-promotion-center-hero-grid">
            <div>
              <button type="button" className="affiliate-promotion-back" onClick={() => router.back()}><FaArrowLeft /> Back</button>
              <p className="xp-eyebrow"><FaBullhorn /> Affiliate promotion center</p>
              <h1>One link. Every fight. <span>Your league.</span></h1>
              <p>Share a single branded destination for your audience, then track views, members, campaigns and earnings from the same workspace.</p>
            </div>
            <aside className="affiliate-promotion-identity">
              <img src={avatar} alt={fullName} />
              <div><small>Promoter profile</small><strong>{fullName}</strong><span>{leagueCount} league members</span></div>
            </aside>
          </div>
        </section>

        <main className="theme-container affiliate-promotion-center-main">
          <section className="affiliate-promotion-link-card">
            <div><small>Universal promotion link</small><h2>Send fans to your complete fight room.</h2><p>{promoUrl}</p></div>
            <div className="affiliate-promotion-link-actions">
              <button type="button" onClick={copyPromotionUrl}>{copied ? <FaCheck /> : <FaCopy />}{copied ? 'Copied' : 'Copy link'}</button>
              <a href={promoUrl} target="_blank" rel="noreferrer"><FaExternalLinkAlt /> Preview</a>
            </div>
          </section>

          <section className="affiliate-promotion-stat-grid" aria-label="Affiliate promotion summary">
            <article><FaCoins /><span><small>Balance</small><strong>{safeNumber(affiliate.tokens)}</strong><em>FM COINS</em></span></article>
            <article><FaEye /><span><small>Promotion views</small><strong>{safeNumber(affiliate.totalViews)}</strong><em>All-time reach</em></span></article>
            <article><FaUsers /><span><small>League members</small><strong>{safeNumber(leagueCount)}</strong><em>Connected players</em></span></article>
            <article><FaBullhorn /><span><small>Promotions</small><strong>{safeNumber(promoted.length)}</strong><em>Campaigns created</em></span></article>
          </section>

          <section className="affiliate-promotion-command-grid">
            <Link href="/AffiliateDashboard#shadow-templates"><FaBullhorn /><span><small>Create</small><strong>Promote a fight</strong><em>Choose an approved fight template and launch a campaign.</em></span></Link>
            <Link href="/promoter/full-cards"><FaUsers /><span><small>Full cards</small><strong>Build an event</strong><em>Group selected bouts into one promoter experience.</em></span></Link>
            <Link href="/past-promotions"><FaHistory /><span><small>History</small><strong>Past promotions</strong><em>Review completed campaigns and their player activity.</em></span></Link>
            <Link href="/affiliate-money"><FaCoins /><span><small>Earnings</small><strong>Money desk</strong><em>Review commissions, balances and payout history.</em></span></Link>
          </section>
        </main>
      </div>
    </>
  );
}
