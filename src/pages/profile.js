import dynamic from 'next/dynamic';
import React from 'react';

const UserProfile = dynamic(
  () => import('@/Components/UserProfile/UserProfile'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <UserProfile />
}

export default index
