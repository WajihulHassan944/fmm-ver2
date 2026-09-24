import React, { useState } from 'react';
import QRCode from 'qrcode';
import { FaDownload, FaQrcode } from 'react-icons/fa';
import styles from './ShareQrCode.module.css';

const safeFileName = (value) => String(value || 'fantasy-mmadness-link').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);

export default function ShareQrCode({ url, label = 'Share link', fileName = 'fantasy-mmadness-link' }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const show = async () => {
    if (!url || loading) return;
    if (open) { setOpen(false); return; }
    setLoading(true);
    setError('');
    try {
      // Encode the exact link already given to this promoter, including its
      // referral code and fight/card path. Never rebuild a generic link here.
      setImage(await QRCode.toDataURL(url, {
        width: 900, margin: 4, errorCorrectionLevel: 'M',
        color: { dark: '#101820ff', light: '#ffffffff' },
      }));
      setOpen(true);
    } catch (_error) { setError('Could not create this QR code. Copy the link instead.'); }
    finally { setLoading(false); }
  };

  return <div className={styles.root}>
    <button type="button" className={styles.toggle} onClick={show} disabled={!url || loading} aria-expanded={open}>
      <FaQrcode aria-hidden="true" /> {loading ? 'Creating QR…' : open ? 'Hide QR' : 'Show QR'}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {open && image && <div className={styles.panel}>
      <strong>{label} QR code</strong>
      <img src={image} alt={`QR code for ${label}: ${url}`} width="220" height="220" />
      <p>Fans can scan this to open your link. Test it before printing.</p>
      <a href={image} download={`${safeFileName(fileName)}.png`} className={styles.download}><FaDownload aria-hidden="true" /> Download PNG</a>
    </div>}
  </div>;
}
