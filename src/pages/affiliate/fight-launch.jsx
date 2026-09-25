import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { affiliateHeaders, getAffiliateToken } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL, fetchPublicPredictionFights, resolvePublicMediaUrl } from '@/Utils/publicApi';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { affiliateFightPosts } from '@/Utils/fightShareCopy';
import { buildFightSocialPoster, saveFightSocialPoster } from '@/Utils/fightSocialPoster';
import { formatFightDate, getFightId, getFighterImage } from '@/Utils/fightExperience';
import styles from '@/Components/Admin/FightLaunchDesk.module.css';

export default function AffiliateFightLaunch() {
  const router = useRouter();
  const fightId = typeof router.query.fightId === 'string' ? router.query.fightId : '';
  const [kit, setKit] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [social, setSocial] = useState(null);
  const [socialBusy, setSocialBusy] = useState('');
  const [poster, setPoster] = useState('');
  const [posterError, setPosterError] = useState('');
  const [posterBusy, setPosterBusy] = useState(false);
  const [fightPhotos, setFightPhotos] = useState(null);
  useEffect(() => {
    if (!fightId) return;
    let active = true;
    setFightPhotos(null);
    fetchPublicPredictionFights({ limit: 240 }).then((rows) => {
      const fight = rows.find((row) => String(getFightId(row)) === fightId);
      if (active && fight) setFightPhotos({ a: getFighterImage(fight, 'A'), b: getFighterImage(fight, 'B') });
    }).catch(() => {});
    return () => { active = false; };
  }, [fightId]);
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
    const creative = kit?.creative;
    if (!creative || !kit.fightLink) return;
    let active = true;
    setPoster('');
    setPosterError('');
    buildFightSocialPoster({ fighterA: creative.fighterA || creative.headline?.split(/\s+vs\s+/i)[0],
      fighterB: creative.fighterB || creative.headline?.split(/\s+vs\s+/i)[1],
      fighterAImage: fightPhotos?.a || resolvePublicMediaUrl(creative.fighterAImage), fighterBImage: fightPhotos?.b || resolvePublicMediaUrl(creative.fighterBImage),
      basePoster: creative.fightPoster, sport: creative.sport, event: creative.event, date: creative.matchDate ? formatFightDate(creative) : '',
      url: kit.fightLink, league: kit.attribution?.leagueName, prize: creative.prizeCoins, entryCoins: creative.entryCoins })
      .then((image) => { if (active) setPoster(image); })
      .catch((err) => { if (active) setPosterError(err.message || 'Could not make your fight poster. Check the saved fighter photos.'); });
    return () => { active = false; };
  }, [kit, fightPhotos]);

  const downloadPoster = async () => {
    if (!kit?.fightLink || posterBusy) return;
    setPosterBusy(true);
    try {
      const creative = kit.creative || {};
      const image = poster || await buildFightSocialPoster({ fighterA: creative.fighterA || creative.headline?.split(/\s+vs\s+/i)[0],
        fighterB: creative.fighterB || creative.headline?.split(/\s+vs\s+/i)[1],
        fighterAImage: fightPhotos?.a || resolvePublicMediaUrl(creative.fighterAImage), fighterBImage: fightPhotos?.b || resolvePublicMediaUrl(creative.fighterBImage),
        basePoster: creative.fightPoster, sport: creative.sport, event: creative.event, date: creative.matchDate ? formatFightDate(creative) : '',
        url: kit.fightLink, league: kit.attribution?.leagueName, prize: creative.prizeCoins, entryCoins: creative.entryCoins });
      saveFightSocialPoster(image, fightId);
      toast.success('Your fight poster is ready with your tracked QR.');
    } catch (err) { toast.error(err.message || 'Could not prepare your poster. Check the saved fighter photos.'); }
    finally { setPosterBusy(false); }
  };

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
      if (platform !== 'x' && !poster) throw new Error('Wait for your personal poster to finish preparing before publishing.');
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/social/${platform}/publish`, {
        method: 'POST', headers: affiliateHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fightId, ...(platform === 'x' ? {} : { poster }) }),
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
  const prepareManualShare = (caption, platform) => {
    if (poster) saveFightSocialPoster(poster, fightId);
    navigator.clipboard?.writeText(caption).then(() => {
      toast.info(`${platform} caption copied and QR poster downloaded. Upload the PNG and paste the caption in your post.`);
    }).catch(() => toast.info('QR poster downloaded. Select and copy the caption above to post it.'));
  };
  const sharePoster = async (caption) => {
    if (!poster) { toast.error('Wait for your QR poster to finish preparing.'); return; }
    try {
      const blob = await (await fetch(poster)).blob();
      const file = new File([blob], `fantasy-mmadness-${fightId}.png`, { type: 'image/png' });
      if (!navigator.canShare?.({ files: [file] })) {
        saveFightSocialPoster(poster, fightId);
        await copy(caption, 'Caption');
        toast.info('Poster downloaded. Open your social app, upload the PNG, and paste the caption.');
        return;
      }
      await navigator.share({ files: [file], text: caption, title: name });
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not open your phone’s share menu. Download the poster and copy the caption instead.');
    }
  };
  const name = kit?.creative?.headline || 'the fight';
  const link = kit?.fightLink || '';
  const copyByPlatform = affiliateFightPosts(name, link, kit?.attribution?.leagueName || 'my league', kit?.creative?.prizeCoins, kit?.creative?.entryCoins);
  const posts = kit ? [['Facebook', copyByPlatform.facebook], ['Instagram', copyByPlatform.instagram], ['TikTok', copyByPlatform.tiktok], ['X', copyByPlatform.x]] : [];
  return <main className={styles.desk} style={{ maxWidth: 1050, margin: '36px auto', minHeight: 400 }}>
    <Head><title>Your fight share kit | FANTASY MMADNESS</title></Head>
    <div className={styles.heading}><span>YOUR FIGHT. YOUR LINK.</span><h2>Post this fight in minutes</h2><p>Download your ready-to-post fight poster with your own tracked QR, then share it with the caption for your social account.</p></div>
    {busy && <p>Preparing your personal fight link…</p>}
    {!busy && !getAffiliateToken() && <p><Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate to see your personal kit →</Link></p>}
    {error && <p role="alert">{error} <Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate →</Link></p>}
    {kit && <>
      <div className={styles.layout} style={{ marginTop: 20 }}>
        <div className={styles.preview}>
          {poster ? <img src={poster} alt={`Personalized ${name} fight poster with your QR`} style={{ width: '100%', maxHeight: 460, objectFit: 'contain' }} /> : posterError ? <p role="alert">{posterError}</p> : <p>Preparing your personal fight poster…</p>}
          <h3>{name}</h3><p>Promoted by {kit.creative?.promotedBy || kit.attribution?.leagueName}</p>
        </div>
        <div className={styles.share}><strong>Your tracked fight link</strong><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your fight link" /><div className={styles.buttons}><button type="button" onClick={downloadPoster} disabled={posterBusy}>{posterBusy ? 'Preparing…' : 'Download my fight poster PNG'}</button><button type="button" onClick={() => copy(link, 'Fight link')}>Copy fight link</button><ShareQrCode url={link} label="Your fight" fileName={`fight-${fightId}`} /></div><small>The poster QR contains your personal link. Test it before posting, and include the clickable link in Facebook and X posts too.</small></div>
      </div>
      <div className={styles.templates}>{posts.map(([platform, value]) => { const key = platform.toLowerCase(); const account = social?.[key]; return <article key={platform}><div><h3>{platform} post</h3><button type="button" onClick={() => copy(value, platform)}>Copy</button></div><textarea aria-label={`${platform} post`} readOnly rows={5} value={value} onFocus={(e) => e.target.select()} />
        <div className={styles.buttons}><button type="button" disabled={!poster} onClick={() => sharePoster(value)}>Share poster and caption with phone apps</button></div>
        <p className={styles.socialStatus}>{platform === 'TikTok' ? 'Ready to post manually with your personal QR poster' : account?.connected ? `Connected: ${account.label}` : account?.configured ? 'Account not connected' : 'Direct publishing awaiting platform setup'}{account?.status === 'published' ? ' · Published for this fight' : account?.status === 'review' ? ' · Check your account before retrying' : ''}</p>
        {platform !== 'TikTok' && <div className={styles.buttons}>
          <button type="button" disabled={!account?.configured || Boolean(socialBusy)} onClick={() => connect(key)}>{account?.connected ? 'Reconnect account' : 'Connect account'}</button>
          <button type="button" disabled={!account?.connected || (key !== 'x' && !poster) || Boolean(socialBusy) || ['published', 'publishing', 'review'].includes(account?.status)} onClick={() => publish(key)}>{socialBusy === key ? 'Working…' : account?.status === 'published' ? 'Published' : 'Publish'}</button>
        </div>}
        <div className={styles.buttons} style={{ marginTop: 10 }}>
          {platform === 'Facebook' && <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} onClick={() => prepareManualShare(value, platform)} target="_blank" rel="noopener noreferrer">Download poster, copy caption &amp; open Facebook share</a>}
          {platform === 'Instagram' && <a href="https://www.instagram.com/" onClick={() => prepareManualShare(value, platform)} target="_blank" rel="noopener noreferrer">Download poster, copy caption &amp; open Instagram</a>}
          {platform === 'TikTok' && <a href="https://www.tiktok.com/upload" onClick={() => prepareManualShare(value, platform)} target="_blank" rel="noopener noreferrer">Download poster, copy caption &amp; open TikTok upload</a>}
          {platform === 'X' && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(value)}`} onClick={() => prepareManualShare(value, platform)} target="_blank" rel="noopener noreferrer">Download poster &amp; open X post</a>}
        </div>
        {platform === 'Facebook' && <small>Connect a Facebook Page you manage. Publishing to personal profiles is unavailable. The manual share option opens Facebook with your tracked link.</small>}
        {platform === 'Instagram' && <small>Publish sends the personal poster above with your tracked QR to your connected professional Instagram account. Instagram caption links are not clickable.</small>}
        {platform === 'TikTok' && <small>Download your fight poster above, upload it as a photo post in TikTok, and paste this caption. Put your tracked link in your bio where available; viewers can scan the QR in the post.</small>}
        {platform === 'X' && <small>Publish posts the prepared text and tracked link to your connected X account.</small>}
      </article>; })}</div>
    </>}
  </main>;
}
