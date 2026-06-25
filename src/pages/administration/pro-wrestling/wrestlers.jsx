import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminRoster from '@/Components/ProWrestling/WrestlingAdminRoster';

const ProWrestlingRosterPage = () => (
  <AdminPrivateRoute>
    <WrestlingAdminRoster />
  </AdminPrivateRoute>
);

export default ProWrestlingRosterPage;
