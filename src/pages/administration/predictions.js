import dynamic from 'next/dynamic';

const AdminPredictions = dynamic(
  () => import('@/Components/Admin/AdminPredictions'),
  {
    loading: () => <p>Loading...</p>,
  }
);
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <AdminPredictions />
    </AdminPrivateRoute>
  )
}

export default index
