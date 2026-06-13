import dynamic from 'next/dynamic';
import React from 'react';

const PlayForFree = dynamic(
  () => import('@/Components/PlayForFree/PlayForFree'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <PlayForFree />
}

export default index
