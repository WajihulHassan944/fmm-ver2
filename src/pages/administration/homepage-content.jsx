import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import AdminFightsWorkspace from '@/Components/Admin/AdminFightsWorkspace';

const HomepageContentAdminPage = () => (
  <AdminPrivateRoute>
    <Head><title>Homepage Content | FMM Administration</title></Head>
    <AdminFightsWorkspace initialTab="live" mode="homepage" />
  </AdminPrivateRoute>
);

export default HomepageContentAdminPage;
