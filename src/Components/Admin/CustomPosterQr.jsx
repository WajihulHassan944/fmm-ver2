import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import {
  buildCustomPosterWithQr, clampQrBox, defaultQrBox, downloadBlob, loadPosterFile, loadSavedQrBox,
  makeZip, posterFileSlug, qrBoxScansWell, saveQrBox,
} from '@/Utils/customPosterQr';
import styles from './CustomPosterQr.module.css';

// Optional "CUSTOM POSTER + QR" tool for the Fight Launch Desk. The owner
// uploads a finished poster (kept in this browser only), drags/resizes the QR
// square onto blank space, and gets one copy per affiliate with that
// affiliate's tracked league link as the QR. Nothing else on the desk changes.

const affiliateName = (row) => {
  const name = [row.firstName, row.lastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
  const handle = String(row.playerName || '').trim();
  return name && handle && handle.toLowerCase() !== name.toLowerCase() ? `${name} (${handle})` : name || handle || 'Affiliate';
};
const rowsFrom = (payload) => (Array.isArray(payload) ? payload : payload?.affiliates || payload?.items || payload?.data || []);

export default function CustomPosterQr({ fightId, fightTitle }) {
  const [poster, setPoster] = useState(null);
  const [box, setBox] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [listError, setListError] = useState('');
  const [choice, setChoice] = useState('all');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const frame = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    let live = true;
    fetch(buildPublicApiUrl('/api/public/affiliates', { limit: 200 }))
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load affiliates (HTTP ${response.status}).`);
        const rows = rowsFrom(await response.json())
          .filter((row) => row && /^[a-f\d]{24}$/i.test(String(row._id || row.id || '')))
          .sort((a, b) => affiliateName(a).localeCompare(affiliateName(b)));
        if (live) setAffiliates(rows);
      })
      .catch((err) => { if (live) setListError(err.message || 'Could not load affiliates.'); });
    return () => { live = false; };
  }, []);

  // A new fight or a new poster clears earlier copies.
  useEffect(() => { setResults([]); }, [fightId, poster]);
  useEffect(() => () => { if (poster?.url) URL.revokeObjectURL(poster.url); }, [poster]);
  useEffect(() => () => results.forEach((item) => URL.revokeObjectURL(item.preview)), [results]);
  useEffect(() => {
    if (!poster) return;
    setBox(loadSavedQrBox(fightId, poster.width, poster.height) || defaultQrBox(poster.width, poster.height));
  }, [fightId, poster]);

  const choose = async (file) => {
    try { setPoster(await loadPosterFile(file)); }
    catch (err) { toast.error(err.message); }
  };

  const startDrag = (mode) => (event) => {
    if (!box || !frame.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { mode, x: event.clientX, y: event.clientY, box };
  };
  const moveDrag = (event) => {
    const state = drag.current;
    if (!state || !frame.current || !poster) return;
    const rect = frame.current.getBoundingClientRect();
    const dx = (event.clientX - state.x) / rect.width;
    const dy = (event.clientY - state.y) / rect.height;
    const next = state.mode === 'move'
      ? { ...state.box, x: state.box.x + dx, y: state.box.y + dy }
      : { ...state.box, size: state.box.size + Math.max(dx, (dy * rect.height) / rect.width) };
    setBox(clampQrBox(next, poster.width, poster.height));
  };
  const endDrag = () => { drag.current = null; };
  // Clicking blank space moves the square there.
  const placeAt = (event) => {
    if (!box || !frame.current || !poster) return;
    const rect = frame.current.getBoundingClientRect();
    const cx = (event.clientX - rect.left) / rect.width;
    const cy = (event.clientY - rect.top) / rect.height;
    const half = box.size / 2;
    setBox(clampQrBox({ ...box, x: cx - half, y: cy - (half * poster.width) / poster.height }, poster.width, poster.height));
  };

  const sizePx = poster && box ? Math.round(box.size * poster.width) : 0;
  const targets = useMemo(() => (choice === 'all' ? affiliates : affiliates.filter((row) => String(row._id || row.id) === choice)), [choice, affiliates]);

  const savePosition = () => {
    if (!poster || !box) return;
    if (saveQrBox(fightId, poster.width, poster.height, box)) toast.success('QR position saved for this fight poster.');
    else toast.error('This browser would not save the position.');
  };

  const generate = async () => {
    if (!poster || !box || !targets.length || busy) return;
    setBusy(true);
    saveQrBox(fightId, poster.width, poster.height, box);
    try {
      const made = [];
      for (const row of targets) {
        const url = getAffiliateFightShareUrl(row, fightId);
        // eslint-disable-next-line no-await-in-loop
        const blob = await buildCustomPosterWithQr({ image: poster.image, width: poster.width, height: poster.height, box, url });
        made.push({ id: String(row._id || row.id), name: affiliateName(row), url, blob, preview: URL.createObjectURL(blob),
          fileName: `${posterFileSlug(fightTitle)}-${posterFileSlug([row.firstName, row.lastName].filter(Boolean).join(' ') || row.playerName)}-qr.png` });
      }
      setResults(made);
      toast.success(`${made.length} poster${made.length === 1 ? '' : 's'} ready.`);
    } catch (err) { toast.error(err.message || 'Could not make the posters.'); }
    finally { setBusy(false); }
  };

  const downloadAll = async () => {
    if (!results.length) return;
    if (results.length === 1) { downloadBlob(results[0].blob, results[0].fileName); return; }
    const files = await Promise.all(results.map(async (item) => ({ name: item.fileName, bytes: new Uint8Array(await item.blob.arrayBuffer()) })));
    downloadBlob(new Blob([makeZip(files)], { type: 'application/zip' }), `${posterFileSlug(fightTitle)}-affiliate-posters.zip`);
  };

  return <div className={styles.panel} aria-label="Custom poster and affiliate QR">
    <h3>Custom poster + QR</h3>
    <p>Upload your finished poster, drag the square onto blank space (drag the corner to resize), then make copies with each affiliate&apos;s own QR. Your artwork is not changed anywhere else.</p>
    <label className={styles.file}>Poster (PNG or JPG)
      <input type="file" accept="image/png,image/jpeg" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
    </label>
    {poster && box && <>
      <div className={styles.stage}>
        <div ref={frame} className={styles.frame} onPointerDown={placeAt} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <img src={poster.url} alt="Your poster" draggable={false} />
          <div className={styles.qrBox} style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.size * 100}%`, aspectRatio: '1 / 1' }}
            onPointerDown={startDrag('move')} role="slider" aria-label="QR position" aria-valuetext={`${sizePx} pixels`}>
            <span>QR</span>
            <i className={styles.handle} onPointerDown={startDrag('resize')} aria-label="Resize QR" />
          </div>
        </div>
      </div>
      <p className={styles.meta}>{poster.name} · {poster.width}×{poster.height} · QR {sizePx}×{sizePx}px
        {!qrBoxScansWell(box, poster.width, poster.height) && <strong> · Make the square bigger (about 1/4 of the poster&apos;s width) so phones can scan it easily.</strong>}</p>
      <div className={styles.row}>
        <button type="button" onClick={savePosition}>Save QR position</button>
        <label>Affiliate
          <select value={choice} onChange={(e) => setChoice(e.target.value)} disabled={!affiliates.length}>
            <option value="all">All affiliates ({affiliates.length})</option>
            {affiliates.map((row) => <option key={row._id || row.id} value={row._id || row.id}>{affiliateName(row)}</option>)}
          </select>
        </label>
        <button type="button" onClick={generate} disabled={busy || !targets.length}>{busy ? 'Making posters…' : 'Make posters'}</button>
        {results.length > 0 && <button type="button" onClick={downloadAll}>{results.length > 1 ? `Download all (${results.length}, .zip)` : 'Download'}</button>}
      </div>
      {listError && <p role="alert">{listError}</p>}
      {results.length > 0 && <ul className={styles.results}>
        {results.map((item) => <li key={item.id}>
          <img src={item.preview} alt={`Poster for ${item.name}`} />
          <div><strong>{item.name}</strong><small>{item.url}</small></div>
          <button type="button" onClick={() => downloadBlob(item.blob, item.fileName)}>Download</button>
        </li>)}
      </ul>}
    </>}
  </div>;
}
