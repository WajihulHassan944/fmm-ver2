import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminDashboard from '@/Components/ProWrestling/WrestlingAdminDashboard';

const ProWrestlingAdminPage = () => (
  <AdminPrivateRoute>
    <WrestlingAdminDashboard />
  </AdminPrivateRoute>
);

export default ProWrestlingAdminPage;
