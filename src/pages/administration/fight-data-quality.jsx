import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import FightDataQualityCenter from '@/Components/Admin/FightDataQualityCenter';

const FightDataQualityPage = () => (
  <AdminPrivateRoute>
    <Head><title>Fight Data Quality | FMM Administration</title></Head>
    <div className="admin-workspace admin-fights-workspace">
      <FightDataQualityCenter />
    </div>
  </AdminPrivateRoute>
);

export default FightDataQualityPage;
