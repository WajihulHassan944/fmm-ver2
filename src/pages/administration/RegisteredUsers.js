import dynamic from 'next/dynamic';

const RegisteredUsers = dynamic(
  () => import('@/Components/Admin/RegisteredUsers'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <RegisteredUsers />
     </AdminPrivateRoute>
  )
}

export default index
