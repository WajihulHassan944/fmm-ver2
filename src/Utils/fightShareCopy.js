// Keep email copy and the affiliate's live share kit identical.
export const fighterNameHashtags = (fighterA, fighterB, title = '') => {
  const pair = String(title).split(/\s+(?:vs\.?|versus|v\.)\s+/i);
  const names = [fighterA || (pair.length > 1 ? pair[0] : ''), fighterB || (pair.length > 1 ? pair[1] : '')];
  return [...new Set(names.map((name) => String(name || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/).filter(Boolean)
    .map((word) => word[0].toUpperCase() + (word === word.toUpperCase() ? word.slice(1).toLowerCase() : word.slice(1)))
    .join('').slice(0, 32)).filter((name) => name.length >= 2).map((name) => `#${name}`))];
};

export const affiliateFightPosts = (title, link, league = 'my league', prize = 0, entryCoins = 0, fighterA = '', fighterB = '') => {
  const name = String(title || 'this fight').trim();
  const fighterTags = fighterNameHashtags(fighterA, fighterB, name).join(' ');
  const hashtags = ['#FANTASYMMADNESS', '#FightNight', fighterTags].filter(Boolean).join(' ');
  const disclosure = 'I’m a FANTASY MMADNESS affiliate and may earn from eligible entries through my link.';
  const reward = Number(prize) > 0
    ? `🪙 ${Number(prize).toLocaleString()} FM COINS PRIZE POOL\n${Number(entryCoins) > 0 ? 'Eligible cash winnings may also apply.' : 'Compete for other rewards, too.'}`
    : 'Compete for available prizes and bragging rights.';
  const invitation = `I’m inviting you to join ${league} on FANTASY MMADNESS for ${name}. Make your picks before the fight and see how you stack up against other fans.\n\n${reward}\n\nOpen my league link for entry details, eligibility, and prize rules.`;
  // Give Facebook a fresh preview URL after the fight-specific artwork update.
  // The existing ref parameter remains intact for affiliate attribution.
  const facebookLink = `${link}${link.includes('?') ? '&' : '?'}share=affiliate-qr-13`;
  const xPrefix = `Join ${String(league).slice(0, 30)} for `;
  const xPrize = Number(prize) > 0 ? ` 🪙 ${Number(prize).toLocaleString()} FM COINS PRIZE POOL${Number(entryCoins) > 0 ? ' + eligible cash winnings' : ''}.` : ' Compete for prizes where eligible.';
  const xSuffix = `.${xPrize} ${link} Affiliate link; I may earn from entries.${fighterTags ? ` ${fighterTags}` : ''}`;
  return {
    facebook: `${invitation}\n\nJoin my league through my personal fight link: ${facebookLink}\n\n${disclosure}\n${hashtags}`,
    instagram: `${invitation}\n\nJOIN MY LEAGUE: ${link}\nScan my personal QR on the poster to open this link.\n\n${disclosure}\n${hashtags}`,
    tiktok: `${invitation}\n\nJOIN MY LEAGUE: ${link}\nScan my personal QR to join and play with me.\n\n${disclosure}\n#FANTASYMMADNESS #FightTok${fighterTags ? ` ${fighterTags}` : ''}`,
    x: `${xPrefix}${name.slice(0, Math.max(0, 280 - xPrefix.length - xSuffix.length))}${xSuffix}`,
  };
};
