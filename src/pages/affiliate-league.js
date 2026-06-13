import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateLeague = dynamic(
  () => import('@/Components/Affiliates/AffiliateLeague/AffiliateLeague'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const Index = () => {
  return <AffiliateLeague />;
};

export default Index;
