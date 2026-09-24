// Keep email copy and the affiliate's live share kit identical.
export const affiliateFightPosts = (title, link) => {
  const name = String(title || 'this fight').trim();
  const shortName = name.slice(0, 65);
  const disclosure = 'I’m a FANTASY MMADNESS affiliate and may earn from eligible entries through my link.';
  return {
    facebook: `${disclosure}\n\nThink you know ${name}? Predict the action with me: ${link}\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    instagram: `${disclosure}\n\nPredict ${name} with me. Scan my QR in this post or use my fight link in bio.\n\n#FANTASYMMADNESS #CombatSports #FightNight`,
    x: `${disclosure} Predict ${shortName} with me: ${link} #FANTASYMMADNESS`,
  };
};
