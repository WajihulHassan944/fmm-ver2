import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateAllFightPromotion = dynamic(
  () => import('@/Components/Affiliates/AffiliateAllFightPromotion'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <AffiliateAllFightPromotion />
}

export default index
