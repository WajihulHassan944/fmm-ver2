import dynamic from 'next/dynamic';

const AffiliatesPayouts = dynamic(
  () => import('@/Components/Admin/AffiliatesPayouts'),
  {
    loading: () => <p>Loading...</p>,
  }
);
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
   <AdminPrivateRoute>
    <AffiliatesPayouts />
   </AdminPrivateRoute>
  )
}

export default index
