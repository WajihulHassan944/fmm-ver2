import dynamic from 'next/dynamic';

const AffiliateMatches = dynamic(
  () => import('@/Components/Admin/AffiliateMatches'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <AffiliateMatches />
    </AdminPrivateRoute>
  )
}

export default index
