import dynamic from 'next/dynamic';
import React from 'react';

const Fighters = dynamic(
  () => import('@/Components/Home/Fighters'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const OurFighters = ({ fighters }) => {
  return <Fighters fighters={fighters} />;
};

export async function getServerSideProps() {
  try {
    const [matchesRes, shadowRes] = await Promise.all([
      fetch("https://fantasymmadness-game-server-three.vercel.app/match"),
      fetch("https://fantasymmadness-game-server-three.vercel.app/shadow"),
    ]);

    if (!matchesRes.ok || !shadowRes.ok) {
      throw new Error("Failed to fetch data.");
    }

    const matches = await matchesRes.json();
    const shadowFighters = await shadowRes.json();
    
    const fightersByName = new Map();
    const normalizeName = (value = '') => String(value || '').trim().replace(/\s+/g, ' ');
    const normalizeKey = (value = '') => normalizeName(value).toLowerCase();
    const hasImage = (value) => typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'null';

    const upsertFighter = ({ name, category, image, matchName }) => {
      const cleanName = normalizeName(name);
      if (!cleanName) return;
      const key = normalizeKey(cleanName);
      const current = fightersByName.get(key);
      const next = {
        name: cleanName,
        category: category || 'Combat sports',
        image: hasImage(image) ? image : current?.image || '',
        description: `${cleanName} is known for ${category || 'combat sports'} matchups and has been part of Fantasy MMAdness fight cards like ${matchName || 'featured events'}.`,
      };

      if (!current) {
        fightersByName.set(key, next);
        return;
      }

      fightersByName.set(key, {
        ...current,
        category: current.category || next.category,
        image: hasImage(current.image) ? current.image : next.image,
        description: current.description || next.description,
      });
    };
    
    const processFighters = (fighterList) => {
      fighterList.forEach((match) => {
        const category = match.matchCategoryTwo || match.matchCategory || 'Combat sports';
        upsertFighter({ name: match.matchFighterA, category, image: match.fighterAId?.primaryImage || match.fighterAImage, matchName: match.matchName });
        upsertFighter({ name: match.matchFighterB, category, image: match.fighterBId?.primaryImage || match.fighterBImage, matchName: match.matchName });
      });
    };

    processFighters(matches);
    processFighters(shadowFighters);

    return {
      props: { fighters: Array.from(fightersByName.values()) },
    };
  } catch (error) {
    console.error("Error fetching fighters:", error);
    return { props: { fighters: [] } };
  }
}

export default OurFighters;
