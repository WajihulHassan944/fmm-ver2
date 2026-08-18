import dynamic from 'next/dynamic';

const Calandar = dynamic(
  () => import('@/Components/Admin/Calandar'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <Calandar />
     </AdminPrivateRoute>
  )
}

export default index
