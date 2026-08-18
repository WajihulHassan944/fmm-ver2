import dynamic from 'next/dynamic';
import React from 'react';

const CreateAccount = dynamic(
  () => import('@/Components/CreateAccount/CreateAccount'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <CreateAccount />
}

export default index
