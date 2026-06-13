import dynamic from 'next/dynamic';
import React from 'react';

const Leagues = dynamic(
  () => import('@/Components/Dashboard/Leagues'),
  {
    loading: () => <p>Loading...</p>,
  }
);


const index = () => {
  return <Leagues />
}

export default index
