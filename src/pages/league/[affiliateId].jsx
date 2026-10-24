import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { getUserToken, userHeaders } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';
import { getAffiliateNameSlug } from '@/Utils/affiliatePublicLink';
import { rememberAffiliateRef } from '@/Utils/affiliateAttribution';
import styles from './league.module.css';

// A league link that can't be matched shows a plain explanation (with a short
// reason code for support) instead of a bare 404 page.
function InvalidLeagueLink({ reason }) {
  return <main className={styles.page || ''} style={{ maxWidth: 640, margin: '60px auto', padding: 20, color: '#fff' }}>
    <Head><title>League link not found | FANTASY MMADNESS</title><meta name="robots" content="noindex" /></Head>
    <h1>This league link isn&apos;t valid</h1>
    <p>The link may be incomplete or out of date. Ask the person who shared it for a new link, or browse open fights.</p>
    <p><Link href="/fights">See open fights →</Link></p>
    <small data-league-link-reason={reason}>Reference: {reason}</small>
  </main>;
}

export default function LeaguePage(props) {
  if (props.invalid) return <InvalidLeagueLink reason={props.invalid} />;
  return <AffiliateFightLeague {...props} />;
}

function AffiliateFightLeague({ affiliate, fight, fightId }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const affiliateId = String(affiliate._id);
  useEffect(() => { rememberAffiliateRef(affiliateId); }, [affiliateId]);
  const leagueName = String(affiliate.leagueName || affiliate.playerName || [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || 'Affiliate');
  const title = [fight?.matchFighterA, fight?.matchFighterB].filter(Boolean).join(' vs ') || 'Fight night';
  const fightUrl = `${fight.gameMode === 'PRO_WRESTLING' ? '/pro-wrestling/matches' : '/fight'}/${encodeURIComponent(fightId)}?ref=${encodeURIComponent(affiliateId)}&affiliateId=${encodeURIComponent(affiliateId)}&fromLeague=1`;
  const shareImage = `${SITE_URL}/api/fight-share-image?fightId=${encodeURIComponent(fightId)}&affiliateId=${encodeURIComponent(affiliateId)}&format=facebook&v=13`;
  const shareTitle = `Join ${leagueName}'s league for ${title} | FANTASY MMADNESS`;
  const shareDescription = `${title}: make your picks in ${leagueName}'s league${Number(fight?.pot) > 0 ? ` for a ${Number(fight.pot).toLocaleString()} FM COINS prize pool` : ''}. Open the fight to see entry details, eligibility, and rules.`;

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

// Next.js merges the dynamic segment into `query`, so for a named link like
// /league/kelly-davis?affiliateId=<id> `query.affiliateId` is "kelly-davis",
// not the id. Read the real ?affiliateId= from the request URL instead.
const OBJECT_ID = /^[a-f\d]{24}$/i;
const invalidLink = (res, reason) => {
  if (res) res.setHeader('Cache-Control', 'no-store');
  return { props: { invalid: reason } };
};
const searchParamFrom = (url, name) => {
  try { return new URL(String(url || ''), 'https://www.fantasymmadness.com').searchParams.get(name) || ''; }
  catch { return ''; }
};
// First candidate that is a real id: the raw request URL (never merged with
// the path segment), then resolvedUrl, then the path segment itself.
const firstObjectId = (...values) => values.map((value) => String(value || '')).find((value) => OBJECT_ID.test(value)) || '';

export async function getServerSideProps({ params, query, req, res, resolvedUrl }) {
  // ?ref= carries the id on named links (see getAffiliateFightShareUrl);
  // ID-path links (/league/<id>?fightId=) use the path segment.
  const affiliateId = firstObjectId(query?.ref, searchParamFrom(req?.url, 'ref'), searchParamFrom(req?.url, 'affiliateId'), searchParamFrom(resolvedUrl, 'affiliateId'), params?.affiliateId, query?.affiliateId);
  const fightId = firstObjectId(searchParamFrom(req?.url, 'fightId'), searchParamFrom(resolvedUrl, 'fightId'), query?.fightId);
  if (!/^[a-f\d]{24}$/i.test(affiliateId) || !/^[a-f\d]{24}$/i.test(fightId)) return invalidLink(res, 'bad-id');
  const pathId = String(params?.affiliateId || '');
  if (/^[a-f\d]{24}$/i.test(pathId) && pathId.toLowerCase() !== affiliateId.toLowerCase()) return invalidLink(res, 'id-mismatch');
  try {
    const [affiliateResponse, fightResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates/${encodeURIComponent(affiliateId)}`),
      fetch(`${PUBLIC_API_BASE_URL}/api/public/fights/${fightId}`),
    ]);
    if (!affiliateResponse.ok || !fightResponse.ok) return invalidLink(res, 'lookup-failed');
    const [affiliate, payload] = await Promise.all([affiliateResponse.json(), fightResponse.json()]);
    // The path segment is a label, the id is the identity. If the path is a name
    // slug it must belong to this same affiliate, otherwise refuse to render.
    const pathKey = String(params?.affiliateId || '');
    if (pathKey && !/^[a-f\d]{24}$/i.test(pathKey)) {
      const own = getAffiliateNameSlug(affiliate);
      if (pathKey.toLowerCase() !== own && pathKey.toLowerCase() !== `${own}-${affiliateId.slice(-6)}`) {
        // Old link whose name part no longer matches (e.g. renamed account). The id is the
        // identity, so open this same affiliate's current link instead of an error page.
        if (own && own !== pathKey.toLowerCase()) {
          return { redirect: { destination: `/league/${encodeURIComponent(own)}?fightId=${encodeURIComponent(fightId)}&ref=${encodeURIComponent(affiliateId)}`, permanent: false } };
        }
        return invalidLink(res, 'name-mismatch');
      }
    }
    const fight = payload.fight || payload.data || payload;
    if (!affiliate || !fight?._id) return invalidLink(res, 'missing-record');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { affiliate, fight: { gameMode: fight.gameMode || '', matchFighterA: fight.matchFighterA || '', matchFighterB: fight.matchFighterB || '', pot: fight.pot || 0 }, fightId } };
  } catch (error) {
    console.error('Affiliate league landing failed:', error);
    return invalidLink(res, 'error');
  }
}
