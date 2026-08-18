import dynamic from 'next/dynamic';
import React from 'react';

const SponsorDashboard = dynamic(
  () => import('@/Components/Home/SponsorDashboard'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <SponsorDashboard />
}

export default index
