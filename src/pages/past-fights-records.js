import dynamic from 'next/dynamic';
import React from 'react';

const PastFightVideos = dynamic(
  () => import('@/Components/Home/PastFightVideos'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <PastFightVideos />
}

export default index
