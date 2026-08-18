import dynamic from 'next/dynamic';

const EmailTemplate = dynamic(
  () => import('@/Components/Admin/EmailTemplate'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <EmailTemplate />
    </AdminPrivateRoute>
  )
}

export default index
