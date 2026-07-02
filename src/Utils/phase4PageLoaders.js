import { fetchPublicBlogs, fetchPublicFights, fetchPublicFighters, fetchPublicProWrestlingMatches, fetchPublicRelatedBlogs, fetchPublicWrestlers } from './publicApi';
import { getMatchSport, getSportConfigByKey, normalizeSlug } from './phase4SeoPages';

const jsonSafe = (value) => JSON.parse(JSON.stringify(value || null));

const matchesSportConfig = (fight = {}, config = {}) => {
  const aliases = [config.sport, config.slug, ...(Array.isArray(config.categoryAliases) ? config.categoryAliases : [])]
    .filter(Boolean)
    .map(normalizeSlug);
  const fightValues = [
    fight.matchCategoryTwo,
    fight.effectiveCategory,
    fight.displayCategory,
    fight.categoryLabel,
    fight.categorySlug,
    fight.effectiveCategorySlug,
    getMatchSport(fight),
    fight.matchCategory,
  ].filter(Boolean).map(normalizeSlug);
  return fightValues.some((value) => aliases.includes(value));
};

const filterFightsForSportConfig = (fights = [], config = {}, limit = 12) => {
  const rows = Array.isArray(fights) ? fights : [];
  const filtered = rows.filter((fight) => matchesSportConfig(fight, config));
  return (filtered.length ? filtered : rows).slice(0, limit);
};


export const getSportLandingServerProps = async (sportKey = 'mma', res) => {
  const config = getSportConfigByKey(sportKey);
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const [fights, blogPayload] = await Promise.all([
      sportKey === 'pro-wrestling'
        ? fetchPublicProWrestlingMatches({ limit: 12 })
        : fetchPublicFights({ sport: config.sport, category: config.sport, categorySlug: sportKey, limit: 100 }),
      fetchPublicBlogs({ category: config.sport, limit: 6 }),
    ]);
    return { props: { config: jsonSafe(config), fights: jsonSafe(sportKey === 'pro-wrestling' ? (fights || []) : filterFightsForSportConfig(fights, config, 24)), blogs: jsonSafe(blogPayload?.rows || []) } };
  } catch (error) {
    console.error(`Error loading ${sportKey} landing page:`, error);
    return { props: { config: jsonSafe(config), fights: [], blogs: [] } };
  }
};

export const getBlogCategoryProps = async (category, res) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const [blogPayload, fights] = await Promise.all([
      fetchPublicBlogs({ category, limit: 24 }),
      fetchPublicFights({ sport: category, category, limit: 8 }),
    ]);
    return { props: { category, blogs: jsonSafe(blogPayload?.rows || []), fights: jsonSafe(fights || []) } };
  } catch (error) {
    console.error(`Error loading blog category ${category}:`, error);
    return { props: { category, blogs: [], fights: [] } };
  }
};

export const getFighterRelatedProps = async (fighter, res) => {
  const name = fighter?.name || fighter?.fighterName || fighter?.wrestlerName || '';
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const [fights, blogs] = await Promise.all([
      fetchPublicFights({ search: name, limit: 12 }),
      fetchPublicRelatedBlogs({ search: name, limit: 6 }),
    ]);
    return { fights: jsonSafe(fights || []), blogs: jsonSafe(blogs || []) };
  } catch (error) {
    return { fights: [], blogs: [] };
  }
};

export const getDirectorySamples = async () => {
  const [fighters, wrestlers] = await Promise.allSettled([fetchPublicFighters({ limit: 12 }), fetchPublicWrestlers({ limit: 12 })]);
  return {
    fighters: fighters.status === 'fulfilled' ? jsonSafe(fighters.value || []) : [],
    wrestlers: wrestlers.status === 'fulfilled' ? jsonSafe(wrestlers.value || []) : [],
  };
};
