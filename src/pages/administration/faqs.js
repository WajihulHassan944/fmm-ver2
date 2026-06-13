import dynamic from 'next/dynamic';

const AdminFaqs = dynamic(
  () => import('@/Components/Admin/AdminFaqs'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <AdminFaqs />
     </AdminPrivateRoute>
  )
}

export default index
