import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateMoney = dynamic(
  () => import('@/Components/Affiliates/AffiliateMoney'),
  { loading: () => <p>Loading...</p> },
);

const AffiliateMoneyPage = () => <AffiliateMoney />;

export default AffiliateMoneyPage;
