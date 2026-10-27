import { fetchPublishedWrestlingPromotions, isPlaceholderWrestlingPromotion } from '@/Utils/affiliatePromotionFights';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { buildPublicApiUrl, normalizePublicFightRows, resolvePublicMediaUrl } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';
import { formatFightDate, getFightId, getFighterImage, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { buildFightSocialPoster, saveFightSocialPoster } from '@/Utils/fightSocialPoster';
import { fighterNameHashtags } from '@/Utils/fightShareCopy';
import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import { uploadAffiliatePosterSource, uploadFightPosterExact } from '@/Utils/posterUploads';
import styles from './FightLaunchDesk.module.css';

const titleFor = (fight) => `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`;
const statusOf = (fight) => String(fight?.matchStatus || fight?.status || '').toLowerCase();
const isDraft = (fight) => /draft/.test(statusOf(fight));
// Completed means the fight actually finished (or was called off). A fight whose
// date passed but was postponed or never scored stays with the current fights.
const isPastFight = (fight) => Boolean(fight?.prizesSettledAt)
  || /finished|complete|settled|finali[sz]ed|^final$|result|cancel|no_contest|no contest/.test(statusOf(fight));
const fightTime = (fight) => parseFightDate(fight)?.getTime();
const datePassed = (fight) => { const time = fightTime(fight); return Number.isFinite(time) && time < Date.now(); };
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const personName = (user) => `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.playerName || 'Affiliate';

export default function FightLaunchDesk() {
  const router = useRouter();
  const [fights, setFights] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(() => { if (typeof router.query.fightId === 'string') setSelected(router.query.fightId); }, [router.query.fightId]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPosters, setUploadedPosters] = useState({});
  // Poster campaign: who receives it, which artwork, where the QR goes, the
  // promotional text, and the finished image the owner approved.
  const [affiliates, setAffiliates] = useState([]);
  const [audience, setAudience] = useState('all');
  const [affiliateId, setAffiliateId] = useState('');
  const [customSource, setCustomSource] = useState(null);
  const [placement, setPlacement] = useState({ x: 0.7, y: 0.72, scale: 0.22 });
  const [placementNote, setPlacementNote] = useState('');
  const [posterAspect, setPosterAspect] = useState(1);
  const [promo, setPromo] = useState({ title: '', event: '', affiliateName: '', message: '' });
  const [finished, setFinished] = useState(null);
  const [finishedSrc, setFinishedSrc] = useState('');
  const [approved, setApproved] = useState(null);
  const [campaignBusy, setCampaignBusy] = useState('');
  const placementRef = useRef(null);

  const usable = useMemo(() => (Array.isArray(fights) ? fights : []).filter((fight) => getFightId(fight) && !isPlaceholderWrestlingPromotion(fight) && !isDraft(fight)), [fights]);
  const matchesSearch = (fight) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${titleFor(fight)} ${fight.matchName || ''} ${fight.matchCategoryTwo || fight.matchCategory || ''} ${formatFightDate(fight)}`.toLowerCase().includes(term);
  };
  const current = useMemo(() => usable.filter((fight) => !isPastFight(fight)).sort((a, b) => (fightTime(a) ?? Infinity) - (fightTime(b) ?? Infinity)), [usable]);
  const past = useMemo(() => usable.filter(isPastFight).sort((a, b) => (fightTime(b) ?? 0) - (fightTime(a) ?? 0)), [usable]);
  // The fight is exactly the one chosen in the list; nothing is pre-selected
  // behind the owner's back, so an upload can never land on another fight.
  const fight = usable.find((row) => String(getFightId(row)) === selected) || null;
  const id = fight ? String(getFightId(fight)) : '';
  const affiliate = affiliates.find((user) => String(user._id) === affiliateId) || null;
  const url = id ? `https://www.fantasymmadness.com${fight?.gameMode === 'PRO_WRESTLING' ? '/pro-wrestling/matches' : '/fight'}/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=social&utm_campaign=fight_launch` : '';
  const fightTitle = fight ? titleFor(fight) : '';
  const title = promo.title.trim() || fightTitle;
  const eventLine = promo.event.trim();
  const fighterTags = fight ? fighterNameHashtags(getFighterName(fight, 'A'), getFighterName(fight, 'B')).join(' ') : '';
  const generalPoster = uploadedPosters[id] || fight?.fightPosterImage || '';
  const posterImage = generalPoster || fight?.promotionBackground || fight?.fightPosterMobileImage || '';
  // The artwork the QR goes on: a one-affiliate upload, or the fight's poster.
  const campaignArt = audience === 'one' ? (customSource?.fightId === id ? customSource.url : '') : generalPoster;
  const shareLink = audience === 'one' && affiliate && id ? getAffiliateFightShareUrl(affiliate, id) : url;
  const prizeLine = Number(fight?.matchTokens) > 0 && Number(fight?.pot) > 0
    ? 'Compete for cash prizes where eligible. See the fight page for entry details, prize rules, and availability.'
    : 'Play for prizes and bragging rights. See the fight page for the rewards and entry rules.';
  const intro = promo.message.trim() ? `${promo.message.trim()}\n\n` : '';
  const leagueLine = audience === 'one' && promo.affiliateName.trim() ? ` with ${promo.affiliateName.trim()}'s league` : '';
  const facebook = `${intro}Fight fans: join FANTASY MMADNESS for ${title}${leagueLine}! Make your picks before the fight, follow the action, and see how you stack up. ${prizeLine}${eventLine ? `\n\n${eventLine}` : ''}\n\nHave an affiliate invitation? Use their personal link so you can play with their league. Fight details: ${shareLink}\n\n#FANTASYMMADNESS #FightNight${fighterTags ? ` ${fighterTags}` : ''}`;
  const instagram = `${intro}Join the fight for ${title}${leagueLine}! Make your picks, follow the action, and compete with other fight fans. ${prizeLine}${eventLine ? `\n\n${eventLine}` : ''}\n\nScan the poster QR to get started. If an affiliate invited you, use their personal link to join their league.\n\n#FANTASYMMADNESS #FightNight${fighterTags ? ` ${fighterTags}` : ''}`;
  const tiktok = `${intro}Join FANTASY MMADNESS for ${title}${leagueLine}. Make your picks and compete with fight fans. ${prizeLine} Scan the poster QR to play, or use your affiliate's personal link to join their league. #FANTASYMMADNESS #FightTok${fighterTags ? ` ${fighterTags}` : ''}`;
  const xEnding = `. Make your picks and compete for prizes where eligible. Join: ${shareLink}${fighterTags ? ` ${fighterTags}` : ''}`;
  const xPost = `Join the fight: ${title.slice(0, Math.max(0, 280 - 'Join the fight: '.length - xEnding.length))}${xEnding}`;
  const affiliateText = `Hello {firstName},\n\n${title} is open on FANTASY MMADNESS. The owner has already set up the fight and its economics. Open your personal kit to download the social poster with your tracked QR, then share it with your ready-made Facebook, Instagram, TikTok, or X caption. Your tracked paid entries share 50% of FANTASY MMADNESS platform proceeds under the existing affiliate split. Review your recipients before sending.`;
  const approvedFor = approved && approved.fightId === id && approved.audience === audience && (audience === 'all' || approved.affiliateId === affiliateId) ? approved : null;

  const defaultPromo = (row, person, who) => {
    if (!row) return { title: '', event: '', affiliateName: '', message: '' };
    const fightName = titleFor(row);
    const event = [row.matchName && row.matchName !== fightName ? row.matchName : '', formatFightDate(row)].filter(Boolean).join(' · ');
    const name = who === 'one' && person ? personName(person) : '';
    return {
      title: fightName,
      event,
      affiliateName: name,
      message: who === 'one' && person
        ? `${name} invites you to play ${fightName} on FANTASY MMADNESS. Scan the QR code on the poster to join ${person.firstName || name}'s league and make your picks.`
        : `Play ${fightName} on FANTASY MMADNESS. Scan the QR code on the poster to join my league and make your picks.`,
    };
  };
  const clearCampaign = () => { setFinished(null); setApproved(null); };
  // A different fight, audience or affiliate starts a fresh campaign: new
  // text from the registry, no old preview or approval carried over.
  useEffect(() => { setPromo(defaultPromo(fight, affiliate, audience)); clearCampaign(); }, [id, affiliateId, audience]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setCustomSource((current) => (current && current.fightId === id ? current : null)); }, [id]);
  const editPromo = (field, value) => { setPromo((current) => ({ ...current, [field]: value })); clearCampaign(); };

  useEffect(() => {
    if (!finished?.url) { setFinishedSrc(''); return undefined; }
    if (/^https?:\/\//i.test(finished.url)) { setFinishedSrc(finished.url); return undefined; }
    let active = true; let objectUrl = '';
    fetch(buildPublicApiUrl(finished.url), { headers: adminHeaders(), cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('The finished poster could not be loaded.'); return response.blob(); })
      .then((blob) => { if (!active) return; objectUrl = URL.createObjectURL(blob); setFinishedSrc(objectUrl); })
      .catch((err) => toast.error(err.message));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [finished?.url]);

  // Put the QR in an empty QR box on the artwork, or else a calm open area
  // (lower-right preferred). The owner can still drag and resize it.
  useEffect(() => {
    if (!id || !campaignArt || (audience === 'one' && !affiliateId)) { setPlacementNote(''); return undefined; }
    let active = true;
    setPlacementNote('Finding a spot for the QR code…');
    fetch(buildPublicApiUrl('/api/admin/affiliate-posters/suggest-placement'), {
      method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ fightId: id, sourceId: audience === 'one' ? customSource?.id : '', sourcePosterUrl: campaignArt }),
    }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!active) return;
      if (!response.ok || !result.placement) { setPlacementNote(result.message || 'Drag the QR code onto an empty area of your poster.'); return; }
      setPlacement({ x: result.placement.x, y: result.placement.y, scale: result.placement.scale });
      clearCampaign();
      setPlacementNote(result.placement.reason === 'empty-box'
        ? 'Found the empty QR box on your poster and placed the QR code inside it.'
        : result.placement.reason === 'open-area'
          ? 'No empty QR box was found, so the QR code is in a clear area near the lower-right corner.'
          : 'No empty QR box was found, so the QR code is in the lower-right corner.');
    }).catch(() => { if (active) setPlacementNote('Drag the QR code onto an empty area of your poster.'); });
    return () => { active = false; };
  }, [id, campaignArt, audience, affiliateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clampPlacement = (next) => {
    const scale = Math.min(0.6, Math.max(0.06, Number(next.scale) || 0.22));
    return { scale, x: Math.min(1 - scale, Math.max(0, Number(next.x) || 0)), y: Math.min(Math.max(0, 1 - scale * posterAspect), Math.max(0, Number(next.y) || 0)) };
  };
  const updatePlacement = (next) => { setPlacement(clampPlacement(next)); clearCampaign(); };
  const startQrDrag = (event) => {
    const box = placementRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    event.preventDefault();
    const drag = { startX: event.clientX, startY: event.clientY, from: placement, width: box.width, height: box.height };
    const move = (moveEvent) => { moveEvent.preventDefault?.(); updatePlacement({ ...drag.from, x: drag.from.x + (moveEvent.clientX - drag.startX) / drag.width, y: drag.from.y + (moveEvent.clientY - drag.startY) / drag.height }); };
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const uploadPoster = async (file) => {
    if (!file || !id) return;
    if (audience === 'one' && !affiliateId) { setUploadError('Choose the affiliate first, then upload their poster.'); return; }
    setUploadBusy(true);
    setUploadError('');
    try {
      if (audience === 'one') {
        // Saved only for this campaign: the fight's general poster and every
        // other affiliate's poster stay exactly as they are.
        const source = await uploadAffiliatePosterSource(id, file);
        setCustomSource(source);
        clearCampaign();
        toast.success(source.exact ? 'Poster saved for this affiliate only.' : 'Poster saved for this affiliate only (a slightly smaller copy, because the file was very large).');
      } else {
        const result = await uploadFightPosterExact(id, file);
        setUploadedPosters((current) => ({ ...current, [id]: result.poster }));
        clearCampaign();
        toast.success(result.exact ? 'Poster saved for this fight.' : 'Poster saved for this fight (a slightly smaller copy, because the file was very large).');
      }
    } catch (err) { setUploadError(err.message || 'Could not upload the poster.'); toast.error(err.message || 'Could not upload the poster.'); }
    finally { setUploadBusy(false); }
  };

  const buildFinished = async () => {
    if (!id || !campaignArt) return;
    setCampaignBusy('preview');
    // The old preview disappears while the new one is made, so an outdated
    // poster can never be approved by mistake.
    clearCampaign();
    try {
      const response = await fetch(buildPublicApiUrl('/api/admin/affiliate-posters/preview'), {
        method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ fightId: id, audience, affiliateId: audience === 'one' ? affiliateId : '', sourceId: audience === 'one' ? customSource?.id : '', sourcePosterUrl: campaignArt, qr: placement, promo: { ...promo, title } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.poster) throw new Error(result.message || `The finished poster could not be made (HTTP ${response.status}).`);
      setFinished(result.poster);
    } catch (err) { setFinished(null); toast.error(err.message || 'The finished poster could not be made.'); }
    finally { setCampaignBusy(''); }
  };
  const approveFinished = async () => {
    if (!finished?.id) return;
    setCampaignBusy('approve');
    try {
      const response = await fetch(buildPublicApiUrl(`/api/admin/affiliate-posters/${encodeURIComponent(finished.id)}/approve`), { method: 'POST', headers: adminHeaders() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.poster) throw new Error(result.message || 'The finished poster could not be approved.');
      setApproved(result.poster);
      toast.success('Approved. This exact poster and text will be used for the announcement.');
    } catch (err) { toast.error(err.message || 'The finished poster could not be approved.'); }
    finally { setCampaignBusy(''); }
  };
  const downloadFinished = async () => {
    if (!finishedSrc) return;
    try {
      const blob = await (await fetch(finishedSrc)).blob();
      const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[blob.type] || 'png';
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href; anchor.download = `fantasy-mmadness-poster-${id}${audience === 'one' && affiliate ? `-${String(affiliate.firstName || 'affiliate').toLowerCase()}` : ''}.${ext}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(href), 30000);
    } catch { toast.error('Could not download the poster.'); }
  };

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch(buildPublicApiUrl('/api/admin/fights', { limit: 240, includeShadow: true, source: 'all' }), { headers: adminHeaders() }),
      fetchPublishedWrestlingPromotions('OPEN,LOCKED,LIVE,SCORING,FINALIZED').catch(() => []),
    ])
      .then(async ([response, wrestling]) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || `Could not load Fight Registry (HTTP ${response.status}).`);
        const rows = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : [];
        if (live) setFights([...wrestling, ...normalizePublicFightRows(rows)]);
      })
      .catch((err) => { if (live) setError(err.message || 'Could not load Fight Registry.'); })
      .finally(() => { if (live) setLoading(false); });
    fetch('/api/admin/affiliate-network', { headers: adminHeaders() })
      .then((response) => response.json().catch(() => ({})))
      .then((data) => {
        const rows = Array.isArray(data) ? data : (data?.affiliates || data?.users || data?.data || []);
        if (live && Array.isArray(rows)) setAffiliates(rows.filter((user) => user.verified && isValidEmail(user.email)).sort((a, b) => personName(a).localeCompare(personName(b))));
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const copy = async (value, name) => {
    try { await navigator.clipboard.writeText(value); toast.success(`${name} copied.`); }
    catch { toast.error(`Could not copy ${name.toLowerCase()}. Select the text and copy it manually.`); }
  };

  const downloadPoster = async () => {
    if (!fight || busy) return;
    setBusy(true);
    try {
      if (!posterImage) throw new Error('Upload a fight poster before downloading a social poster.');
      const image = await buildFightSocialPoster({ fighterA: getFighterName(fight, 'A'), fighterB: getFighterName(fight, 'B'),
        fighterAImage: getFighterImage(fight, 'A'), fighterBImage: getFighterImage(fight, 'B'),
        basePoster: posterImage, sport: fight.matchCategoryTwo || fight.matchCategory, event: fight.matchName,
        date: formatFightDate(fight), url, prize: fight.pot, entryCoins: fight.matchTokens });
      saveFightSocialPoster(image, id);
      toast.success('Fight post image downloaded.');
    } catch (err) { toast.error(err.message || 'Could not save the post image. Check the fighter photos.'); }
    finally { setBusy(false); }
  };

  const optionLabel = (row) => `${titleFor(row)} · ${formatFightDate(row)}${!isPastFight(row) && datePassed(row) ? ' · date passed, not completed' : ''}`;
  const shownCurrent = current.filter(matchesSearch);
  const shownPast = past.filter(matchesSearch);
  const selectedHidden = fight && !matchesSearch(fight);
  const field = { display: 'block', width: '100%', marginTop: 6 };

  return <section className={styles.desk} aria-label="Fight launch desk">
    <div className={styles.heading}><div><span>FIGHT LAUNCH DESK</span><h2>Post a fight. Rally your affiliates.</h2><p>Prepare a post from an open fight, then send affiliates a message through your existing email tool.</p></div></div>
    {error && <p role="alert">{error}</p>}
    <label className={styles.picker}>Find a fight
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a fighter or event name" aria-label="Find a fight" style={field} />
    </label>
    <label className={styles.picker}>Choose a fight
      <select value={id} onChange={(e) => setSelected(e.target.value)} disabled={loading || !usable.length} aria-label="Choose a fight">
        <option value="">{loading ? 'Loading fights…' : 'Choose a fight…'}</option>
        {selectedHidden && <option value={id}>{optionLabel(fight)}</option>}
        <optgroup label="Current and upcoming fights">
          {shownCurrent.map((row) => <option key={getFightId(row)} value={getFightId(row)}>{optionLabel(row)}</option>)}
        </optgroup>
        {shownPast.length > 0 && <optgroup label="Past fights">
          {shownPast.map((row) => <option key={getFightId(row)} value={getFightId(row)}>{optionLabel(row)} · completed</option>)}
        </optgroup>}
      </select>
    </label>
    <div className={styles.uploadPanel}>
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>Who is this poster for?</legend>
        <label style={{ display: 'block', marginBottom: 4 }}><input type="radio" name="launch-audience" value="all" checked={audience === 'all'} onChange={() => setAudience('all')} /> All affiliates (each gets their own QR code; the upload becomes this fight's general poster)</label>
        <label style={{ display: 'block' }}><input type="radio" name="launch-audience" value="one" checked={audience === 'one'} onChange={() => setAudience('one')} /> One affiliate (their own poster; the fight's general poster is not changed)</label>
      </fieldset>
      {audience === 'one' && <label style={{ display: 'block', marginBottom: 12 }}>Affiliate
        <select value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} aria-label="Choose the affiliate" style={field}>
          <option value="">Choose an affiliate…</option>
          {affiliates.map((user) => <option key={user._id} value={String(user._id)}>{personName(user)} · {user.email}</option>)}
        </select>
      </label>}
      <label htmlFor="fight-launch-poster">Upload your finished fight poster</label>
      <p>{fight ? <>This poster will be saved to <strong>{fightTitle}</strong>{audience === 'one' ? (affiliate ? <> for <strong>{personName(affiliate)}</strong> only</> : ' (choose the affiliate first)') : ' as its general poster'}.</> : 'Choose a fight first. The poster is saved to exactly the fight you choose.'} PNG, JPEG, or WebP, up to 25 MB.</p>
      <input id="fight-launch-poster" type="file" accept="image/png,image/jpeg,image/webp" disabled={!fight || uploadBusy || (audience === 'one' && !affiliateId)} onChange={(e) => { uploadPoster(e.target.files?.[0]); e.target.value = ''; }} />
      <small>{uploadBusy ? 'Uploading poster…' : !fight ? 'Choose a fight to enable upload.' : audience === 'one' ? (customSource?.fightId === id ? 'Poster uploaded for this affiliate.' : 'Upload the poster for this affiliate.') : generalPoster ? 'Poster saved for this fight. Choose another image to replace it.' : 'No poster saved for this fight yet. Upload your own.'}</small>
      {uploadError && <p role="alert" className={styles.uploadError}>{uploadError}</p>}
    </div>
    {loading ? <p>Loading fights…</p> : !usable.length ? <p>No published fights were found in the Fight Registry. Publish or schedule a fight there first.</p> : !fight ? <p>Choose a fight above to prepare its poster and posts.</p> : <>
      {campaignArt && (audience === 'all' || affiliate) && <div className={styles.uploadPanel} data-campaign="true">
        <strong>Place the QR code on your poster</strong>
        <p>{placementNote || 'Drag the QR code onto an empty area of your poster.'} Drag it or use the slider to adjust. The QR stays inside your artwork; nothing is added around it.</p>
        <div ref={placementRef} aria-label="QR code placement on your poster" style={{ position: 'relative', width: '100%', maxWidth: 420, touchAction: 'none', userSelect: 'none' }}>
          <img src={resolvePublicMediaUrl(campaignArt)} alt="Your uploaded poster" draggable={false} onLoad={(event) => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) setPosterAspect(image.naturalWidth / image.naturalHeight); }} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8 }} />
          <img data-qr-handle="true" src={(audience === 'one' ? affiliateId : String(affiliates[0]?._id || '')) ? `/api/fight-qr?fightId=${encodeURIComponent(id)}&affiliateId=${encodeURIComponent(audience === 'one' ? affiliateId : String(affiliates[0]._id))}&inline=1` : '/images/brand/fantasy-mmadness-main-logo-v23.jpg'} alt="QR code position" draggable={false} onPointerDown={startQrDrag} style={{ position: 'absolute', left: `${placement.x * 100}%`, top: `${placement.y * 100}%`, width: `${placement.scale * 100}%`, aspectRatio: '1 / 1', objectFit: 'cover', cursor: 'move', background: '#fff', outline: '2px dashed #b7192c', outlineOffset: 2, touchAction: 'none' }} />
        </div>
        <label style={{ display: 'block', margin: '10px 0' }}>QR code size: {Math.round(placement.scale * 100)}% of the poster width
          <input type="range" min="6" max="45" step="1" value={Math.round(placement.scale * 100)} onChange={(e) => updatePlacement({ ...placement, scale: Number(e.target.value) / 100 })} style={{ display: 'block', width: '100%', maxWidth: 420 }} />
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: '6px 0 0' }}>
          <legend style={{ fontWeight: 600 }}>Promotional information (does not change the Fight Registry)</legend>
          <label style={{ display: 'block', marginTop: 8 }}>Promotional fight title<input type="text" value={promo.title} maxLength={140} onChange={(e) => editPromo('title', e.target.value)} style={field} /></label>
          <label style={{ display: 'block', marginTop: 8 }}>Event information<input type="text" value={promo.event} maxLength={200} onChange={(e) => editPromo('event', e.target.value)} style={field} /></label>
          {audience === 'one' && <label style={{ display: 'block', marginTop: 8 }}>Affiliate name<input type="text" value={promo.affiliateName} maxLength={80} onChange={(e) => editPromo('affiliateName', e.target.value)} style={field} /></label>}
          <label style={{ display: 'block', marginTop: 8 }}>Promotional message<textarea rows={3} value={promo.message} maxLength={2000} onChange={(e) => editPromo('message', e.target.value)} style={field} /></label>
        </fieldset>
        <div className={styles.buttons} style={{ marginTop: 12 }}>
          <button type="button" disabled={Boolean(campaignBusy) || uploadBusy} onClick={buildFinished}>{campaignBusy === 'preview' ? 'Making the finished poster…' : 'Show finished poster'}</button>
        </div>
        {finished && <div data-finished-poster="true" style={{ marginTop: 14 }}>
          <strong>Finished poster{audience === 'one' ? ` for ${personName(affiliate)}` : ` (sample: ${finished.affiliateName || 'first affiliate'}'s QR; each affiliate gets their own)`}</strong>
          {finishedSrc ? <img src={finishedSrc} alt="Finished poster with the QR code" style={{ display: 'block', width: '100%', maxWidth: 420, height: 'auto', marginTop: 8, borderRadius: 8 }} /> : <p>Loading the finished poster…</p>}
          <dl style={{ margin: '10px 0', overflowWrap: 'anywhere' }}>
            <dt>Fight</dt><dd>{fightTitle} · {formatFightDate(fight)}</dd>
            <dt>Sent to</dt><dd>{audience === 'one' ? `${personName(affiliate)} (${affiliate?.email})` : 'All approved affiliates'}</dd>
            <dt>Promotional title</dt><dd>{finished.promo?.title}</dd>
            {finished.promo?.event && <><dt>Event</dt><dd>{finished.promo.event}</dd></>}
            {audience === 'one' && <><dt>Affiliate name</dt><dd>{finished.promo?.affiliateName}</dd></>}
            <dt>Message</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{finished.promo?.message}</dd>
            <dt>QR code opens</dt><dd><a href={finished.qrLink} target="_blank" rel="noopener noreferrer">{finished.qrLink}</a></dd>
          </dl>
          <div className={styles.buttons}>
            {approvedFor ? <p role="status"><strong>Approved.</strong> This exact poster and text will be used.</p> : <button type="button" disabled={Boolean(campaignBusy) || !finishedSrc} onClick={approveFinished}>{campaignBusy === 'approve' ? 'Approving…' : 'Approve this poster'}</button>}
            <button type="button" disabled={!finishedSrc} onClick={downloadFinished}>Download finished poster</button>
          </div>
        </div>}
        <div className={styles.affiliate} style={{ marginTop: 14 }}>
          <div><strong>{audience === 'one' ? 'Send this poster to the affiliate' : 'Send this poster to all affiliates'}</strong><p>{approvedFor ? 'The announcement window opens with the approved poster attached.' : 'Approve the finished poster first. Any change to the fight, affiliate, poster, QR position, or text needs a new preview and approval.'}</p></div>
          {approvedFor ? <Link href={{ pathname: '/administration/AffiliateUsers', query: { posterCampaign: approvedFor.id } }}>Prepare affiliate announcement →</Link> : <span aria-disabled="true" style={{ opacity: 0.55 }}>Prepare affiliate announcement →</span>}
        </div>
      </div>}
      <div className={styles.layout}>
        <div className={styles.preview}>{posterImage ? <img src={resolvePublicMediaUrl(audience === 'one' && campaignArt ? campaignArt : posterImage)} alt={`Fight poster for ${title}`} style={{ width: '100%', maxHeight: 470, objectFit: 'contain' }} /> : <div className={styles.photos}><img src={resolvePublicMediaUrl(getFighterImage(fight, 'A'))} alt={getFighterName(fight, 'A')} /><strong>VS</strong><img src={resolvePublicMediaUrl(getFighterImage(fight, 'B'))} alt={getFighterName(fight, 'B')} /></div>}<h3>{title}</h3><p>{eventLine || formatFightDate(fight)}</p><Link href={`/fight/${encodeURIComponent(id)}?play=1`} target="_blank">Check player page ↗</Link></div>
        <div className={styles.share}><strong>Owner fight link</strong><input readOnly value={url} aria-label="Owner fight link" onFocus={(e) => e.target.select()} /><div className={styles.buttons}><button type="button" onClick={() => copy(url, 'Fight link')}>Copy link</button><button type="button" onClick={downloadPoster} disabled={busy || !posterImage}>{busy ? 'Preparing image…' : 'Download poster with QR'}</button><ShareQrCode url={url} label="Fight" fileName={`fight-${id}`} /></div><small>The poster preview shows the selected fight artwork. Download adds the owner QR; affiliate kits add each affiliate’s own tracked link and QR. Include a clickable link in Facebook and X posts too.</small></div>
      </div>
      <div className={styles.templates}>{[['Facebook', facebook], ['Instagram', instagram], ['TikTok', tiktok], ['X', xPost]].map(([name, value]) => <article key={name}><div><h3>{name} post</h3><button type="button" onClick={() => copy(value, `${name} post`)}>Copy post</button></div><textarea aria-label={`${name} post`} readOnly value={value} rows={5} onFocus={(e) => e.target.select()} /></article>)}</div>
      <div className={styles.affiliate}><div><strong>Send personal social posters to affiliates</strong><p>Each approved affiliate gets a ready-to-post kit with this fight design, their own tracked QR and link, and Facebook, Instagram, TikTok, and X captions. Review recipients before sending.</p></div><Link href={{ pathname: '/administration/AffiliateUsers', query: { launchFight: id, launchTitle: title } }}>Prepare affiliate alerts →</Link></div>
      <details className={styles.message}><summary>Preview affiliate message</summary><pre>{affiliateText}</pre></details>
    </>}
  </section>;
}
