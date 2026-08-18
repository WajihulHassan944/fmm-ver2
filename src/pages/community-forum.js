import dynamic from 'next/dynamic';
import React from 'react';

const ThreadList = dynamic(
  () => import('@/Components/Forum/ThreadList'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <ThreadList />
}

export default index
