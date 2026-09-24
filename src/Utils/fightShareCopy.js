// Keep email copy and the affiliate's live share kit identical.
export const affiliateFightPosts = (title, link) => {
  const name = String(title || 'this fight').trim();
  const shortName = name.slice(0, 65);
  const disclosure = 'I’m a FANTASY MMADNESS affiliate and may earn from eligible entries through my link.';
  return {
    facebook: `${disclosure}\n\nThink you know ${name}? Predict the action with me: ${link}\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    instagram: `${disclosure}\n\nPredict ${name} with me. Scan my QR in this post or use my fight link in bio.\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    tiktok: `${disclosure}\n\nThink you can predict ${name}? Make your picks, score points, and climb the board. Scan my QR on the fight poster or use my tracked link in bio.\n\n#FANTASYMMADNESS #FightTok #CombatSports #FightNight`,
    x: `${disclosure} Predict ${shortName} with me: ${link} #FANTASYMMADNESS`,
  };
};
