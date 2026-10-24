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
  // The id travels as ?ref=, not ?affiliateId=: the page route is
  // /league/[affiliateId], and on Vercel that path segment overwrites a query
  // parameter of the same name, so ?affiliateId= never reached the page.
  return `https://www.fantasymmadness.com/league/${encodeURIComponent(name)}?ref=${encodeURIComponent(id)}&fightId=${encodeURIComponent(fightId)}`;
};
