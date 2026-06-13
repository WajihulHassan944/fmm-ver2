import dynamic from 'next/dynamic';
import React from 'react';

const UpcomingFights = dynamic(
  () => import('@/Components/UpcomingFights/UpcomingFights'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <UpcomingFights />
}

export default index
