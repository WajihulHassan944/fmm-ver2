import dynamic from 'next/dynamic';
import React from 'react';

const Sponsors = dynamic(
  () => import('@/Components/Home/Sponsors'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const SponsorsPage = ({ sponsors }) => {
  return <Sponsors sponsors={sponsors} />;
};

// ✅ Fetch sponsors data before rendering
export const getServerSideProps = async () => {
  try {
    const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/sponsors");
    if (!response.ok) {
      throw new Error("Failed to fetch sponsors");
    }
    const data = await response.json();

    return {
      props: { sponsors: data.success ? data.data : [] }, // Ensure an array
    };
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return { props: { sponsors: [] } }; // Return an empty array on error
  }
};

export default SponsorsPage;
