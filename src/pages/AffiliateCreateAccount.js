import dynamic from 'next/dynamic';
import React from 'react';

const AffiliateCreateAccount = dynamic(
  () => import('@/Components/Affiliates/AffiliateCreateAccount'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <AffiliateCreateAccount />
}

export default index
