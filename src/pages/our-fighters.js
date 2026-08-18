import dynamic from 'next/dynamic';
import React from 'react';
import { fetchPublicFighters } from '@/Utils/publicApi';

const Fighters = dynamic(
  () => import('@/Components/Home/Fighters'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const OurFighters = ({ fighters }) => {
  return <Fighters fighters={fighters} />;
};

export async function getServerSideProps({ res }) {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const fighters = await fetchPublicFighters({ page: 1, limit: 100, status: 'active' });

    return {
      props: { fighters },
    };
  } catch (error) {
    console.error('Error fetching fighter-library roster:', error);
    return { props: { fighters: [] } };
  }
}

export default OurFighters;
