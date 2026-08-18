import dynamic from 'next/dynamic';
import React from 'react';

const YourFights = dynamic(
  () => import('@/Components/YourFights/YourFights'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <YourFights />
}

export default index
