import { fetchAffiliatePromotionFights } from '@/Utils/affiliatePromotionFights';
import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { affiliateHeaders, getAffiliateToken } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL, resolvePublicMediaUrl } from '@/Utils/publicApi';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { affiliateFightPosts } from '@/Utils/fightShareCopy';
import { buildFightSocialPoster, saveFightSocialPoster } from '@/Utils/fightSocialPoster';
import { buildAffiliateFightPoster, downloadPosterBlob, getAffiliateFirstName, posterFileName, POSTER_FORMATS } from '@/Utils/affiliateFightPoster';
import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import { formatFightDate, getFightId, getFighterImage } from '@/Utils/fightExperience';
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
  const [poster, setPoster] = useState('');
  const [posterError, setPosterError] = useState('');
  const [posterBusy, setPosterBusy] = useState(false);
  const shareInProgress = useRef(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [fightPhotos, setFightPhotos] = useState(null);
  // Personalized posters (Issue #180): one exact PNG per format, reused for
  // preview, download, copy and share so what the affiliate sees is what they send.
  const [affiliateRecord, setAffiliateRecord] = useState(undefined);
  const [posters, setPosters] = useState({});
  const [posterFormat, setPosterFormat] = useState('feed');
  const [personalPosterError, setPersonalPosterError] = useState('');
  const [posterFileBusy, setPosterFileBusy] = useState('');
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
    if (!getAffiliateToken()) { setBusy(false); return; }
    loadSocial();
    let active = true;
    fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/promotions/${encodeURIComponent(fightId)}/share`, { headers: affiliateHeaders() })
      .then(async (response) => {
        const text = await response.text();
        let result = {};
        try { result = text ? JSON.parse(text) : {}; } catch { result = {}; }
        if (response.status === 401 || response.status === 403) {
          throw new Error('This page needs an affiliate sign-in. If you are the owner, open Administration → Growth → Fight Launch Desk to make any affiliate\'s poster.');
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
  const nameParts = String(kit?.creative?.promotedBy || '').trim().split(/\s+/);
  const posterAffiliate = affiliateRecord || { firstName: nameParts.length > 1 ? nameParts[0] : '' };
  const posterArt = kit?.creative?.fightPoster || fightPhotos?.poster || '';
  const posterInputs = kit?.creative && affiliateRecord !== undefined && trackedLink ? JSON.stringify({
    trackedLink, firstName: getAffiliateFirstName(posterAffiliate), posterArt,
    a: posterArt ? '' : (fightPhotos?.a || kit.creative.fighterAImage || ''),
    b: posterArt ? '' : (fightPhotos?.b || kit.creative.fighterBImage || ''),
  }) : '';
  useEffect(() => {
    if (!posterInputs) return;
    const creative = kit.creative;
    const inputs = JSON.parse(posterInputs);
    let active = true;
    const made = [];
    setPersonalPosterError('');
    setPosters({});
    Promise.all(Object.keys(POSTER_FORMATS).map((format) => buildAffiliateFightPoster({
      format, url: inputs.trackedLink, affiliate: posterAffiliate, artUrl: inputs.posterArt,
      fighterAImage: inputs.a ? resolvePublicMediaUrl(inputs.a) : '', fighterBImage: inputs.b ? resolvePublicMediaUrl(inputs.b) : '',
      fighterA: creative.fighterA || creative.headline?.split(/\s+vs\s+/i)[0], fighterB: creative.fighterB || creative.headline?.split(/\s+vs\s+/i)[1],
      // Date only: a clock time would show in the affiliate's own time zone with no label.
      event: creative.event, date: creative.matchDate ? formatFightDate(creative, { dateOnly: true }) : '',
    }).then((result) => { const objectUrl = URL.createObjectURL(result.blob); made.push(objectUrl); return [format, { ...result, objectUrl }]; })))
      .then((entries) => { if (active) setPosters(Object.fromEntries(entries)); })
      .catch((err) => { if (active) setPersonalPosterError(err.message || 'Could not make your posters. Check the fight artwork in the Fight Registry.'); });
    return () => { active = false; made.forEach((objectUrl) => URL.revokeObjectURL(objectUrl)); };
  }, [posterInputs]);

  useEffect(() => {
    const creative = kit?.creative;
    if (!creative || !kit.fightLink) return;
    let active = true;
    setPoster('');
    setPosterError('');
    buildFightSocialPoster({ format: 'facebook', fighterA: creative.fighterA || creative.headline?.split(/\s+vs\s+/i)[0],
      fighterB: creative.fighterB || creative.headline?.split(/\s+vs\s+/i)[1],
      fighterAImage: fightPhotos?.a || resolvePublicMediaUrl(creative.fighterAImage), fighterBImage: fightPhotos?.b || resolvePublicMediaUrl(creative.fighterBImage),
      basePoster: fightPhotos?.poster || creative.fightPoster, sport: creative.sport, event: creative.event, date: creative.matchDate ? formatFightDate(creative) : '',
      url: trackedLink || kit.fightLink, league: kit.attribution?.leagueName, prize: creative.prizeCoins, entryCoins: creative.entryCoins })
      .then((image) => { if (active) setPoster(image); })
      .catch((err) => { if (active) setPosterError(err.message || 'Could not make your fight poster. Check the saved fighter photos.'); });
    return () => { active = false; };
  }, [kit, fightPhotos, trackedLink]);

  const firstName = getAffiliateFirstName(posterAffiliate);
  const currentPoster = posters[posterFormat];
  const posterFile = (format) => posterFileName({ format, firstName, fightId });
  const downloadPersonalPoster = (format) => {
    const item = posters[format];
    if (!item) { toast.error('Your poster is still being made.'); return; }
    downloadPosterBlob(item.blob, posterFile(format));
    toast.success(`${POSTER_FORMATS[format].label} poster saved (${item.width} × ${item.height}).`);
  };
  const copyPersonalPoster = async () => {
    if (!currentPoster) { toast.error('The poster is still loading.'); return; }
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { toast.info('Press and hold the poster to copy or save it to Photos.'); return; }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': currentPoster.blob })]);
      toast.success('Poster copied. Paste it into your post.');
    } catch { toast.info('Press and hold the poster to copy or save it to Photos.'); }
  };
  const sharePersonalPoster = async () => {
    if (!currentPoster || posterFileBusy) return;
    const file = new File([currentPoster.blob], posterFile(posterFormat), { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) { downloadPersonalPoster(posterFormat); return; }
    setPosterFileBusy('share');
    try { await navigator.share({ files: [file] }); }
    catch (err) { if (err?.name !== 'AbortError') toast.error('Could not open the share menu. Use Download instead.'); }
    finally { setPosterFileBusy(''); }
  };

  const downloadPoster = async () => {
    if (!kit?.fightLink || posterBusy) return;
    setPosterBusy(true);
    try {
      const creative = kit.creative || {};
      const image = poster || await buildFightSocialPoster({ format: 'facebook', fighterA: creative.fighterA || creative.headline?.split(/\s+vs\s+/i)[0],
        fighterB: creative.fighterB || creative.headline?.split(/\s+vs\s+/i)[1],
        fighterAImage: fightPhotos?.a || resolvePublicMediaUrl(creative.fighterAImage), fighterBImage: fightPhotos?.b || resolvePublicMediaUrl(creative.fighterBImage),
        basePoster: fightPhotos?.poster || creative.fightPoster, sport: creative.sport, event: creative.event, date: creative.matchDate ? formatFightDate(creative) : '',
        url: trackedLink || kit.fightLink, league: kit.attribution?.leagueName, prize: creative.prizeCoins, entryCoins: creative.entryCoins });
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
  const sharePoster = async (caption) => {
    if (shareInProgress.current) return;
    const shareable = posters.feed;
    if (!shareable) { toast.error('Wait for your QR poster to finish preparing.'); return; }
    shareInProgress.current = true;
    setShareBusy(true);
    try {
      const file = new File([shareable.blob], posterFile('feed'), { type: 'image/png' });
      const copied = navigator.clipboard?.writeText(caption).then(() => true).catch(() => false) || Promise.resolve(false);
      if (!navigator.canShare?.({ files: [file] })) {
        downloadPosterBlob(shareable.blob, posterFile('feed'));
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
  const link = trackedLink || kit?.fightLink || '';
  const facebookLeagueUrl = kit?.attribution?.affiliateId && fightId
    ? `${SITE_URL}/league/${encodeURIComponent(kit.attribution.affiliateId)}?fightId=${encodeURIComponent(fightId)}&share=affiliate-qr-13`
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
    {error && <p role="alert">{error} <Link href={`/auth?mode=login&role=affiliate&next=${encodeURIComponent(router.asPath)}`}>Sign in as an affiliate →</Link> · <Link href={`/administration/growth?fightId=${encodeURIComponent(fightId)}`}>Owner Fight Launch Desk →</Link></p>}
    {kit && <>
      <div className={styles.layout} style={{ marginTop: 20 }}>
        <div className={styles.preview}>
          <div className={styles.posterTabs} role="group" aria-label="Poster size">
            {Object.values(POSTER_FORMATS).map((spec) => <button key={spec.key} type="button" aria-pressed={posterFormat === spec.key} className={posterFormat === spec.key ? styles.posterTabActive : ''} onClick={() => setPosterFormat(spec.key)}>{spec.label} · {spec.width}×{spec.height}</button>)}
          </div>
          <div className={styles.posterFrame}>
            {currentPoster ? <img className={posterFormat === 'story' ? styles.storyPoster : ''} src={currentPoster.objectUrl} width={currentPoster.width} height={currentPoster.height} alt={`${currentPoster.cta} — ${name} poster with your QR code`} /> : personalPosterError ? <p role="alert">{personalPosterError}</p> : <p>Making your personal posters…</p>}
            {currentPoster && <button className={styles.copyPoster} type="button" onClick={copyPersonalPoster}>Copy poster</button>}
          </div>
          <div className={styles.buttons} style={{ marginTop: 12 }}>
            <button type="button" disabled={!posters.feed} onClick={() => downloadPersonalPoster('feed')}>Download feed poster (1080×1350)</button>
            <button type="button" disabled={!posters.story} onClick={() => downloadPersonalPoster('story')}>Download story poster (1080×1920)</button>
            <button type="button" disabled={!currentPoster || Boolean(posterFileBusy)} onClick={sharePersonalPoster}>{posterFileBusy ? 'Opening…' : 'Share poster'}</button>
          </div>
          <small>Your QR opens your personal league link for this fight: {link}. Feed posters fit Instagram and Facebook posts; Story posters fit Instagram and Facebook Stories. On a phone, you can also press and hold the poster to save it to Photos.</small>
          <h3>{name}</h3><p>Promoted by {kit.creative?.promotedBy || kit.attribution?.leagueName}</p>
        </div>
        <div className={styles.share}><strong>Your tracked fight link</strong><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your fight link" /><details><summary>Other ways to save or copy</summary><div className={styles.buttons}><button type="button" onClick={downloadPoster} disabled={posterBusy}>{posterBusy ? 'Preparing…' : 'Save poster to Downloads'}</button><button type="button" onClick={() => copy(link, 'Fight link')}>Copy fight link</button><ShareQrCode url={link} label="Your fight" fileName={`fight-${fightId}`} /></div><small>Downloads appear in your phone’s Files or Downloads app, usually not Photos. You can also long press the poster preview to save the image to Photos if your phone offers that option.</small></details></div>
      </div>
      <div className={styles.templates}>{posts.map(([platform, value]) => { const key = platform.toLowerCase(); const account = social?.[key]; return <article key={platform}><div><h3>{platform} post</h3><button type="button" onClick={() => copy(value, platform)}>Copy</button></div><textarea aria-label={`${platform} post`} readOnly rows={5} value={value} onFocus={(e) => e.target.select()} />
        <div className={styles.buttons}>
          {platform === 'Facebook' && facebookShareUrl && <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer">Share to Facebook · review and post</a>}
          {platform === 'Instagram' && <a href="https://www.instagram.com/create/select/" target="_blank" rel="noopener noreferrer" onClick={() => copy(value, 'Instagram caption')}>Open Instagram create · copy caption</a>}
          {platform === 'TikTok' && <a href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer" onClick={() => copy(value, 'TikTok caption')}>Open TikTok upload · copy caption</a>}
          {platform === 'X' && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer">Open X post with text</a>}
        </div>
        <details><summary>Want to share the poster through your phone instead?</summary><div className={styles.buttons}><button type="button" disabled={!poster || shareBusy} onClick={() => sharePoster(value)}>{shareBusy ? 'Opening share menu…' : 'Share poster once · copy caption'}</button></div></details>
        <p className={styles.socialStatus}>{platform === 'TikTok' ? 'Ready to post manually with your personal QR poster' : account?.connected ? `Connected: ${account.label}` : account?.configured ? 'Account not connected' : 'Direct publishing awaiting platform setup'}{account?.status === 'published' ? ' · Published for this fight' : account?.status === 'review' ? ' · Check your account before retrying' : ''}</p>
        {platform !== 'TikTok' && account?.configured && <div className={styles.buttons}>
          <button type="button" disabled={!account?.configured || Boolean(socialBusy)} onClick={() => connect(key)}>{account?.connected ? 'Reconnect account' : 'Connect account'}</button>
          <button type="button" disabled={!account?.connected || (key !== 'x' && !poster) || Boolean(socialBusy) || ['published', 'publishing', 'review'].includes(account?.status)} onClick={() => publish(key)}>{socialBusy === key ? 'Working…' : account?.status === 'published' ? 'Published' : 'Publish'}</button>
        </div>}
        {platform === 'Facebook' && <small>Facebook opens with your league link and full poster preview. Review the preview and press Share. To add a longer personal message, copy the caption above and paste it into the composer.</small>}
        {platform === 'Instagram' && <small>Instagram opens its create page when available. Choose the QR poster from Downloads or Photos, then paste the caption. A connected professional account can use Publish to send both directly. Caption links display as text.</small>}
        {platform === 'TikTok' && <small>TikTok opens its upload page when available. Select the QR poster from Downloads or Photos and paste the caption.</small>}
        {platform === 'X' && <small>X opens with the prepared text and tracked link. Attach your saved QR poster if you want the image in the post.</small>}
      </article>; })}</div>
    </>}
  </main>;
}
