import React, { useState } from 'react';
import { affiliatePosterPreviewUrl } from '@/Utils/affiliatePosterPreview.cjs';
import styles from './AffiliateEmailModal.module.css';

function PosterImage({ url }) {
  const [status, setStatus] = useState('loading');
  return <>
    {status === 'loading' && <p role="status">Loading this affiliate’s poster…</p>}
    {status === 'error' && <p role="alert">The poster could not be loaded. Check the saved artwork before sending.</p>}
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open affiliate poster full size" hidden={status === 'error'}>
      <img src={url} alt="Fight poster with the selected affiliate’s tracked QR code" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} className={styles.previewPoster} />
    </a>
  </>;
}

export default function AffiliateEmailPreview({ recipients, fightId, artwork, messageFor }) {
  const [selectedId, setSelectedId] = useState('');
  const recipient = recipients.find(item => item._id === selectedId) || recipients[0];
  if (!recipient) return null;
  const imageUrl = affiliatePosterPreviewUrl(fightId, recipient._id, artwork);
  return <details className="admin-bulk-email-note" data-testid="affiliate-email-preview">
    <summary>Preview affiliate message and poster</summary>
    <label>Preview recipient
      <select value={recipient._id} onChange={event => setSelectedId(event.target.value)} aria-label="Preview recipient">
        {recipients.map(item => <option key={item._id} value={item._id}>{[item.firstName, item.lastName].filter(Boolean).join(' ') || 'Affiliate'} · {item.email}</option>)}
      </select>
    </label>
    <pre className={styles.previewMessage}>{messageFor(recipient)}</pre>
    <h4>Poster in this affiliate’s share kit</h4>
    <p>The email includes a share-kit link. The poster shown here is available in that kit; it is not an email attachment.</p>
    {!artwork ? <p role="status">No saved fight poster was found. Upload your finished artwork above before checking the poster preview.</p>
      : !imageUrl ? <p role="alert">A saved fight and affiliate are required to preview the correct poster.</p>
        : <PosterImage key={imageUrl} url={imageUrl} />}
  </details>;
}
