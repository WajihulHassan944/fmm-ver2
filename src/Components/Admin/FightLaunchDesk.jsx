import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { formatFightDate, getFightId, getFighterImage, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import ShareQrCode from '@/Components/Common/ShareQrCode';
import styles from './FightLaunchDesk.module.css';

const titleFor = (fight) => `${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`;
const getOpenFights = (rows) => (Array.isArray(rows) ? rows : []).filter((fight) => {
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : parseFightDate(fight)?.getTime();
  return getFightId(fight) && lock > Date.now() && fight.entryOpen !== false
    && !/draft|closed|finished|complete|cancel/.test(String(fight.matchStatus || fight.status || '').toLowerCase());
}).sort((a, b) => (parseFightDate(a)?.getTime() || 0) - (parseFightDate(b)?.getTime() || 0));

const drawImage = (src) => new Promise((resolve) => {
  if (!src) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

export default function FightLaunchDesk() {
  const [fights, setFights] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = useMemo(() => getOpenFights(fights), [fights]);
  const fight = open.find((row) => String(getFightId(row)) === selected) || open[0];
  const id = fight ? String(getFightId(fight)) : '';
  const url = id ? `https://www.fantasymmadness.com/fight/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=social&utm_campaign=fight_launch` : '';
  const title = fight ? titleFor(fight) : '';
  const facebook = `Think you know ${title}? Predict the action, score points, and climb the FANTASY MMADNESS leaderboard. Play this fight: ${url}\n\nKnow a fight fan? Send this to them. #FantasyMMadness #CombatSports`;
  const instagram = `Think you know ${title}? Predict the action. Score points. Climb the leaderboard.\n\nScan the QR in this post or visit FANTASYMMADNESS.COM to play.\n\n#FantasyMMadness #FightNight #CombatSports`;
  const xPost = `Think you know ${title}? Predict the action and climb the FANTASY MMADNESS leaderboard. Play: ${url}`;
  const affiliateText = `Hello {firstName},\n\n${title} is open on FANTASY MMADNESS. Share this fight with your audience using YOUR OWN affiliate fight link and QR code from your account so eligible player activity is attributed to you.\n\nFight page: ${url}\n\nLog in to your affiliate account to get your tracked share link. When posting, tell your audience you may earn a commission.\n\nFANTASY MMADNESS`;

  useEffect(() => {
    let live = true;
    fetchPublicPredictionFights({ limit: 240, hydrateImages: false })
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
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
      bg.addColorStop(0, '#121522'); bg.addColorStop(1, '#3b163e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1350);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffb834';
      ctx.font = 'bold 63px Impact, sans-serif'; ctx.fillText('FANTASY MMADNESS', 540, 105);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 42px Arial, sans-serif'; ctx.fillText('PREDICT THE FIGHT', 540, 175);
      const fighters = await Promise.all(['A', 'B'].map((side) => drawImage(getFighterImage(fight, side))));
      fighters.forEach((img, index) => {
        if (!img) return;
        const x = index ? 565 : 50;
        const scale = Math.min(465 / img.width, 550 / img.height);
        const w = img.width * scale; const h = img.height * scale;
        ctx.drawImage(img, x + (465 - w) / 2, 245 + 550 - h, w, h);
      });
      ctx.fillStyle = '#16151f'; ctx.fillRect(0, 795, 1080, 555);
      ctx.fillStyle = '#ffb834'; ctx.font = 'bold 54px Impact, sans-serif'; ctx.fillText('VS', 540, 850);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 35px Arial, sans-serif';
      ctx.fillText(getFighterName(fight, 'A').slice(0, 22), 275, 915);
      ctx.fillText(getFighterName(fight, 'B').slice(0, 22), 805, 915);
      ctx.fillStyle = '#ffb834'; ctx.font = '28px Arial, sans-serif';
      ctx.fillText(formatFightDate(fight).slice(0, 55), 540, 974);
      const qr = await drawImage(await QRCode.toDataURL(url, { width: 300, margin: 2 }));
      if (qr) ctx.drawImage(qr, 415, 1002, 250, 250);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('SCAN TO PLAY  •  FANTASYMMADNESS.COM', 540, 1300);
      const a = document.createElement('a');
      a.download = `fantasy-mmadness-fight-${id}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
      toast.success('Fight post image downloaded.');
    } catch (_err) { toast.error('Could not save the post image. Download the QR separately and copy the link.'); }
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
        <div className={styles.preview}><div className={styles.photos}><img src={getFighterImage(fight, 'A')} alt={getFighterName(fight, 'A')} /><strong>VS</strong><img src={getFighterImage(fight, 'B')} alt={getFighterName(fight, 'B')} /></div><h3>{title}</h3><p>{formatFightDate(fight)}</p><Link href={`/fight/${encodeURIComponent(id)}?play=1`} target="_blank">Check player page ↗</Link></div>
        <div className={styles.share}><strong>Owner fight link</strong><input readOnly value={url} aria-label="Owner fight link" onFocus={(e) => e.target.select()} /><div className={styles.buttons}><button type="button" onClick={() => copy(url, 'Fight link')}>Copy link</button><button type="button" onClick={downloadPoster} disabled={busy}>{busy ? 'Preparing image…' : 'Download fight post PNG'}</button><ShareQrCode url={url} label="Fight" fileName={`fight-${id}`} /></div><small>The post image includes a QR code. Put the clickable link in Facebook and X posts too; fans on a phone may not be able to scan a QR on that same screen.</small></div>
      </div>
      <div className={styles.templates}>{[['Facebook', facebook], ['Instagram', instagram], ['X', xPost]].map(([name, value]) => <article key={name}><div><h3>{name} post</h3><button type="button" onClick={() => copy(value, `${name} post`)}>Copy post</button></div><textarea aria-label={`${name} post`} readOnly value={value} rows={5} onFocus={(e) => e.target.select()} /></article>)}</div>
      <div className={styles.affiliate}><div><strong>Invite existing affiliates to share</strong><p>The email tool will prefill this fight’s message and select approved affiliates with email addresses. Review recipients and wording before sending. Each affiliate must use their own tracked link.</p></div><Link href={{ pathname: '/administration/AffiliateUsers', query: { launchFight: id, launchTitle: title } }}>Prepare affiliate email →</Link></div>
      <details className={styles.message}><summary>Preview affiliate message</summary><pre>{affiliateText}</pre></details>
    </>}
  </section>;
}
