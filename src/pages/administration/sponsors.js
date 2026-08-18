import dynamic from 'next/dynamic';

const AdminSponsor = dynamic(
  () => import('@/Components/Admin/AdminSponsor'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <AdminSponsor />
     </AdminPrivateRoute>
  )
}

export default index
