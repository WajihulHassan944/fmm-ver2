import dynamic from 'next/dynamic';
import React from 'react';

const TrashedFights = dynamic(
  () => import('@/Components/YourFights/TrashedFights'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <TrashedFights />
}

export default index
