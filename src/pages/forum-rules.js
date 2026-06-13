import dynamic from 'next/dynamic';
import React from 'react';

const CommunityRules = dynamic(
  () => import('@/Components/Forum/CommunityRules'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <CommunityRules />
}

export default index
