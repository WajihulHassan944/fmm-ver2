import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminAnalytics from '@/Components/ProWrestling/WrestlingAdminAnalytics';

const ProWrestlingAnalyticsPage = () => (
  <AdminPrivateRoute>
    <WrestlingAdminAnalytics />
  </AdminPrivateRoute>
);

export default ProWrestlingAnalyticsPage;
