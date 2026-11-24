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

export const getAffiliateCampaignShareUrl = (affiliate, fight) => {
  const affiliateId = affiliate?._id || affiliate?.id;
  const fightId = fight?._id || fight?.id || fight?.matchId;
  if (!affiliateId || !fightId) return '';

  const source = String(fight.sourceType || fight.affiliatePromotion?.sourceType || fight.matchType || '');
  if (/shadow/i.test(source)) {
    const name = [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || affiliate.playerName || '';
    return `https://fantasymmadness.com/shadow/${encodeURIComponent(fight.matchName || 'fight')}/${encodeURIComponent(name)}`;
  }
  return getAffiliateFightShareUrl(affiliate, fightId);
};
