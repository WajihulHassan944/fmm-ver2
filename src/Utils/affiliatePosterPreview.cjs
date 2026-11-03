'use strict';
// Both the owner preview and recipient kit must address the same image/QR.
function affiliatePosterPreviewUrl(fightId, affiliateId, artwork = '') {
  if (![fightId, affiliateId].every(id => /^[a-f\d]{24}$/i.test(String(id || '')))) return '';
  let hash = 2166136261;
  for (const char of String(artwork || '')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `/api/fight-share-image?fightId=${encodeURIComponent(fightId)}&affiliateId=${encodeURIComponent(affiliateId)}&format=facebook&v=13&art=${hash.toString(16)}`;
}
module.exports = { affiliatePosterPreviewUrl };
