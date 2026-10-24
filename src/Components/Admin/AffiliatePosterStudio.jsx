import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { formatFightDate, getFallbackFighterImage, getFightId, getFighterImage, getFighterName } from '@/Utils/fightExperience';
import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import {
  buildAffiliateFightPoster, downloadPosterBlob, getAffiliateFirstName, posterFileName, POSTER_FORMATS,
} from '@/Utils/affiliateFightPoster';
import styles from './FightLaunchDesk.module.css';

// Issue #182: personalized affiliate posters inside the owner's Fight Launch
// Desk. The owner picks the fight (above) and an affiliate (here) and gets that
// affiliate's exact posters — no affiliate sign-in or impersonation. Only
// public affiliate fields are used: first/last name, player name and ID.

const affiliateLabel = (affiliate) => {
  const name = [affiliate.firstName, affiliate.lastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
  const handle = String(affiliate.playerName || '').trim();
  return name && handle && handle.toLowerCase() !== name.toLowerCase() ? `${name} (${handle})` : name || handle || 'Affiliate';
};

// The fighter's own registry photo only — never the generic stand-in image.
const registryFighterImage = (fight, side) => {
  const url = getFighterImage(fight, side);
  return url && url !== getFallbackFighterImage(side) ? url : '';
};

const readAffiliateRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.affiliates)) return payload.affiliates;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function AffiliatePosterStudio({ fight, artwork, fightPicker = null }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  const [format, setFormat] = useState('feed');
  const [posters, setPosters] = useState({});
  const [posterError, setPosterError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(buildPublicApiUrl('/api/public/affiliates', { limit: 200 }))
      .then(async (response) => {
        const text = await response.text();
        if (!response.ok) throw new Error(`Could not load affiliates (HTTP ${response.status}).`);
        let payload;
        try { payload = JSON.parse(text); } catch { throw new Error('The affiliate list came back in an unexpected format.'); }
        const rows = readAffiliateRows(payload)
          .filter((row) => row && /^[a-f\d]{24}$/i.test(String(row._id || row.id || '')))
          .sort((a, b) => affiliateLabel(a).localeCompare(affiliateLabel(b)));
        if (!live) return;
        setAffiliates(rows);
        setAffiliateId((current) => current || String(rows[0]?._id || rows[0]?.id || ''));
      })
      .catch((err) => { if (live) setLoadError(err.message || 'Could not load affiliates.'); });
    return () => { live = false; };
  }, []);

  const affiliate = useMemo(() => affiliates.find((row) => String(row._id || row.id) === affiliateId) || null, [affiliates, affiliateId]);
  const fightId = fight ? String(getFightId(fight)) : '';
  const link = affiliate && fightId ? getAffiliateFightShareUrl(affiliate, fightId) : '';
  const firstName = affiliate ? getAffiliateFirstName(affiliate) : '';
  // Everything comes from the Fight Registry record: artwork, both fighter
  // photos, event, date and venue (only when the record has one).
  const inputs = link ? JSON.stringify({
    link, artwork: artwork || '', firstName, fightId,
    a: registryFighterImage(fight, 'A'), b: registryFighterImage(fight, 'B'),
    venue: String(fight.venue || '').trim(),
  }) : '';

  useEffect(() => {
    if (!inputs) return;
    const settings = JSON.parse(inputs);
    let live = true;
    const urls = [];
    setPosters({});
    setPosterError('');
    Promise.all(Object.keys(POSTER_FORMATS).map((key) => buildAffiliateFightPoster({
      format: key, url: settings.link, affiliate, artUrl: settings.artwork,
      fighterAImage: settings.a, fighterBImage: settings.b,
      fighterA: getFighterName(fight, 'A'), fighterB: getFighterName(fight, 'B'),
      event: fight.matchName || '', venue: settings.venue,
      // Date only: a clock time would show in the viewer's own time zone with no label.
      date: formatFightDate(fight, { dateOnly: true }),
    }).then((result) => { const objectUrl = URL.createObjectURL(result.blob); urls.push(objectUrl); return [key, { ...result, objectUrl }]; })))
      .then((entries) => { if (live) setPosters(Object.fromEntries(entries)); })
      .catch((err) => { if (live) setPosterError(err.message || 'Could not make this poster. Check the fight artwork in the Fight Registry.'); });
    return () => { live = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [inputs]);

  const current = posters[format];
  const fileName = (key) => posterFileName({ format: key, firstName, fightId });
  const download = (key) => {
    const item = posters[key];
    if (!item) { toast.error('The poster is still being made.'); return; }
    downloadPosterBlob(item.blob, fileName(key));
    toast.success(`${firstName || 'Affiliate'} ${POSTER_FORMATS[key].label.toLowerCase()} poster saved (${item.width} × ${item.height}).`);
  };
  const copyImage = async () => {
    if (!current) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { toast.info('Use Download, or press and hold the poster to save it.'); return; }
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': current.blob })]); toast.success('Poster copied.'); }
    catch { toast.info('Use Download, or press and hold the poster to save it.'); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); toast.success('Tracked link copied.'); }
    catch { toast.error('Could not copy the link. Select it and copy manually.'); }
  };
  const share = async () => {
    if (!current || busy) return;
    const file = new File([current.blob], fileName(format), { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) { download(format); return; }
    setBusy(true);
    try { await navigator.share({ files: [file] }); }
    catch (err) { if (err?.name !== 'AbortError') toast.error('Could not open the share menu. Use Download instead.'); }
    finally { setBusy(false); }
  };

  return <div className={styles.posterStudio} aria-label="Affiliate posters">
    <div className={styles.posterControls}>
      {fightPicker}
      <label className={styles.picker}>Affiliate
        <select value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} disabled={!affiliates.length}>
          {affiliates.map((row) => <option key={row._id || row.id} value={row._id || row.id}>{affiliateLabel(row)}</option>)}
        </select>
      </label>
    </div>
    {loadError && <p role="alert">{loadError}</p>}
    {!loadError && !affiliates.length && <p>Loading affiliates…</p>}
    {affiliate && fight && <>
      <div className={styles.posterToolbar}>
        <div className={styles.posterTabs} role="group" aria-label="Poster size">
          {Object.values(POSTER_FORMATS).map((spec) => <button key={spec.key} type="button" aria-pressed={format === spec.key} className={format === spec.key ? styles.posterTabActive : ''} onClick={() => setFormat(spec.key)}>{spec.label} {spec.width}×{spec.height}</button>)}
        </div>
        <div className={styles.buttons}>
          <button type="button" disabled={!current} onClick={() => download(format)}>Download</button>
          <button type="button" disabled={!current} onClick={copyImage}>Copy</button>
          <button type="button" disabled={!current || busy} onClick={share}>{busy ? 'Opening…' : 'Share'}</button>
        </div>
      </div>
      <div className={styles.posterStage}>
        {current ? <img src={current.objectUrl} width={current.width} height={current.height} alt={`${current.cta} poster for ${getFighterName(fight, 'A')} vs ${getFighterName(fight, 'B')}`} data-poster-format={format} data-poster-link={link} />
          : posterError ? <p role="alert">{posterError}</p> : <p>Making {firstName ? `${firstName}'s` : 'the'} poster…</p>}
      </div>
      <div className={styles.posterLink}>
        <input readOnly value={link} aria-label="Affiliate tracked fight link" onFocus={(e) => e.target.select()} />
        <button type="button" onClick={copyLink}>Copy link</button>
      </div>
    </>}
  </div>;
}
