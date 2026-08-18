import dynamic from 'next/dynamic';
import React from 'react';

const Rewards = dynamic(
  () => import('@/Components/Home/Rewards'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <Rewards />
}

export default index
