import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateGuide = dynamic(() => import('@/Components/Affiliates/AffiliateGuide'), {
  loading: () => <p>Loading...</p>,
});

const Index = () => {
  return <AffiliateGuide />;
};

export default Index;
