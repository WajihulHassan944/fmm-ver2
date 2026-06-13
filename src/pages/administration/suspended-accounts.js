import dynamic from 'next/dynamic';

const SuspendedAccounts = dynamic(
  () => import('@/Components/Admin/SuspendedAccounts'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <SuspendedAccounts />
     </AdminPrivateRoute>
  )
}

export default index
