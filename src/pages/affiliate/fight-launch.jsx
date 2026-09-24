import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { affiliateHeaders, getAffiliateToken } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { affiliateFightPosts } from '@/Utils/fightShareCopy';
import styles from '@/Components/Admin/FightLaunchDesk.module.css';

export default function AffiliateFightLaunch() {
  const router = useRouter();
  const fightId = typeof router.query.fightId === 'string' ? router.query.fightId : '';
  const [kit, setKit] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [social, setSocial] = useState(null);
  const [socialBusy, setSocialBusy] = useState('');
  const loadSocial = async () => {
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/social/status?fightId=${encodeURIComponent(fightId)}`, { headers: affiliateHeaders() });
      if (!response.ok) throw new Error('Could not check connected accounts.');
      setSocial((await response.json()).platforms);
    } catch (err) { toast.error(err.message); }
  };
  useEffect(() => {
    if (!router.isReady) return;
    if (!fightId) { setError('The fight link is missing.'); setBusy(false); return; }
    if (!getAffiliateToken()) { setBusy(false); return; }
    loadSocial();
    let active = true;
    fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/promotions/${encodeURIComponent(fightId)}/share`, { headers: affiliateHeaders() })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load your fight kit.'); return result; })
      .then((result) => { if (active) setKit(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [router.isReady, fightId]);

  useEffect(() => {
    if (!router.isReady || !router.query.connection) return;
    const result = router.query.connection;
    if (result === 'connected') toast.success('Account connected. You can publish this fight.');
    if (result === 'failed') toast.error('Account connection failed. Check permissions and try again.');
    if (result === 'cancelled') toast.info('Account connection cancelled.');
    router.replace(`/affiliate/fight-launch?fightId=${encodeURIComponent(fightId)}`, undefined, { shallow: true });
  }, [router.isReady, router.query.connection, fightId]);

  const connect = async (platform) => {
    setSocialBusy(platform);
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/social/${platform}/connect`, {
        method: 'POST', headers: affiliateHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fightId }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.message || 'Could not connect account.');
      window.location.assign(result.url);
    } catch (err) { toast.error(err.message); setSocialBusy(''); }
  };
  const publish = async (platform) => {
    setSocialBusy(platform);
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/social/${platform}/publish`, {
        method: 'POST', headers: affiliateHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fightId }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== 'published') throw new Error(result.message || 'The platform did not confirm publication.');
      toast.success(`Published to ${platform === 'x' ? 'X' : platform}.`);
      await loadSocial();
    } catch (err) { toast.error(err.message); await loadSocial(); }
    finally { setSocialBusy(''); }
  };

  const copy = async (value, name) => {
    try { await navigator.clipboard.writeText(value); toast.success(`${name} copied.`); }
    catch { toast.error('Copy failed. Select the text and copy manually.'); }
  };
  const name = kit?.creative?.headline || 'the fight';
  const link = kit?.fightLink || '';
  const copyByPlatform = affiliateFightPosts(name, link);
  const posts = kit ? [['Facebook', copyByPlatform.facebook], ['Instagram', copyByPlatform.instagram], ['X', copyByPlatform.x]] : [];
  return <main className={styles.desk} style={{ maxWidth: 1050, margin: '36px auto', minHeight: 400 }}>
    <Head><title>Your fight share kit | FANTASY MMADNESS</title></Head>
    <div className={styles.heading}><span>YOUR FIGHT. YOUR LINK.</span><h2>Post this fight in minutes</h2><p>Connect an account to publish, or copy a post and download your QR. Your fight link is tied to your affiliate account.</p></div>
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
      <div className={styles.templates}>{posts.map(([platform, value]) => { const key = platform.toLowerCase(); const account = social?.[key]; return <article key={platform}><div><h3>{platform} post</h3><button type="button" onClick={() => copy(value, platform)}>Copy</button></div><textarea aria-label={`${platform} post`} readOnly rows={5} value={value} onFocus={(e) => e.target.select()} />
        <p className={styles.socialStatus}>{account?.connected ? `Connected: ${account.label}` : account?.configured ? 'Account not connected' : 'Direct publishing awaiting platform setup'}{account?.status === 'published' ? ' · Published for this fight' : account?.status === 'review' ? ' · Check your account before retrying' : ''}</p>
        <div className={styles.buttons}>
          <button type="button" disabled={!account?.configured || Boolean(socialBusy)} onClick={() => connect(key)}>{account?.connected ? 'Reconnect account' : 'Connect account'}</button>
          <button type="button" disabled={!account?.connected || Boolean(socialBusy) || ['published', 'publishing', 'review'].includes(account?.status)} onClick={() => publish(key)}>{socialBusy === key ? 'Working…' : account?.status === 'published' ? 'Published' : 'Publish'}</button>
        </div>
        <div className={styles.buttons} style={{ marginTop: 10 }}>
          {platform === 'Facebook' && <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">Open Facebook share</a>}
          {platform === 'Instagram' && <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open Instagram</a>}
          {platform === 'X' && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer">Open X post</a>}
        </div>
        {platform === 'Facebook' && <small>Connect a Facebook Page you manage. Publishing to personal profiles is unavailable. The manual share option opens Facebook with your tracked link.</small>}
        {platform === 'Instagram' && <small>Connect an Instagram professional account linked to a Facebook Page. Publish uses the fight poster and caption; for a QR image, download and post your personal QR manually. Instagram caption links are not clickable.</small>}
        {platform === 'X' && <small>Publish posts the prepared text and tracked link to your connected X account.</small>}
      </article>; })}</div>
    </>}
  </main>;
}
