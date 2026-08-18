import dynamic from 'next/dynamic';

const AdminRecords = dynamic(
  () => import('@/Components/Admin/AdminRecords'),
  {
    loading: () => <p>Loading...</p>,
  }
);
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
   <AdminPrivateRoute>
    <AdminRecords />
   </AdminPrivateRoute>
  )
}

export default index
