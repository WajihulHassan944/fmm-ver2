import { fetchAffiliatePromotionFights } from '@/Utils/affiliatePromotionFights';
import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { affiliateHeaders, getAffiliateToken, hasAdminSession } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL, resolvePublicMediaUrl } from '@/Utils/publicApi';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { affiliateFightPosts } from '@/Utils/fightShareCopy';
import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import { getFightId, getFighterImage } from '@/Utils/fightExperience';
import { SITE_URL } from '@/Utils/seoConfig';
import styles from '@/Components/Admin/FightLaunchDesk.module.css';

export default function AffiliateFightLaunch() {
  const router = useRouter();
  const fightId = typeof router.query.fightId === 'string' ? router.query.fightId : '';
  const [kit, setKit] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [social, setSocial] = useState(null);
  const [socialBusy, setSocialBusy] = useState('');
  // The fight poster exactly as it was uploaded: the original file bytes,
  // shown, downloaded, copied and shared unchanged. Nothing is drawn on it;
  // the tracked link and QR code are offered separately on this page.
  const [original, setOriginal] = useState(null);
  const [posterError, setPosterError] = useState('');
  const shareInProgress = useRef(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [fightPhotos, setFightPhotos] = useState(null);
  const [affiliateRecord, setAffiliateRecord] = useState(undefined);
  const expectedAffiliateId = typeof router.query.affiliateId === 'string' && /^[a-f\d]{24}$/i.test(router.query.affiliateId) ? router.query.affiliateId : '';
  useEffect(() => {
    if (!fightId) return;
    let active = true;
    setFightPhotos(null);
    fetchAffiliatePromotionFights({ limit: 240 }).then((rows) => {
      const fight = rows.find((row) => String(getFightId(row)) === fightId);
      if (active && fight) setFightPhotos({ a: getFighterImage(fight, 'A'), b: getFighterImage(fight, 'B'), poster: fight.fightPosterImage || fight.promotionBackground || '' });
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
    // Not signed in as an affiliate: the owner goes to the owner Fight Launch
    // Desk for this fight; anyone else goes to affiliate sign-in and comes
    // straight back to this kit afterwards.
    if (!getAffiliateToken()) {
      if (hasAdminSession()) router.replace(`/administration/growth?fightId=${encodeURIComponent(fightId)}`);
      else router.replace(`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    loadSocial();
    let active = true;
    fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/promotions/${encodeURIComponent(fightId)}/share`, { headers: affiliateHeaders() })
      .then(async (response) => {
        const text = await response.text();
        let result = {};
        try { result = text ? JSON.parse(text) : {}; } catch { result = {}; }
        if (response.status === 401 || response.status === 403) {
          if (hasAdminSession()) router.replace(`/administration/growth?fightId=${encodeURIComponent(fightId)}`);
          else router.replace(`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`);
          throw new Error('Opening the right page for your account…');
        }
        if (!response.ok) throw new Error(result.message || `Could not load your fight kit (HTTP ${response.status}).`);
        return result;
      })
      .then((result) => { if (active) setKit(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [router.isReady, fightId]);

  const kitAffiliateId = String(kit?.attribution?.affiliateId || '');
  useEffect(() => {
    if (!kitAffiliateId) return;
    let active = true;
    setAffiliateRecord(undefined);
    fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates/${encodeURIComponent(kitAffiliateId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((record) => { if (active) setAffiliateRecord(record && String(record._id || record.id) === kitAffiliateId ? record : null); })
      .catch(() => { if (active) setAffiliateRecord(null); });
    return () => { active = false; };
  }, [kitAffiliateId]);

  // The QR, the link box and the captions all use this one tracked link: the
  // readable league link with the affiliate and fight IDs that credit the referral.
  const trackedLink = affiliateRecord && fightId ? getAffiliateFightShareUrl(affiliateRecord, fightId) : (kit?.fightLink || '');
  // Issue #185: the poster the owner approved for THIS affiliate and fight
  // (with her own QR) comes first. Shown, copied, downloaded, shared and
  // published exactly as approved. The general fight poster is only the
  // fallback for affiliates without a personalized poster.
  const personalized = kit?.creative?.personalizedPoster && String(kit.creative.personalizedPoster.affiliateId || '') === String(kit?.attribution?.affiliateId || '') && String(kit.creative.personalizedPoster.fightId || '') === fightId
    ? kit.creative.personalizedPoster : null;
  const posterArt = personalized ? '' : (kit?.creative?.fightPoster || fightPhotos?.poster || '');
  const personalizedImagePath = personalized?.imagePath || '';
  useEffect(() => {
    if (!personalizedImagePath) return undefined;
    let active = true;
    let objectUrl = '';
    setOriginal(null);
    setPosterError('');
    fetch(`${PUBLIC_API_BASE_URL}${personalizedImagePath}`, { headers: affiliateHeaders(), cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Your personalized fight poster could not be loaded. Refresh the page to try again.'); return response.blob(); })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[blob.type] || 'png';
        setOriginal({ blob, objectUrl, personalized: true, fileName: `fantasy-mmadness-fight-poster-${fightId}-my-qr.${ext}` });
      })
      .catch((err) => { if (active) setPosterError(err.message); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [personalizedImagePath, fightId]);
  // Load the uploaded file through our own origin (same bytes, no CORS taint).
  useEffect(() => {
    if (!posterArt) return undefined;
    let active = true;
    let objectUrl = '';
    setOriginal(null);
    setPosterError('');
    const source = resolvePublicMediaUrl(posterArt);
    const viaProxy = /^https:\/\//i.test(source) ? `/api/fight-poster-image?url=${encodeURIComponent(source)}` : source;
    fetch(viaProxy)
      .then((response) => { if (!response.ok) throw new Error('The fight poster could not be loaded.'); return response.blob(); })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' }[blob.type] || 'jpg';
        setOriginal({ blob, objectUrl, fileName: `fantasy-mmadness-fight-poster-${fightId}.${ext}` });
      })
      .catch((err) => { if (active) setPosterError(err.message || 'The fight poster could not be loaded.'); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [posterArt, fightId]);

  // Same pixels as PNG, only where an app requires PNG (clipboard, direct publishing).
  const originalAsPng = () => new Promise((resolve, reject) => {
    if (!original) { reject(new Error('The poster is still loading.')); return; }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve({ blob, dataUrl: canvas.toDataURL('image/png') }) : reject(new Error('Could not prepare the poster.'))), 'image/png');
    };
    image.onerror = () => reject(new Error('Could not prepare the poster.'));
    image.src = original.objectUrl;
  });
  const saveBlob = (blob, fileName) => {
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href; anchor.download = fileName;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  };
  const downloadPoster = () => {
    if (!original) { toast.error('The poster is still loading.'); return; }
    saveBlob(original.blob, original.fileName);
    toast.success(original.personalized ? 'Your personalized fight poster saved.' : 'Original fight poster saved.');
  };
  const copyPoster = async () => {
    if (!original) { toast.error('The poster is still loading.'); return; }
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { toast.info('Press and hold the poster to copy or save it to Photos.'); return; }
    try {
      const { blob } = await originalAsPng();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Poster copied. Paste it into your post.');
    } catch { toast.info('Press and hold the poster to copy or save it to Photos.'); }
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
      if (platform !== 'x' && !original) throw new Error('Wait for the fight poster to finish loading before publishing.');
      const poster = platform === 'x' ? '' : (await originalAsPng()).dataUrl;
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
  const sharePoster = async (caption) => {
    if (shareInProgress.current) return;
    if (!original) { toast.error('Wait for the fight poster to finish loading.'); return; }
    shareInProgress.current = true;
    setShareBusy(true);
    try {
      const file = new File([original.blob], original.fileName, { type: original.blob.type || 'image/jpeg' });
      const copied = navigator.clipboard?.writeText(caption).then(() => true).catch(() => false) || Promise.resolve(false);
      if (!navigator.canShare?.({ files: [file] })) {
        saveBlob(original.blob, original.fileName);
        toast.info((await copied) ? 'Poster saved to Downloads; caption copied. Upload the PNG and paste the caption.' : 'Poster saved to Downloads. Copy the caption above before posting.');
        return;
      }
      // Share only one image file. Some receiving apps treat an image plus
      // text as two separate sends; the caption is on the clipboard instead.
      await navigator.share({ files: [file] });
      if (await copied) toast.info('Poster shared once. Paste the copied caption into your post.');
      else toast.info('Poster shared once. Copy the caption above and paste it into your post.');
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not open your phone’s share menu. Save the poster to Downloads instead.');
    } finally { shareInProgress.current = false; setShareBusy(false); }
  };
  const name = kit?.creative?.headline || 'the fight';
  // The email names the affiliate it was sent to; never show someone else's kit.
  const wrongAccount = Boolean(kit && expectedAffiliateId && String(kit.attribution?.affiliateId || '') !== expectedAffiliateId);
  const link = trackedLink || kit?.fightLink || '';
  const facebookLeagueUrl = kit?.attribution?.affiliateId && fightId
    ? `${SITE_URL}/league/${encodeURIComponent(kit.attribution.affiliateId)}?fightId=${encodeURIComponent(fightId)}&share=affiliate-qr-14`
    : link;
  const facebookShareUrl = facebookLeagueUrl
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookLeagueUrl)}`
    : '';
  const copyByPlatform = affiliateFightPosts(name, link, kit?.attribution?.leagueName || 'my league', kit?.creative?.prizeCoins, kit?.creative?.entryCoins, kit?.creative?.fighterA, kit?.creative?.fighterB);
  const posts = kit ? [['Facebook', copyByPlatform.facebook], ['Instagram', copyByPlatform.instagram], ['TikTok', copyByPlatform.tiktok], ['X', copyByPlatform.x]] : [];
  return <main className={styles.desk} style={{ maxWidth: 1050, margin: '36px auto', minHeight: 400 }}>
    <Head><title>Your fight share kit | FANTASY MMADNESS</title></Head>
    <div className={styles.heading}><span>YOUR FIGHT. YOUR LINK.</span><h2>Post this fight in minutes</h2><p>Facebook and X open a post with your tracked fight link and image preview. Instagram and TikTok require you to select the poster and paste your copied caption.</p></div>
    {busy && <p>Preparing your personal fight link…</p>}
    {!busy && !getAffiliateToken() && <p><Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate to see your personal kit →</Link></p>}
    {error && <p role="alert">{error} <Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate →</Link></p>}
    {wrongAccount && <p role="alert">This share kit was sent to a different affiliate account than the one signed in on this device. <Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in with the account that received the email →</Link></p>}
    {kit && !wrongAccount && <>
      <div className={styles.layout} style={{ marginTop: 20 }}>
        <div className={styles.preview}>
          <div className={styles.posterFrame}>
            {original ? <img src={original.objectUrl} alt={original.personalized ? `Your personalized ${name} fight poster with your QR code` : `${name} fight poster`} {...(original.personalized ? { 'data-personalized-poster': 'true' } : {})} /> : posterError ? <p role="alert">{posterError}</p> : (posterArt || personalized) ? <p>Loading the fight poster…</p> : <p>No fight poster has been uploaded for this fight yet.</p>}
            {original && <button className={styles.copyPoster} type="button" onClick={copyPoster}>Copy poster</button>}
          </div>
          <div className={styles.buttons} style={{ marginTop: 12 }}>
            <button type="button" disabled={!original} onClick={downloadPoster}>Download poster</button>
          </div>
          <small>{personalized ? 'This is your personalized fight poster with your own QR code, exactly as the owner approved it. Fans who scan it join your league. On a phone, you can also press and hold the poster to save it to Photos.' : 'This is the fight poster exactly as it was uploaded. Your personal link and QR code are next to it, so fans can scan or tap to join your league. On a phone, you can also press and hold the poster to save it to Photos.'}</small>
          {kit.creative?.personalizedPosterUnavailable && <p role="alert">Your personalized poster could not be checked right now, so the general fight poster is shown. Refresh the page in a moment.</p>}
          <h3>{name}</h3><p>Promoted by {kit.creative?.promotedBy || kit.attribution?.leagueName}</p>
        </div>
        <div className={styles.share}><strong>Your tracked fight link</strong><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your fight link" /><div className={styles.buttons}><button type="button" onClick={() => copy(link, 'Fight link')}>Copy fight link</button><ShareQrCode url={link} label="Your fight" fileName={`fight-${fightId}`} /></div><small>Your QR code opens this same personal link. Show it, download it, or add it to your own post. Downloads appear in your phone’s Files or Downloads app, usually not Photos.</small></div>
      </div>
      <div className={styles.templates}>{posts.map(([platform, value]) => { const key = platform.toLowerCase(); const account = social?.[key]; return <article key={platform}><div><h3>{platform} post</h3><button type="button" onClick={() => copy(value, platform)}>Copy</button></div><textarea aria-label={`${platform} post`} readOnly rows={5} value={value} onFocus={(e) => e.target.select()} />
        <div className={styles.buttons}>
          {platform === 'Facebook' && facebookShareUrl && <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer">Share to Facebook · review and post</a>}
          {platform === 'Instagram' && <a href="https://www.instagram.com/create/select/" target="_blank" rel="noopener noreferrer" onClick={() => copy(value, 'Instagram caption')}>Open Instagram create · copy caption</a>}
          {platform === 'TikTok' && <a href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer" onClick={() => copy(value, 'TikTok caption')}>Open TikTok upload · copy caption</a>}
          {platform === 'X' && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer">Open X post with text</a>}
        </div>
        <details><summary>Want to share the poster through your phone instead?</summary><div className={styles.buttons}><button type="button" disabled={!original || shareBusy} onClick={() => sharePoster(value)}>{shareBusy ? 'Opening share menu…' : 'Share poster once · copy caption'}</button></div></details>
        <p className={styles.socialStatus}>{platform === 'TikTok' ? 'Ready to post manually with the fight poster' : account?.connected ? `Connected: ${account.label}` : account?.configured ? 'Account not connected' : 'Direct publishing awaiting platform setup'}{account?.status === 'published' ? ' · Published for this fight' : account?.status === 'review' ? ' · Check your account before retrying' : ''}</p>
        {platform !== 'TikTok' && account?.configured && <div className={styles.buttons}>
          <button type="button" disabled={!account?.configured || Boolean(socialBusy)} onClick={() => connect(key)}>{account?.connected ? 'Reconnect account' : 'Connect account'}</button>
          <button type="button" disabled={!account?.connected || (key !== 'x' && !original) || Boolean(socialBusy) || ['published', 'publishing', 'review'].includes(account?.status)} onClick={() => publish(key)}>{socialBusy === key ? 'Working…' : account?.status === 'published' ? 'Published' : 'Publish'}</button>
        </div>}
        {platform === 'Facebook' && <small>Facebook opens with your league link and full poster preview. Review the preview and press Share. To add a longer personal message, copy the caption above and paste it into the composer.</small>}
        {platform === 'Instagram' && <small>Instagram opens its create page when available. Choose the fight poster from Downloads or Photos, then paste the caption. A connected professional account can use Publish to send both directly. Caption links display as text.</small>}
        {platform === 'TikTok' && <small>TikTok opens its upload page when available. Select the fight poster from Downloads or Photos and paste the caption.</small>}
        {platform === 'X' && <small>X opens with the prepared text and tracked link. Attach the saved fight poster if you want the image in the post.</small>}
      </article>; })}</div>
    </>}
  </main>;
}
