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
// A fight stays "current" through its fight day (24 hours after its start).
const CURRENT_GRACE_MS = 24 * 60 * 60 * 1000;
// Which list a fight belongs in. Records are never changed; this is display only.
const fightGroup = (fight, homepageSlot) => {
  if (isPastFight(fight)) return 'past';
  const time = fightTime(fight);
  if (homepageSlot || (Number.isFinite(time) && time >= Date.now() - CURRENT_GRACE_MS)) return 'current';
  return Number.isFinite(time) ? 'stale' : 'undated';
};
const GROUP_LABELS = { current: 'Current and upcoming fights', undated: 'No date set', stale: 'Date passed — not marked completed', past: 'Past fights (completed)' };
const rowsOf = (payload) => (Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.rows) ? payload.rows : []);
const searchWords = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9']+/).filter(Boolean);
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
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
  const [uploadPreview, setUploadPreview] = useState(null);
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

  const [homepageSlots, setHomepageSlots] = useState({});
  const usable = useMemo(() => (Array.isArray(fights) ? fights : []).filter((fight) => getFightId(fight) && !isPlaceholderWrestlingPromotion(fight) && !isDraft(fight)), [fights]);
  const slotOf = (fight) => homepageSlots[String(getFightId(fight))] || 0;
  // Every word typed must appear in either fighter's name, the event name or
  // the date; partial words and any capitalization match.
  const searchText = (fight) => searchWords(`${getFighterName(fight, 'A')} ${getFighterName(fight, 'B')} ${fight.matchFighterA || ''} ${fight.matchFighterB || ''} ${fight.matchName || ''} ${fight.matchTitle || ''} ${formatFightDate(fight)}`).join(' ');
  const groups = useMemo(() => {
    const out = { current: [], undated: [], stale: [], past: [] };
    usable.forEach((fight) => { out[fightGroup(fight, homepageSlots[String(getFightId(fight))])].push(fight); });
    out.current.sort((a, b) => (fightTime(a) ?? Infinity) - (fightTime(b) ?? Infinity));
    out.stale.sort((a, b) => (fightTime(b) ?? 0) - (fightTime(a) ?? 0));
    out.past.sort((a, b) => (fightTime(b) ?? 0) - (fightTime(a) ?? 0));
    return out;
  }, [usable, homepageSlots]);
  const searchResults = useMemo(() => {
    const terms = searchWords(search);
    if (!terms.length) return [];
    return ['current', 'undated', 'stale', 'past'].flatMap((group) => groups[group]
      .filter((fight) => { const text = searchText(fight); return terms.every((term) => text.includes(term)); })
      .map((fight) => ({ fight, group })));
  }, [search, groups]); // eslint-disable-line react-hooks/exhaustive-deps
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
    setUploadError('');
    // Show the chosen image right away; it is marked saved only once the server confirms.
    setUploadPreview((current) => { if (current?.src) URL.revokeObjectURL(current.src); return { fightId: id, name: file.name, src: URL.createObjectURL(file), saved: false }; });
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setUploadError(`"${file.name}" is not a PNG, JPEG, or WebP image.`); return; }
    if (file.size > 25 * 1024 * 1024) { setUploadError(`"${file.name}" is ${(file.size / 1048576).toFixed(1)} MB; the limit is 25 MB.`); return; }
    setUploadBusy(true);
    try {
      if (audience === 'one') {
        // Saved only for this campaign: the fight's general poster and every
        // other affiliate's poster stay exactly as they are.
        const source = await uploadAffiliatePosterSource(id, file);
        setCustomSource(source);
        setUploadPreview((current) => (current ? { ...current, saved: true } : current));
        clearCampaign();
        toast.success(source.exact ? 'Poster saved for this affiliate only.' : 'Poster saved for this affiliate only (a slightly smaller copy, because the file was very large).');
      } else {
        const result = await uploadFightPosterExact(id, file);
        setUploadedPosters((current) => ({ ...current, [id]: result.poster }));
        setUploadPreview((current) => (current ? { ...current, saved: true } : current));
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
    // Source of truth: the live Fight Registry (fresh, never cached), plus the
    // fights the public website is showing right now and the homepage slots,
    // so a newly entered fight can never be missing from this list.
    const getJson = async (path, query, headers) => {
      const response = await fetch(buildPublicApiUrl(path, { ...query, _: Date.now() }), { headers, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
      return payload;
    };
    Promise.allSettled([
      getJson('/api/admin/fights', { limit: 500, includeShadow: true, source: 'all' }, adminHeaders()),
      getJson('/api/public/prediction-fights', { limit: 500 }),
      getJson('/api/public/homepage/promoted-fights', { limit: 10 }),
      fetchPublishedWrestlingPromotions('OPEN,LOCKED,LIVE,SCORING,FINALIZED'),
    ])
      .then(([registry, website, homepage, wrestling]) => {
        if (!live) return;
        if (registry.status === 'rejected' && website.status === 'rejected') throw new Error(`Could not load the Fight Registry (${registry.reason?.message || 'unavailable'}).`);
        if (registry.status === 'rejected') setError(`The Fight Registry did not answer (${registry.reason?.message || 'unavailable'}); showing the fights on the public website.`);
        const byId = new Map();
        const add = (row) => { const key = String(getFightId(row) || ''); if (key) byId.set(key, { ...(byId.get(key) || {}), ...row }); };
        normalizePublicFightRows(rowsOf(website.value)).forEach(add);
        normalizePublicFightRows(rowsOf(homepage.value)).forEach(add);
        normalizePublicFightRows(rowsOf(registry.value)).forEach(add);
        (wrestling.status === 'fulfilled' && Array.isArray(wrestling.value) ? wrestling.value : []).forEach(add);
        // Homepage positions as saved in the Fight Registry (slots 1–5).
        const slots = {};
        [...rowsOf(homepage.value), ...byId.values()].forEach((row) => {
          const key = String(getFightId(row) || row?._id || row?.id || '');
          const slot = Number(row?.homepageSlot);
          const promoted = row?.homepagePromoted === true || row?.homepagePromotion?.isPromoted === true;
          if (key && promoted && slot >= 1 && slot <= 5 && !isPastFight(row)) slots[key] = slot;
        });
        setHomepageSlots(slots);
        setFights([...byId.values()]);
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

  const optionLabel = (row) => `${titleFor(row)} · ${formatFightDate(row)}${slotOf(row) ? ` · Homepage ${slotOf(row)}` : ''}${!isPastFight(row) && datePassed(row) && !slotOf(row) ? ' · date passed, not completed' : ''}`;
  const field = { display: 'block', width: '100%', marginTop: 6 };
  const chooseFight = (value) => { setSelected(value); setSearch(''); };
  const uploadButton = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 22px', borderRadius: 10, fontSize: 18, fontWeight: 800, color: '#fff', background: '#ed253e', border: '2px solid #fff', cursor: 'pointer', width: 'fit-content', maxWidth: '100%' };

  return <section className={styles.desk} aria-label="Fight launch desk">
    <div className={styles.heading}><div><span>FIGHT LAUNCH DESK</span><h2>Post a fight. Rally your affiliates.</h2><p>Prepare a post from an open fight, then send affiliates a message through your existing email tool.</p></div></div>
    {error && <p role="alert">{error}</p>}
    <div className={styles.picker}>
      <label htmlFor="fight-launch-search">Find a fight</label>
      <input id="fight-launch-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a fighter's first or last name" aria-label="Find a fight" autoComplete="off" disabled={loading} style={field} />
      {search.trim() && <div data-search-results="true" role="listbox" aria-label="Matching fights" style={{ display: 'grid', gap: 6, maxHeight: 360, overflowY: 'auto', fontWeight: 400 }}>
        {searchResults.length
          ? searchResults.slice(0, 60).map(({ fight: row, group }) => <button key={getFightId(row)} type="button" role="option" aria-selected={String(getFightId(row)) === id} onClick={() => chooseFight(String(getFightId(row)))} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid #525c72', background: '#0e121c', color: '#fff', font: 'inherit', cursor: 'pointer' }}>
            <strong>{titleFor(row)}</strong><br /><span>{formatFightDate(row)}{row.matchName && row.matchName !== titleFor(row) ? ` · ${row.matchName}` : ''}{slotOf(row) ? ` · Homepage ${slotOf(row)}` : ''} · {GROUP_LABELS[group]}</span>
          </button>)
          : <p role="status" style={{ margin: 0 }}>No fights match “{search.trim()}”. Check the spelling, or try the other fighter&apos;s name.</p>}
      </div>}
    </div>
    <label className={styles.picker}>Choose a fight
      <select value={id} onChange={(e) => setSelected(e.target.value)} disabled={loading || !usable.length} aria-label="Choose a fight">
        <option value="">{loading ? 'Loading fights…' : 'Choose a fight…'}</option>
        {['current', 'undated', 'stale', 'past'].map((group) => groups[group].length > 0 && <optgroup key={group} label={GROUP_LABELS[group]}>
          {groups[group].map((row) => <option key={getFightId(row)} value={getFightId(row)}>{optionLabel(row)}{group === 'past' ? ' · completed' : ''}</option>)}
        </optgroup>)}
      </select>
    </label>
    {fight && <p role="status" data-selected-fight="true" style={{ margin: '0 0 16px', fontWeight: 700 }}>Selected fight: {fightTitle} · {formatFightDate(fight)}{slotOf(fight) ? ` · Homepage ${slotOf(fight)}` : ''}</p>}
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
      <strong style={{ fontSize: 20, color: '#ffbd4d' }}>Upload your finished fight poster</strong>
      <p>{fight ? <>This poster will be saved to <strong>{fightTitle}</strong>{audience === 'one' ? (affiliate ? <> for <strong>{personName(affiliate)}</strong> only</> : ' for one affiliate only (choose the affiliate before the preview)') : ' as its general poster'}.</> : 'Choose a fight first. The poster is saved to exactly the fight you choose.'} PNG, JPEG, or WebP, up to 25 MB. It does not need to be in the Fighter Library.</p>
      <input id="fight-launch-poster" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" disabled={!fight || uploadBusy} onChange={(e) => { uploadPoster(e.target.files?.[0]); e.target.value = ''; }} style={srOnly} />
      <label htmlFor="fight-launch-poster" data-upload-button="true" aria-disabled={!fight || uploadBusy} style={{ ...uploadButton, ...(!fight || uploadBusy ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}) }}>
        {uploadBusy ? 'Uploading…' : 'Choose File / Upload Custom Poster'}
      </label>
      <small>{uploadBusy ? 'Uploading poster…' : !fight ? 'Choose a fight to enable upload.' : audience === 'one' ? (customSource?.fightId === id ? 'Saved. This poster is for one affiliate only. Choose another image to replace it.' : 'Choose your finished poster.') : generalPoster ? 'Poster saved for this fight. Choose another image to replace it.' : 'No poster saved for this fight yet. Upload your own.'}</small>
      {uploadPreview && uploadPreview.fightId === id && <figure style={{ margin: 0 }} data-upload-preview="true">
        <img src={uploadPreview.src} alt={`Your poster for ${fightTitle}`} style={{ display: 'block', maxWidth: 220, maxHeight: 280, borderRadius: 8, border: '1px solid #a667d5' }} />
        <figcaption style={{ marginTop: 6 }}>{uploadPreview.name} · {uploadBusy ? 'saving…' : uploadPreview.saved ? 'saved successfully ✓' : 'not saved'}</figcaption>
      </figure>}
      {uploadError && <p role="alert" className={styles.uploadError}>Upload failed: {uploadError}</p>}
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
