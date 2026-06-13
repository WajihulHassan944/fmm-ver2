import dynamic from 'next/dynamic';

const ShadowFightsLibrary = dynamic(
  () => import('@/Components/Admin/ShadowFightsLibrary'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <ShadowFightsLibrary />
     </AdminPrivateRoute>
  )
}

export default index
