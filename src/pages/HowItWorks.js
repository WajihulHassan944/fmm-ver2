import dynamic from 'next/dynamic';
import React from 'react';

const HowItWorks = dynamic(
  () => import('@/Components/Affiliates/HowItWorks'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <HowItWorks />
}

export default index
