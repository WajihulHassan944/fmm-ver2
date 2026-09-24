import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { affiliateHeaders, getAffiliateToken } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import styles from '@/Components/Admin/FightLaunchDesk.module.css';

export default function AffiliateFightLaunch() {
  const router = useRouter();
  const fightId = typeof router.query.fightId === 'string' ? router.query.fightId : '';
  const [kit, setKit] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!router.isReady) return;
    if (!fightId) { setError('The fight link is missing.'); setBusy(false); return; }
    if (!getAffiliateToken()) { setBusy(false); return; }
    let active = true;
    fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/promotions/${encodeURIComponent(fightId)}/share`, { headers: affiliateHeaders() })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load your fight kit.'); return result; })
      .then((result) => { if (active) setKit(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [router.isReady, fightId]);

  const copy = async (value, name) => {
    try { await navigator.clipboard.writeText(value); toast.success(`${name} copied.`); }
    catch { toast.error('Copy failed. Select the text and copy manually.'); }
  };
  const name = kit?.creative?.headline || 'the fight';
  const link = kit?.fightLink || '';
  const posts = kit ? [
    ['Facebook', `Affiliate post: I’m predicting ${name} on FANTASY MMADNESS. Join me: ${link} `],
    ['Instagram', `Affiliate post: Predict ${name} with me on FANTASY MMADNESS. Scan my QR or use the fight link in my bio. `],
    ['X', `Predict ${name} with me on FANTASY MMADNESS: ${link} `],
  ] : [];
  return <main className={styles.desk} style={{ maxWidth: 1050, margin: '36px auto', minHeight: 400 }}>
    <Head><title>Your fight share kit | FANTASY MMADNESS</title></Head>
    <div className={styles.heading}><span>YOUR FIGHT. YOUR LINK.</span><h2>Post this fight in minutes</h2><p>Copy a post, download your QR, and share it. Your fight link is tied to your affiliate account.</p></div>
    {busy && <p>Preparing your personal fight link…</p>}
    {!busy && !getAffiliateToken() && <p><Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate to see your personal kit →</Link></p>}
    {error && <p role="alert">{error} <Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate →</Link></p>}
    {kit && <>
      <div className={styles.layout} style={{ marginTop: 20 }}>
        <div className={styles.preview}>
          {kit.creative?.fightPoster ? <img src={kit.creative.fightPoster} alt={name} style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
            : <div className={styles.photos}><img src={kit.creative?.fighterAImage} alt="First fighter" /><strong>VS</strong><img src={kit.creative?.fighterBImage} alt="Second fighter" /></div>}
          <h3>{name}</h3><p>Promoted by {kit.creative?.promotedBy || kit.attribution?.leagueName}</p>
        </div>
        <div className={styles.share}><strong>Your tracked fight link</strong><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your fight link" /><div className={styles.buttons}><button type="button" onClick={() => copy(link, 'Fight link')}>Copy fight link</button><ShareQrCode url={link} label="Your fight" fileName={`fight-${fightId}`} /></div><small>Download your QR and test it before posting. Put the clickable fight link in Facebook and X posts, too.</small></div>
      </div>
      <div className={styles.templates}>{posts.map(([platform, value]) => <article key={platform}><div><h3>{platform} post</h3><button type="button" onClick={() => copy(value, platform)}>Copy</button></div><textarea aria-label={`${platform} post`} readOnly rows={5} value={value} onFocus={(e) => e.target.select()} /></article>)}</div>
    </>}
  </main>;
}
