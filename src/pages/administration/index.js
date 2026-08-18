import dynamic from 'next/dynamic';

const Admin = dynamic(
  () => import('@/Components/Admin/Admin'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <Admin />
    </AdminPrivateRoute>
  )
}

export default index
