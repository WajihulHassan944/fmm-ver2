import React from 'react';
import RetiredGrowthRedirect from '@/Components/Admin/RetiredGrowthRedirect';
import { GROWTH_ENGINE_V2 } from '@/Utils/adminFeatures';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import JulyGrowthCommandCenter from '@/Components/Admin/JulyGrowthCommandCenter';

const JulyGrowthPage = () => (GROWTH_ENGINE_V2 ? <AdminPrivateRoute><RetiredGrowthRedirect section="overview" /></AdminPrivateRoute> :
  <AdminPrivateRoute>
    <Head><title>July 10K Growth | FMM Administration</title></Head>
    <div className="admin-swarm-workspace">
      <JulyGrowthCommandCenter />
    </div>
  </AdminPrivateRoute>
);

export default JulyGrowthPage;
