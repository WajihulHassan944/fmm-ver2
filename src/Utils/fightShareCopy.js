// Keep email copy and the affiliate's live share kit identical.
export const affiliateFightPosts = (title, link, league = 'my league', prize = 0) => {
  const name = String(title || 'this fight').trim();
  const shortName = name.slice(0, 65);
  const disclosure = 'I’m a FANTASY MMADNESS affiliate and may earn from eligible entries through my link.';
  const invitation = `Join ${league} for ${name}. Predict what happens round by round, score points, and climb our leaderboard.${Number(prize) > 0 ? ` This fight has a ${Number(prize).toLocaleString()} FM prize pool.` : ''} Check the fight page for entry details and prize rules.`;
  return {
    facebook: `${disclosure}\n\n${invitation}\n\nJoin here: ${link}\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    instagram: `${disclosure}\n\n${invitation}\n\nScan my QR on the poster to join. Fight link in bio.\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    tiktok: `${disclosure}\n\n${invitation}\n\nScan my QR on the poster to join the league.\n\n#FANTASYMMADNESS #FightTok #CombatSports`,
    x: `${disclosure} Join ${league} for ${shortName}. Predict rounds, score points${Number(prize) > 0 ? `, compete for ${Number(prize).toLocaleString()} FM` : ''}. ${link} #FANTASYMMADNESS`,
  };
};
