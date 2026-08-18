import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateProfile = dynamic(
  () => import('@/Components/Affiliates/AffiliateProfile'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <AffiliateProfile />
}

export default index
