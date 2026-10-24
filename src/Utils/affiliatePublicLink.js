export const getAffiliateNameSlug = (affiliate = {}) => {
  affiliate = affiliate || {};
  const fullName = [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ').trim();
  return String(fullName || affiliate.playerName || affiliate.affiliateName || affiliate.leagueName || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

export const getAffiliatePublicIdentifier = (affiliate = {}, affiliates = []) => {
  const id = String(affiliate._id || affiliate.id || '');
  const name = getAffiliateNameSlug(affiliate);
  if (!name) return id;
  const duplicate = affiliates.some((other) => String(other._id || other.id || '') !== id && getAffiliateNameSlug(other) === name);
  return duplicate && id ? name + '-' + id.slice(-6) : name;
};

export const getAffiliateFightShareUrl = (affiliate = {}, fightId = '') => {
  const id = String(affiliate?._id || affiliate?.id || '');
  const name = getAffiliateNameSlug(affiliate) || 'league';
  // TEMPORARY (approved by the owner on 2026-10-24, Issue #182): named league
  // links (/league/<name>?…) are rejected on production before the page runs,
  // so fight links, emails and poster QRs use the verified ID-style league link
  // until the named route is repaired. Attribution is unchanged: the affiliate
  // and fight ids are in the link. Restore the named form here once fixed.
  if (/^[a-f\d]{24}$/i.test(id)) return `https://www.fantasymmadness.com/league/${encodeURIComponent(id)}?fightId=${encodeURIComponent(fightId)}`;
  return `https://www.fantasymmadness.com/league/${encodeURIComponent(name)}?ref=${encodeURIComponent(id)}&fightId=${encodeURIComponent(fightId)}`;
};

/**
 * The affiliate's public league page: readable name plus the account id, so
 * two affiliates who share a name always get their own, correct page.
 */
export const getAffiliatePublicPageUrl = (affiliate = {}) => {
  const id = String(affiliate?._id || affiliate?.id || '');
  const name = getAffiliateNameSlug(affiliate) || id;
  if (!name) return '';
  return `https://www.fantasymmadness.com/affiliate/${encodeURIComponent(name)}${/^[a-f\d]{24}$/i.test(id) ? `?affiliateId=${encodeURIComponent(id)}` : ''}`;
};
