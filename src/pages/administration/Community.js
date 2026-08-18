import dynamic from 'next/dynamic';

const AdminForumList = dynamic(
  () => import('@/Components/Admin/AdminForumList'),
  {
    loading: () => <p>Loading...</p>,
  }
);


import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <AdminForumList />
     </AdminPrivateRoute>
  )
}

export default index
