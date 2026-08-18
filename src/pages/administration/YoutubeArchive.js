import dynamic from 'next/dynamic';

const YoutubeArchive = dynamic(
  () => import('@/Components/Admin/YoutubeArchive'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin'
import React from 'react'

const index = () => {
  return (
     <AdminPrivateRoute>
        <YoutubeArchive />
     </AdminPrivateRoute>
  )
}

export default index
