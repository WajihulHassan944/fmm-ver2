import dynamic from 'next/dynamic';

const AdminLogin = dynamic(
  () => import('@/Components/Login/AdminLogin'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import React from 'react'

const index = () => {
  return <AdminLogin />
}

export default index
