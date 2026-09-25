// Keep email copy and the affiliate's live share kit identical.
export const affiliateFightPosts = (title, link, league = 'my league', prize = 0, entryCoins = 0) => {
  const name = String(title || 'this fight').trim();
  const disclosure = 'I’m a FANTASY MMADNESS affiliate and may earn from eligible entries through my link.';
  const reward = Number(prize) > 0
    ? `${Number(prize).toLocaleString()} FM COINS PRIZE POOL\n${Number(entryCoins) > 0 ? 'Eligible cash winnings may also apply.' : 'Compete for other rewards, too.'}`
    : 'Compete for available prizes and bragging rights.';
  const invitation = `I’m inviting you to join ${league} on FANTASY MMADNESS for ${name}. Make your picks before the fight and see how you stack up against other fans.\n\n${reward}\n\nOpen my league link for entry details, eligibility, and prize rules.`;
  // Give Facebook a fresh preview URL after the fight-specific artwork update.
  // The existing ref parameter remains intact for affiliate attribution.
  const facebookLink = `${link}${link.includes('?') ? '&' : '?'}share=affiliate-qr-7`;
  const xPrefix = `Join ${String(league).slice(0, 30)} for `;
  const xPrize = Number(prize) > 0 ? ` ${Number(prize).toLocaleString()} FM COINS PRIZE POOL${Number(entryCoins) > 0 ? ' + eligible cash winnings' : ''}.` : ' Compete for prizes where eligible.';
  const xSuffix = `.${xPrize} ${link} Affiliate link; I may earn from entries.`;
  return {
    facebook: `${invitation}\n\nJoin my league through my personal fight link: ${facebookLink}\n\n${disclosure}\n#FANTASYMMADNESS #FightNight`,
    instagram: `${invitation}\n\nJOIN MY LEAGUE: ${link}\nScan my personal QR on the poster to open this link.\n\n${disclosure}\n#FANTASYMMADNESS #FightNight`,
    tiktok: `${invitation}\n\nJOIN MY LEAGUE: ${link}\nScan my personal QR to join and play with me.\n\n${disclosure}\n#FANTASYMMADNESS #FightTok`,
    x: `${xPrefix}${name.slice(0, Math.max(0, 280 - xPrefix.length - xSuffix.length))}${xSuffix}`,
  };
};
