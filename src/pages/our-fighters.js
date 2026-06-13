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
    
    const uniqueFighters = [];
    
    const processFighters = (fighterList) => {
      fighterList.forEach((match) => {
        const categoryA = match.matchCategoryTwo || match.matchCategory;
        const categoryB = match.matchCategoryTwo || match.matchCategory;

        if (!uniqueFighters.some((fighter) => fighter.name === match.matchFighterA)) {
          uniqueFighters.push({
            name: match.matchFighterA,
            category: categoryA,
            image: match.fighterAImage,
            description: `${match.matchFighterA} is known for his fights in ${categoryA} and has been a part of thrilling matchups like ${match.matchName}.`,
          });
        }

        if (!uniqueFighters.some((fighter) => fighter.name === match.matchFighterB)) {
          uniqueFighters.push({
            name: match.matchFighterB,
            category: categoryB,
            image: match.fighterBImage,
            description: `${match.matchFighterB} is known for his fights in ${categoryB} and has been a part of thrilling matchups like ${match.matchName}.`,
          });
        }
      });
    };

    processFighters(matches);
    processFighters(shadowFighters);

    return {
      props: { fighters: uniqueFighters },
    };
  } catch (error) {
    console.error("Error fetching fighters:", error);
    return { props: { fighters: [] } };
  }
}

export default OurFighters;
