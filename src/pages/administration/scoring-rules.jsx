import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import AdminFightsWorkspace from '@/Components/Admin/AdminFightsWorkspace';

const ScoringRulesPage = () => (
  <AdminPrivateRoute>
    <Head><title>Scoring Center | FMM Administration</title></Head>
    <AdminFightsWorkspace initialTab="ongoing" mode="score" />
  </AdminPrivateRoute>
);

export default ScoringRulesPage;
