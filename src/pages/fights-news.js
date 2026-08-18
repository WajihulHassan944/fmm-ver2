import dynamic from 'next/dynamic';
import React from 'react';

const NewsFeed = dynamic(
  () => import('@/Components/Footer/NewsFeed'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <NewsFeed />
}

export default index
