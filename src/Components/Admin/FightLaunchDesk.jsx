import { fetchPublishedWrestlingPromotions, isPlaceholderWrestlingPromotion } from '@/Utils/affiliatePromotionFights';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { buildPublicApiUrl, normalizePublicFightRows } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';
import { formatFightDate, getFightId, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import AffiliatePosterStudio from '@/Components/Admin/AffiliatePosterStudio';
import { prepareFightPosterUpload } from '@/Utils/prepareFightPosterUpload';
import { fighterNameHashtags } from '@/Utils/fightShareCopy';
import styles from './FightLaunchDesk.module.css';

const titleFor = (fight) => `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`;
const getOpenFights = (rows) => (Array.isArray(rows) ? rows : []).filter((fight) => {
  if (isPlaceholderWrestlingPromotion(fight)) return false;
  if (fight.gameMode === 'PRO_WRESTLING') return getFightId(fight) && fight.status === 'OPEN' && (!fight.lockAt || new Date(fight.lockAt).getTime() > Date.now());
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : parseFightDate(fight)?.getTime();
  return getFightId(fight) && (!Number.isFinite(lock) || lock > Date.now())
    && !/draft|closed|finished|complete|cancel/.test(String(fight.matchStatus || fight.status || '').toLowerCase());
}).sort((a, b) => (parseFightDate(a)?.getTime() ?? Infinity) - (parseFightDate(b)?.getTime() ?? Infinity));

export default function FightLaunchDesk() {
  const router = useRouter();
  const [fights, setFights] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(() => { if (typeof router.query.fightId === 'string') setSelected(router.query.fightId); }, [router.query.fightId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPosters, setUploadedPosters] = useState({});
  const open = useMemo(() => getOpenFights(fights), [fights]);
  const fight = open.find((row) => String(getFightId(row)) === selected) || open[0];
  const id = fight ? String(getFightId(fight)) : '';
  const url = id ? `https://www.fantasymmadness.com${fight?.gameMode === 'PRO_WRESTLING' ? '/pro-wrestling/matches' : '/fight'}/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=social&utm_campaign=fight_launch` : '';
  const title = fight ? titleFor(fight) : '';
  const fighterTags = fight ? fighterNameHashtags(getFighterName(fight, 'A'), getFighterName(fight, 'B')).join(' ') : '';
  const posterImage = uploadedPosters[id] || fight?.fightPosterImage || fight?.promotionBackground || fight?.fightPosterMobileImage || '';
  const prizeLine = Number(fight?.matchTokens) > 0 && Number(fight?.pot) > 0
    ? 'Compete for cash prizes where eligible. See the fight page for entry details, prize rules, and availability.'
    : 'Play for prizes and bragging rights. See the fight page for the rewards and entry rules.';
  const facebook = `Fight fans: join FANTASY MMADNESS for ${title}! Make your picks before the fight, follow the action, and see how you stack up. ${prizeLine}\n\nHave an affiliate invitation? Use their personal link so you can play with their league. Fight details: ${url}\n\n#FANTASYMMADNESS #FightNight${fighterTags ? ` ${fighterTags}` : ''}`;
  const instagram = `Join the fight for ${title}! Make your picks, follow the action, and compete with other fight fans. ${prizeLine}\n\nScan the poster QR to get started. If an affiliate invited you, use their personal link to join their league.\n\n#FANTASYMMADNESS #FightNight${fighterTags ? ` ${fighterTags}` : ''}`;
  const tiktok = `Join FANTASY MMADNESS for ${title}. Make your picks and compete with fight fans. ${prizeLine} Scan the poster QR to play, or use your affiliate's personal link to join their league. #FANTASYMMADNESS #FightTok${fighterTags ? ` ${fighterTags}` : ''}`;
  const xEnding = `. Make your picks and compete for prizes where eligible. Join: ${url}${fighterTags ? ` ${fighterTags}` : ''}`;
  const xPost = `Join the fight: ${title.slice(0, Math.max(0, 280 - 'Join the fight: '.length - xEnding.length))}${xEnding}`;

  const uploadPoster = async (file) => {
    if (!file || !id) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 25 * 1024 * 1024) {
      setUploadError('Choose a PNG, JPEG, or WebP image under 25 MB.'); return;
    }
    setUploadBusy(true);
    setUploadError('');
    try {
      const prepared = await prepareFightPosterUpload(file);
      const body = new FormData(); body.append('poster', prepared);
      const response = await fetch(buildPublicApiUrl(`/api/admin/fights/${encodeURIComponent(id)}/social-poster`), { method: 'POST', headers: adminHeaders(), body });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) throw new Error('Your admin session has expired. Sign in again, then retry the upload.');
      if (response.status === 413) throw new Error('The poster is too large for the server. Try a smaller image.');
      if (!response.ok || !result.poster) throw new Error(result.message || `Could not save the poster (HTTP ${response.status}).`);
      setUploadedPosters((current) => ({ ...current, [id]: result.poster }));
      toast.success('Poster saved. Each affiliate kit will add its own tracked QR.');
    } catch (error) { setUploadError(error.message || 'Could not upload the poster.'); toast.error(error.message || 'Could not upload the poster.'); }
    finally { setUploadBusy(false); }
  };

  useEffect(() => {
    let live = true;
    Promise.all([fetch(buildPublicApiUrl('/api/admin/fights', { limit: 240, includeShadow: true, source: 'all' }), { headers: adminHeaders() }), fetchPublishedWrestlingPromotions('OPEN')])
      .then(async ([response, wrestling]) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || `Could not load Fight Registry (HTTP ${response.status}).`);
        const rows = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : [];
        if (live) setFights([...wrestling, ...normalizePublicFightRows(rows)]);
      })
      .catch((err) => { if (live) setError(err.message || 'Could not load Fight Registry.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const copy = async (value, name) => {
    try { await navigator.clipboard.writeText(value); toast.success(`${name} copied.`); }
    catch { toast.error(`Could not copy ${name.toLowerCase()}. Select the text and copy it manually.`); }
  };


  const fightPicker = <label className={styles.picker}>Fight
      <select value={id} onChange={(e) => setSelected(e.target.value)} disabled={loading || !open.length}>
        {open.map((row) => <option key={getFightId(row)} value={getFightId(row)}>{titleFor(row)} · {formatFightDate(row, { dateOnly: true })}</option>)}
      </select>
    </label>;

  return <section className={styles.desk} aria-label="Fight launch desk">
    <div className={styles.heading}><div><span>FIGHT LAUNCH DESK</span><h2>Affiliate fight posters</h2></div></div>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading fights…</p> : !fight ? <p>No upcoming published fights were found in the Fight Registry.</p>
      : <AffiliatePosterStudio fight={fight} artwork={posterImage} fightPicker={fightPicker} />}
    {fight && <details className={styles.deskExtras}>
      <summary>Fight artwork, captions and affiliate alerts</summary>
      <div className={styles.uploadPanel}>
        <label htmlFor="fight-launch-poster">Replace this fight&apos;s artwork</label>
        <input id="fight-launch-poster" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadBusy} onChange={(e) => { uploadPoster(e.target.files?.[0]); e.target.value = ''; }} />
        <small>{uploadBusy ? 'Uploading…' : 'PNG, JPEG or WebP up to 25 MB.'}</small>
        {uploadError && <p role="alert" className={styles.uploadError}>{uploadError}</p>}
      </div>
      <div className={styles.templates}>{[['Facebook', facebook], ['Instagram', instagram], ['TikTok', tiktok], ['X', xPost]].map(([name, value]) => <article key={name}><div><h3>{name}</h3><button type="button" onClick={() => copy(value, `${name} post`)}>Copy</button></div><textarea aria-label={`${name} post`} readOnly value={value} rows={4} onFocus={(e) => e.target.select()} /></article>)}</div>
      <div className={styles.affiliate}><strong>Email affiliates about this fight</strong><Link href={{ pathname: '/administration/AffiliateUsers', query: { launchFight: id, launchTitle: title } }}>Prepare affiliate alerts →</Link></div>
    </details>}
  </section>;
}
