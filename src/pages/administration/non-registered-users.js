import dynamic from 'next/dynamic';

const NonRegisteredUsers = dynamic(
  () => import('@/Components/Admin/NonRegisteredUsers'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <NonRegisteredUsers />
    </AdminPrivateRoute>
  )
}

export default index
