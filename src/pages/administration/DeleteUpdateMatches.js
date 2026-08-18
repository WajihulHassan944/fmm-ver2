import dynamic from 'next/dynamic';

const DeleteFights = dynamic(
  () => import('@/Components/Admin/DeleteFights'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <DeleteFights />
     </AdminPrivateRoute>
  )
}

export default index
