import dynamic from 'next/dynamic';

const GlobalLeaderboard = dynamic(() =>
  import('@/Components/GlobalLeaderboard/GlobalLeaderboard'), {
    loading: () => <p>Loading...</p> // ✅ optional loading component
  }
);

import React from 'react'

const index = () => {
  return <GlobalLeaderboard />
}

export default index
