import dynamic from 'next/dynamic';
import React from 'react';

const SpinWheel = dynamic(
  () => import('@/Components/Home/SpinWheel'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <SpinWheel />
}

export default index
