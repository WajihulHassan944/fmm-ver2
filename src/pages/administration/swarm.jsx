import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import SwarmCommandCenter from '@/Components/Admin/SwarmCommandCenter';

const SwarmPage = () => (
  <AdminPrivateRoute>
    <SwarmCommandCenter />
  </AdminPrivateRoute>
);

export default SwarmPage;
