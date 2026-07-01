import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import JulyGrowthCommandCenter from '@/Components/Admin/JulyGrowthCommandCenter';

const JulyGrowthPage = () => (
  <AdminPrivateRoute>
    <Head><title>July 10K Growth | FMM Administration</title></Head>
    <div className="admin-swarm-workspace">
      <JulyGrowthCommandCenter />
    </div>
  </AdminPrivateRoute>
);

export default JulyGrowthPage;
