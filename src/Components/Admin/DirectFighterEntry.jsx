import React from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import OptimizedImage from '@/Components/Common/OptimizedImage';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.webp';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.webp';

const DirectFighterEntry = ({ side, name, image, preview, onNameChange, onImageChange, disabled = false }) => (
  <section className="admin-direct-fighter-card" aria-label={`Create Fighter ${side} with a photo`}>
    <div className="admin-direct-fighter-heading">
      <span>New fighter {side}</span>
      <small>Not in the library? Add them here.</small>
    </div>
    <div className="admin-direct-fighter-fields">
      <input disabled={disabled} type="text" aria-label={`Fighter ${side} name`} placeholder={`Fighter ${side} name`} value={name} onChange={(event) => onNameChange(event.target.value)} />
      <label className={`admin-direct-fighter-upload ${image ? 'has-image' : ''}`}>
        <OptimizedImage src={image ? preview : (side === 'A' ? FALLBACK_A : FALLBACK_B)} fallbackSrc={side === 'A' ? FALLBACK_A : FALLBACK_B} alt={image ? `${name || `Fighter ${side}`} upload preview` : ''} width={54} height={54} sizes="54px" />
        <span>
          <strong><FaCloudUploadAlt /> {image ? 'Change picture' : 'Upload fighter picture'}</strong>
          <small>{image?.name || 'JPG, PNG or WEBP'}</small>
        </span>
        <input disabled={disabled} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageChange(event.target.files?.[0] || null)} />
      </label>
    </div>
    <small className="admin-direct-fighter-note">The fighter and original picture will be saved to the fighter library when this fight is published.</small>
  </section>
);

export default DirectFighterEntry;
