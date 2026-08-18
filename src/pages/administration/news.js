import dynamic from 'next/dynamic';

const AdminNews = dynamic(
  () => import('@/Components/Admin/AdminNews'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <AdminNews />
     </AdminPrivateRoute>
  )
}

export default index
