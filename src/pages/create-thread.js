import dynamic from 'next/dynamic';
import React from 'react';

const CreateThread = dynamic(
  () => import('@/Components/Forum/CreateThread'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <CreateThread />
}

export default index
