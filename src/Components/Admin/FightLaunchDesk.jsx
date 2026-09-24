import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { fetchPublicPredictionFights, PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';
import { formatFightDate, getFightId, getFighterImage, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import { buildFightSocialPoster, saveFightSocialPoster } from '@/Utils/fightSocialPoster';
import styles from './FightLaunchDesk.module.css';

const titleFor = (fight) => `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`;
const getOpenFights = (rows) => (Array.isArray(rows) ? rows : []).filter((fight) => {
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : parseFightDate(fight)?.getTime();
  return getFightId(fight) && lock > Date.now() && fight.entryOpen !== false
    && !/draft|closed|finished|complete|cancel/.test(String(fight.matchStatus || fight.status || '').toLowerCase());
}).sort((a, b) => (parseFightDate(a)?.getTime() || 0) - (parseFightDate(b)?.getTime() || 0));

export default function FightLaunchDesk() {
  const [fights, setFights] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [poster, setPoster] = useState('');
  const [posterError, setPosterError] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadedPosters, setUploadedPosters] = useState({});
  const open = useMemo(() => getOpenFights(fights), [fights]);
  const fight = open.find((row) => String(getFightId(row)) === selected) || open[0];
  const id = fight ? String(getFightId(fight)) : '';
  const url = id ? `https://www.fantasymmadness.com/fight/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=social&utm_campaign=fight_launch` : '';
  const title = fight ? titleFor(fight) : '';
  const facebook = `Think you know ${title}? Predict the action, score points, and climb the FANTASY MMADNESS leaderboard. Play this fight: ${url}\n\nKnow a fight fan? Send this to them. #FantasyMMadness #CombatSports`;
  const instagram = `Think you know ${title}? Predict the action. Score points. Climb the leaderboard.\n\nScan the QR in this post or visit FANTASYMMADNESS.COM to play.\n\n#FantasyMMadness #FightNight #CombatSports`;
  const tiktok = `Think you can predict ${title}? Make your picks, score points, and climb the board. Scan the QR on this fight poster or visit FANTASYMMADNESS.COM to play.\n\n#FANTASYMMADNESS #FightTok #CombatSports #FightNight`;
  const xPost = `Think you know ${title.slice(0, 65)}? Predict the action with FANTASY MMADNESS. Play: ${url} #FANTASYMMADNESS`;
  const affiliateText = `Hello {firstName},\n\n${title} is open on FANTASY MMADNESS. The owner has already set up the fight and its economics. Open your personal kit to download the social poster with your tracked QR, then share it with your ready-made Facebook, Instagram, TikTok, or X caption. Your tracked paid entries share 50% of FANTASY MMADNESS platform proceeds under the existing affiliate split. Review your recipients before sending.`;

  useEffect(() => {
    if (!fight || !url) { setPoster(''); return; }
    let active = true;
    setPoster('');
    setPosterError('');
    buildFightSocialPoster({ fighterA: getFighterName(fight, 'A'), fighterB: getFighterName(fight, 'B'),
      fighterAImage: getFighterImage(fight, 'A'), fighterBImage: getFighterImage(fight, 'B'),
      basePoster: uploadedPosters[id] || fight.fightPosterImage, sport: fight.matchCategoryTwo || fight.matchCategory, event: fight.matchName,
      date: formatFightDate(fight), url })
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
    try {
      const body = new FormData(); body.append('poster', file);
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/fights/${encodeURIComponent(id)}/social-poster`, { method: 'POST', headers: adminHeaders(), body });
      const result = await response.json();
      if (!response.ok || !result.poster) throw new Error(result.message || 'Could not upload the poster.');
      setUploadedPosters((current) => ({ ...current, [id]: result.poster }));
      toast.success('Poster saved. Each affiliate kit will add its own tracked QR.');
    } catch (error) { toast.error(error.message); }
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
        date: formatFightDate(fight), url });
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
    {loading ? <p>Loading fights…</p> : !fight ? <p>No fights are open for entry right now. Publish one in the Fight Registry first.</p> : <>
      <div className={styles.layout}>
        <div className={styles.preview}>{poster ? <img src={poster} alt={`Social fight poster for ${title}`} style={{ width: '100%', maxHeight: 470, objectFit: 'contain' }} /> : posterError ? <p role="alert">{posterError}</p> : <p>Preparing the fight poster…</p>}<h3>{title}</h3><p>{formatFightDate(fight)}</p><Link href={`/fight/${encodeURIComponent(id)}?play=1`} target="_blank">Check player page ↗</Link><label style={{ display: 'block', marginTop: 16 }}>Upload your finished poster for this fight<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadBusy} onChange={(e) => { uploadPoster(e.target.files?.[0]); e.target.value = ''; }} /></label><small>{uploadBusy ? 'Uploading poster…' : 'Your artwork is saved to this fight. Each affiliate receives a version with their own link and QR code.'}</small></div>
        <div className={styles.share}><strong>Owner fight link</strong><input readOnly value={url} aria-label="Owner fight link" onFocus={(e) => e.target.select()} /><div className={styles.buttons}><button type="button" onClick={() => copy(url, 'Fight link')}>Copy link</button><button type="button" onClick={downloadPoster} disabled={busy}>{busy ? 'Preparing image…' : 'Download social poster PNG'}</button><ShareQrCode url={url} label="Fight" fileName={`fight-${id}`} /></div><small>The poster uses this owner link. Affiliate posters use each affiliate’s own tracked link and QR in their personal kit. Include a clickable link in Facebook and X posts too.</small></div>
      </div>
      <div className={styles.templates}>{[['Facebook', facebook], ['Instagram', instagram], ['TikTok', tiktok], ['X', xPost]].map(([name, value]) => <article key={name}><div><h3>{name} post</h3><button type="button" onClick={() => copy(value, `${name} post`)}>Copy post</button></div><textarea aria-label={`${name} post`} readOnly value={value} rows={5} onFocus={(e) => e.target.select()} /></article>)}</div>
      <div className={styles.affiliate}><div><strong>Send personal social posters to affiliates</strong><p>Each approved affiliate gets a ready-to-post kit with this fight design, their own tracked QR and link, and Facebook, Instagram, TikTok, and X captions. Review recipients before sending.</p></div><Link href={{ pathname: '/administration/AffiliateUsers', query: { launchFight: id, launchTitle: title } }}>Prepare affiliate alerts →</Link></div>
      <details className={styles.message}><summary>Preview affiliate message</summary><pre>{affiliateText}</pre></details>
    </>}
  </section>;
}
