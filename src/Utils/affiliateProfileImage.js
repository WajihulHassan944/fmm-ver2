import { resolvePublicMediaUrl } from '@/Utils/publicApi';

export const AFFILIATE_LOGO = '/images/brand/fantasy-mmadness-main-logo-v23.jpg';

export const affiliateProfileImage = (value) => {
  const url = String(value || '').trim();
  if (!url) return AFFILIATE_LOGO;
  const filename = url.split(/[?#]/)[0].split('/').pop().toLowerCase();
  if (/^(?:avatar-placeholder|default-avatar|default-profile|profile-placeholder|user-placeholder)\./.test(filename)
    || (/logo|avatar|profile|icon/.test(filename) && /fantasy[-_]?mmadness|fantasymmadness|fmm[-_]/.test(filename))
    || /^(?:old[-_])?(?:fmm[-_])?logo(?:[-_.]|$)/.test(filename)) return AFFILIATE_LOGO;
  return resolvePublicMediaUrl(url) || AFFILIATE_LOGO;
};
