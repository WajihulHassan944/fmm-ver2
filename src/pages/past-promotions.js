import dynamic from 'next/dynamic';
import React from 'react';

const PastPromotions = dynamic(
  () => import('@/Components/Affiliates/PastPromotions/PastPromotions'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <PastPromotions />
}

export default index
