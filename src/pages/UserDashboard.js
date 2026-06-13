import dynamic from 'next/dynamic';
import React from 'react';

const DashboardMain = dynamic(
  () => import('@/Components/Dashboard/DashboardMain'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <DashboardMain />
}

export default index
