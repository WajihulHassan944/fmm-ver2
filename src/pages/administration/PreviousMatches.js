import dynamic from 'next/dynamic';

const PreviousMatches = dynamic(
  () => import('@/Components/Admin/PreviousMatches'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
    <AdminPrivateRoute>
        <PreviousMatches />
    </AdminPrivateRoute>
  )
}

export default index
