import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import AdminFightsWorkspace from '@/Components/Admin/AdminFightsWorkspace';
import styles from '@/Components/Admin/FightRegistryTable.module.css';

const AdminFightsPage = () => (
  <AdminPrivateRoute>
    <Head><title>Fight Registry | FMM Administration</title></Head>
    <div className={styles.registry}><AdminFightsWorkspace /></div>
  </AdminPrivateRoute>
);

export default AdminFightsPage;
