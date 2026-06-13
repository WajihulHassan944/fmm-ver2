import dynamic from 'next/dynamic';
import React from 'react';

const HomeAnother = dynamic(
  () => import('@/Components/HomeAnother/HomeAnother'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <HomeAnother />
}

export default index
