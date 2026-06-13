import dynamic from 'next/dynamic';
import React from 'react';

const HomeLeaderboard = dynamic(
  () => import('@/Components/GlobalLeaderboard/HomeLeaderboard'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <HomeLeaderboard />
}

export default index
