import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { getUserToken, userHeaders } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';
import {getAffiliateFightShareUrl} from '@/Utils/affiliatePublicLink';
import {affiliateAcceptanceConfig} from '@/server/affiliateAcceptanceConfig.cjs';
import {appendCampaignParams} from '@/Utils/affiliateSignupRedirect.cjs';
import styles from './league.module.css';

export default function AffiliateFightLeague({ affiliate, fight, fightId, stagingLeague=null }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const affiliateId = String(affiliate._id);
  const leagueName = String(affiliate.leagueName || affiliate.playerName || [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || 'Affiliate');
  const title = [fight?.matchFighterA, fight?.matchFighterB].filter(Boolean).join(' vs ') || 'Fight night';
  const fightUrl = appendCampaignParams(`${fight.gameMode === 'PRO_WRESTLING' ? '/pro-wrestling/matches' : '/fight'}/${encodeURIComponent(fightId)}?ref=${encodeURIComponent(affiliateId)}&affiliateId=${encodeURIComponent(affiliateId)}&fromLeague=1`,router.query);
  const leagueReturnPath = appendCampaignParams(getAffiliateFightShareUrl(affiliate,fightId),router.query);
  const authPath = mode => appendCampaignParams(`/auth?${new URLSearchParams({mode,role:'player',next:leagueReturnPath,referrer:affiliateId,fight:fightId})}`,router.query);
  const shareImage = `${SITE_URL}/api/fight-share-image?fightId=${encodeURIComponent(fightId)}&affiliateId=${encodeURIComponent(affiliateId)}&format=facebook&v=13`;
  const shareTitle = `Join ${leagueName}'s league for ${title} | FANTASY MMADNESS`;
  const shareDescription = `${title}: make your picks in ${leagueName}'s league${Number(fight?.pot) > 0 ? ` for a ${Number(fight.pot).toLocaleString()} FM COINS prize pool` : ''}. Open the fight to see entry details, eligibility, and rules.`;

  if(stagingLeague)return <main className={styles.page}><Head><title>{`Verified staging league | FANTASY MMADNESS`}</title><meta name="robots" content="noindex,nofollow"/></Head><div className={styles.shell}><section className={styles.content}><p>ISOLATED STAGING · VERIFIED TEST LEAGUE</p><h1>{leagueName}</h1><p>{title}</p><p>This approved staging identity is mapped to this published fight. TEST entries create no real charge or commission.</p><img src={'/api/growth-affiliate-sandbox/leagues/'+stagingLeague.id+'/qr.png'} alt="Verified staging league QR" width="260" height="260"/><p>Affiliate: {affiliateId}</p><p>Fight: {fightId}</p><Link href="/administration/growth?engine=affiliates">Owner TEST-entry and acceptance controls</Link></section></div></main>;

  const join = async () => {
    if (!getUserToken()) {
      router.push(authPath('signup'));
      return;
    }
    if (joining) return;
    setJoining(true);
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/affiliate/${encodeURIComponent(affiliateId)}/join`, {
        method: 'POST', headers: userHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fightId }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok || (response.status === 400 && /already joined/i.test(result.message || ''))) {
        if (response.ok) toast.success(`You joined ${leagueName}'s league.`);
        router.push(fightUrl);
      } else if (response.status === 401 || response.status === 403) {
        router.push(authPath('login'));
      } else throw new Error(result.message || 'Could not join this league.');
    } catch (error) { toast.error(error.message); }
    finally { setJoining(false); }
  };

  return <main className={styles.page}>
    <Head>
      <title>Join {leagueName}&apos;s league | FANTASY MMADNESS</title>
      <meta key="og:title" property="og:title" content={shareTitle} />
      <meta key="og:description" property="og:description" content={shareDescription} />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:url" property="og:url" content={`${SITE_URL}${router.asPath.split('#')[0]}`} />
      <meta key="og:image" property="og:image" content={shareImage} />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:image:alt" property="og:image:alt" content={`${leagueName}'s fight poster with personal QR`} />
      <meta key="twitter:image" name="twitter:image" content={shareImage} />
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={shareTitle} />
      <meta key="twitter:description" name="twitter:description" content={shareDescription} />
    </Head>
    <div className={styles.shell}>
      <img className={styles.poster} src={shareImage} alt={`${title} poster with ${leagueName}'s tracked QR`} />
      <section className={styles.content}>
        <span className={styles.eyebrow}>FANTASY MMADNESS · FIGHT NIGHT</span>
        <h1>Join {leagueName}&apos;s league</h1>
        <p>{title} is ready for your picks. This is {leagueName}&apos;s personal league link; joining here connects your account to their league.</p>
        <button type="button" disabled={joining} onClick={join}>{joining ? 'Joining league…' : 'Join this league'}</button>
        <p className={styles.hint}>New to FANTASY MMADNESS? We’ll guide you through player signup first. Then return here and join.</p>
        <Link href={fightUrl}>See the fight details →</Link>
      </section>
    </div>
  </main>;
}

export async function getServerSideProps({ params, query, req, res }) {
  // Next merges a dynamic [affiliateId] segment over the same-named query key.
  // Read the explicit persisted ID from the request rather than the display slug.
  const requestedIds = new URL(req?.url || '/', 'https://fixture.invalid').searchParams.getAll('affiliateId');
  if (requestedIds.length > 1) return { notFound: true };
  const affiliateId = String(requestedIds[0] || params?.affiliateId || '');
  const fightId = String(query?.fightId || '');
  if (!/^[a-f\d]{24}$/i.test(affiliateId) || !/^[a-f\d]{24}$/i.test(fightId)) return { notFound: true };
  if(query.stagingLeagueId){const cfg=affiliateAcceptanceConfig();if(!cfg||!/^[a-f\d]{24}$/i.test(String(query.stagingLeagueId)))return{notFound:true};try{const r=await fetch(cfg.origin+'/api/growth/affiliate-sandbox/leagues/'+query.stagingLeagueId,{redirect:'error',signal:AbortSignal.timeout(15000)}),j=await r.json(),l=j.league;if(!r.ok||!l?.stagingOnly||!l.verified||l.accountId!==affiliateId||l.fightId!==fightId)return{notFound:true};res.setHeader('Cache-Control','no-store');return{props:{affiliate:{_id:l.accountId,firstName:l.displayName,leagueName:l.displayName},fight:{matchFighterA:l.fight.fighterA,matchFighterB:l.fight.fighterB},fightId,stagingLeague:{id:l.id}}};}catch{return{notFound:true};}}
  try {
    const [affiliateResponse, fightResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates/${encodeURIComponent(affiliateId)}`),
      fetch(`${PUBLIC_API_BASE_URL}/api/public/fights/${fightId}`),
    ]);
    if (!affiliateResponse.ok || !fightResponse.ok) return { notFound: true };
    const [affiliate, payload] = await Promise.all([affiliateResponse.json(), fightResponse.json()]);
    const fight = payload.fight || payload.data || payload;
    if (!affiliate || !fight?._id) return { notFound: true };
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { affiliate, fight: { gameMode: fight.gameMode || '', matchFighterA: fight.matchFighterA || '', matchFighterB: fight.matchFighterB || '', pot: fight.pot || 0 }, fightId } };
  } catch (error) {
    console.error('Affiliate league landing failed:', error);
    return { notFound: true };
  }
}
