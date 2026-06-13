import dynamic from 'next/dynamic';
import React from 'react';

const Guide = dynamic(
  () => import('@/Components/Dashboard/Guide'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <Guide />
}

export default index
