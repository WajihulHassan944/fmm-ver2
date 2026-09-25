import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { getUserToken, userHeaders } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';
import styles from './league.module.css';

export default function AffiliateFightLeague({ affiliate, fight, fightId }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const affiliateId = String(affiliate._id);
  const leagueName = String(affiliate.leagueName || affiliate.playerName || [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || 'Affiliate');
  const title = [fight?.matchFighterA, fight?.matchFighterB].filter(Boolean).join(' vs ') || 'Fight night';
  const fightUrl = `/fight/${encodeURIComponent(fightId)}?ref=${encodeURIComponent(affiliateId)}&fromLeague=1`;
  const shareImage = `${SITE_URL}/api/fight-share-image?fightId=${encodeURIComponent(fightId)}&affiliateId=${encodeURIComponent(affiliateId)}&v=4`;

  const join = async () => {
    if (!getUserToken()) {
      const next = `/league/${encodeURIComponent(affiliateId)}?fightId=${encodeURIComponent(fightId)}`;
      router.push(`/auth?mode=signup&role=player&next=${encodeURIComponent(next)}&referrer=${encodeURIComponent(affiliateId)}&fight=${encodeURIComponent(fightId)}`);
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
        const next = `/league/${encodeURIComponent(affiliateId)}?fightId=${encodeURIComponent(fightId)}`;
        router.push(`/auth?mode=login&role=player&next=${encodeURIComponent(next)}&referrer=${encodeURIComponent(affiliateId)}&fight=${encodeURIComponent(fightId)}`);
      } else throw new Error(result.message || 'Could not join this league.');
    } catch (error) { toast.error(error.message); }
    finally { setJoining(false); }
  };

  return <main className={styles.page}>
    <Head>
      <title>Join {leagueName}&apos;s league | FANTASY MMADNESS</title>
      <meta key="og:title" property="og:title" content={`Join ${leagueName}'s league for ${title}`} />
      <meta key="og:description" property="og:description" content={`Join ${leagueName}'s Fantasy MMAdness league and make your picks for ${title}.`} />
      <meta key="og:url" property="og:url" content={`${SITE_URL}${router.asPath.split('#')[0]}`} />
      <meta key="og:image" property="og:image" content={shareImage} />
      <meta key="og:image:alt" property="og:image:alt" content={`${leagueName}'s fight poster with personal QR`} />
      <meta key="twitter:image" name="twitter:image" content={shareImage} />
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

export async function getServerSideProps({ params, query, res }) {
  const affiliateId = String(params?.affiliateId || '');
  const fightId = String(query?.fightId || '');
  if (!/^[a-f\d]{24}$/i.test(affiliateId) || !/^[a-f\d]{24}$/i.test(fightId)) return { notFound: true };
  try {
    const [affiliatesResponse, fightResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates?limit=200`),
      fetch(`${PUBLIC_API_BASE_URL}/api/public/fights/${fightId}`),
    ]);
    if (!affiliatesResponse.ok || !fightResponse.ok) return { notFound: true };
    const [affiliates, payload] = await Promise.all([affiliatesResponse.json(), fightResponse.json()]);
    const affiliate = Array.isArray(affiliates) && affiliates.find((item) => String(item._id) === affiliateId && item.verified);
    const fight = payload.fight || payload.data || payload;
    if (!affiliate || !fight?._id) return { notFound: true };
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { affiliate, fight: { matchFighterA: fight.matchFighterA || '', matchFighterB: fight.matchFighterB || '' }, fightId } };
  } catch (error) {
    console.error('Affiliate league landing failed:', error);
    return { notFound: true };
  }
}
