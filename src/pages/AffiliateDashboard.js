import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateDashboard = dynamic(
  () => import('@/Components/Affiliates/AffiliateDashboard'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <AffiliateDashboard />
}

export default index
