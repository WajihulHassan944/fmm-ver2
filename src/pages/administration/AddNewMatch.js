import React from 'react'
import dynamic from 'next/dynamic';

const AddNewMatch = dynamic(
  () => import('@/Components/Admin/AddNewMatch'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'

const index = () => {
  return (
    <AdminPrivateRoute>
        <AddNewMatch />
    </AdminPrivateRoute>
  )
}

export default index
