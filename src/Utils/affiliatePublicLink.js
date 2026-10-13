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
  return `https://www.fantasymmadness.com/league/${encodeURIComponent(name)}?affiliateId=${encodeURIComponent(id)}&fightId=${encodeURIComponent(fightId)}`;
};
