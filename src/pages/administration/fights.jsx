import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import AdminFightsWorkspace from '@/Components/Admin/AdminFightsWorkspace';

const AdminFightsPage = () => (
  <AdminPrivateRoute>
    <Head><title>Fight Registry | FMM Administration</title></Head>
    <AdminFightsWorkspace />
  </AdminPrivateRoute>
);

export default AdminFightsPage;
