import dynamic from 'next/dynamic';
import React from 'react';

const CalenderOfMatches = dynamic(
  () => import('@/Components/CalenderOfMatches/CalenderOfMatches'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <CalenderOfMatches />
}

export default index
