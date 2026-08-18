import dynamic from 'next/dynamic';
import React from 'react';

const Login = dynamic(
  () => import('@/Components/Login/Login'),
  {
    loading: () => <p>Loading...</p>,
  }
);


const index = () => {
  return <Login />
}

export default index
