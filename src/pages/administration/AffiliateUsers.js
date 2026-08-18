import dynamic from 'next/dynamic';

const AffiliateUsers = dynamic(
  () => import('@/Components/Admin/AffiliateUsers'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <AffiliateUsers />
     </AdminPrivateRoute>
  )
}

export default index
