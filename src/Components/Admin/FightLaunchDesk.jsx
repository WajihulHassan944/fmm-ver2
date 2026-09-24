import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { fetchPublicPredictionFights, PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';
import { formatFightDate, getFightId, getFighterImage, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { buildFightSocialPoster, saveFightSocialPoster } from '@/Utils/fightSocialPoster';
import { prepareFightPosterUpload } from '@/Utils/prepareFightPosterUpload';
import styles from './FightLaunchDesk.module.css';

const titleFor = (fight) => `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`;
const getOpenFights = (rows) => (Array.isArray(rows) ? rows : []).filter((fight) => {
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : parseFightDate(fight)?.getTime();
  return getFightId(fight) && (!Number.isFinite(lock) || lock > Date.now()) && fight.entryOpen !== false
    && !/draft|closed|finished|complete|cancel/.test(String(fight.matchStatus || fight.status || '').toLowerCase());
}).sort((a, b) => (parseFightDate(a)?.getTime() ?? Infinity) - (parseFightDate(b)?.getTime() ?? Infinity));

export default function FightLaunchDesk() {
  const [fights, setFights] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [poster, setPoster] = useState('');
  const [posterError, setPosterError] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPosters, setUploadedPosters] = useState({});
  const open = useMemo(() => getOpenFights(fights), [fights]);
  const fight = open.find((row) => String(getFightId(row)) === selected) || open[0];
  const id = fight ? String(getFightId(fight)) : '';
  const url = id ? `https://www.fantasymmadness.com/fight/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=social&utm_campaign=fight_launch` : '';
  const title = fight ? titleFor(fight) : '';
  const prizeLine = Number(fight?.matchTokens) > 0 && Number(fight?.pot) > 0
    ? 'Compete for cash prizes where eligible. See the fight page for entry details, prize rules, and availability.'
    : 'Play for prizes and bragging rights. See the fight page for the rewards and entry rules.';
  const facebook = `Fight fans: join FANTASY MMADNESS for ${title}! Make your picks before the fight, follow the action, and see how you stack up. ${prizeLine}\n\nHave an affiliate invitation? Use their personal link so you can play with their league. Fight details: ${url}\n\n#FANTASYMMADNESS #FightNight`;
  const instagram = `Join the fight for ${title}! Make your picks, follow the action, and compete with other fight fans. ${prizeLine}\n\nScan the poster QR to get started. If an affiliate invited you, use their personal link to join their league.\n\n#FANTASYMMADNESS #FightNight`;
  const tiktok = `Join FANTASY MMADNESS for ${title}. Make your picks and compete with fight fans. ${prizeLine} Scan the poster QR to play, or use your affiliate's personal link to join their league. #FANTASYMMADNESS #FightTok`;
  const xPost = `Join the fight: ${title.slice(0, 40)}. Make your picks and compete for prizes where eligible. Check rules and join: ${url}`;
  const affiliateText = `Hello {firstName},\n\n${title} is open on FANTASY MMADNESS. The owner has already set up the fight and its economics. Open your personal kit to download the social poster with your tracked QR, then share it with your ready-made Facebook, Instagram, TikTok, or X caption. Your tracked paid entries share 50% of FANTASY MMADNESS platform proceeds under the existing affiliate split. Review your recipients before sending.`;

  useEffect(() => {
    if (!fight || !url) { setPoster(''); return; }
    let active = true;
    setPoster('');
    setPosterError('');
    buildFightSocialPoster({ fighterA: getFighterName(fight, 'A'), fighterB: getFighterName(fight, 'B'),
      fighterAImage: getFighterImage(fight, 'A'), fighterBImage: getFighterImage(fight, 'B'),
      basePoster: uploadedPosters[id] || fight.fightPosterImage, sport: fight.matchCategoryTwo || fight.matchCategory, event: fight.matchName,
      date: formatFightDate(fight), url, prize: fight.pot, entryCoins: fight.matchTokens })
      .then((image) => { if (active) setPoster(image); })
      .catch((err) => { if (active) setPosterError(err.message || 'Could not make this poster. Check the fighter photos.'); });
    return () => { active = false; };
  }, [fight, url, uploadedPosters, id]);

  const uploadPoster = async (file) => {
    if (!file || !id) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error('Choose a PNG, JPEG, or WebP image under 8 MB.'); return;
    }
    setUploadBusy(true);
    setUploadError('');
    try {
      const prepared = await prepareFightPosterUpload(file);
      const body = new FormData(); body.append('poster', prepared);
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/fights/${encodeURIComponent(id)}/social-poster`, { method: 'POST', headers: adminHeaders(), body });
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
    fetchPublicPredictionFights({ limit: 240 })
      .then((rows) => { if (live) setFights(rows); })
      .catch((err) => { if (live) setError(err.message || 'Could not load open fights.'); })
      .finally(() => { if (live) setLoading(false); });
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
      const image = poster || await buildFightSocialPoster({ fighterA: getFighterName(fight, 'A'), fighterB: getFighterName(fight, 'B'),
        fighterAImage: getFighterImage(fight, 'A'), fighterBImage: getFighterImage(fight, 'B'),
        basePoster: uploadedPosters[id] || fight.fightPosterImage, sport: fight.matchCategoryTwo || fight.matchCategory, event: fight.matchName,
        date: formatFightDate(fight), url, prize: fight.pot, entryCoins: fight.matchTokens });
      saveFightSocialPoster(image, id);
      toast.success('Fight post image downloaded.');
    } catch (err) { toast.error(err.message || 'Could not save the post image. Check the fighter photos.'); }
    finally { setBusy(false); }
  };

  return <section className={styles.desk} aria-label="Fight launch desk">
    <div className={styles.heading}><div><span>FIGHT LAUNCH DESK</span><h2>Post a fight. Rally your affiliates.</h2><p>Prepare a post from an open fight, then send affiliates a message through your existing email tool.</p></div></div>
    {error && <p role="alert">{error}</p>}
    <label className={styles.picker}>Choose an open fight
      <select value={id} onChange={(e) => setSelected(e.target.value)} disabled={loading || !open.length}>
        {open.map((row) => <option key={getFightId(row)} value={getFightId(row)}>{titleFor(row)} · {formatFightDate(row)}</option>)}
      </select>
    </label>
    <div className={styles.uploadPanel}>
      <label htmlFor="fight-launch-poster">Upload your finished fight poster</label>
      <p>Select a fight above, then choose a PNG, JPEG, or WebP image (up to 8 MB). Each affiliate kit adds that affiliate's tracked link and QR code to your artwork.</p>
      <input id="fight-launch-poster" type="file" accept="image/png,image/jpeg,image/webp" disabled={!fight || uploadBusy} onChange={(e) => { uploadPoster(e.target.files?.[0]); e.target.value = ''; }} />
      <small>{uploadBusy ? 'Uploading poster…' : fight && (uploadedPosters[id] || fight.fightPosterImage) ? 'Poster saved for this fight. Choose another image to replace it.' : fight ? 'No poster uploaded for this fight yet.' : 'Choose an open fight to enable upload.'}</small>
      {uploadError && <p role="alert" className={styles.uploadError}>{uploadError}</p>}
    </div>
    {loading ? <p>Loading fights…</p> : !fight ? <p>No fights are open for entry right now. Publish one in the Fight Registry first.</p> : <>
      <div className={styles.layout}>
        <div className={styles.preview}>{poster ? <img src={poster} alt={`Social fight poster for ${title}`} style={{ width: '100%', maxHeight: 470, objectFit: 'contain' }} /> : posterError ? <p role="alert">{posterError}</p> : <p>Preparing the fight poster…</p>}<h3>{title}</h3><p>{formatFightDate(fight)}</p><Link href={`/fight/${encodeURIComponent(id)}?play=1`} target="_blank">Check player page ↗</Link></div>
        <div className={styles.share}><strong>Owner fight link</strong><input readOnly value={url} aria-label="Owner fight link" onFocus={(e) => e.target.select()} /><div className={styles.buttons}><button type="button" onClick={() => copy(url, 'Fight link')}>Copy link</button><button type="button" onClick={downloadPoster} disabled={busy}>{busy ? 'Preparing image…' : 'Download social poster PNG'}</button><ShareQrCode url={url} label="Fight" fileName={`fight-${id}`} /></div><small>The poster uses this owner link. Affiliate posters use each affiliate’s own tracked link and QR in their personal kit. Include a clickable link in Facebook and X posts too.</small></div>
      </div>
      <div className={styles.templates}>{[['Facebook', facebook], ['Instagram', instagram], ['TikTok', tiktok], ['X', xPost]].map(([name, value]) => <article key={name}><div><h3>{name} post</h3><button type="button" onClick={() => copy(value, `${name} post`)}>Copy post</button></div><textarea aria-label={`${name} post`} readOnly value={value} rows={5} onFocus={(e) => e.target.select()} /></article>)}</div>
      <div className={styles.affiliate}><div><strong>Send personal social posters to affiliates</strong><p>Each approved affiliate gets a ready-to-post kit with this fight design, their own tracked QR and link, and Facebook, Instagram, TikTok, and X captions. Review recipients before sending.</p></div><Link href={{ pathname: '/administration/AffiliateUsers', query: { launchFight: id, launchTitle: title } }}>Prepare affiliate alerts →</Link></div>
      <details className={styles.message}><summary>Preview affiliate message</summary><pre>{affiliateText}</pre></details>
    </>}
  </section>;
}
