import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminRules from '@/Components/ProWrestling/WrestlingAdminRules';

const ProWrestlingRulesPage = () => (
  <AdminPrivateRoute>
    <WrestlingAdminRules />
  </AdminPrivateRoute>
);

export default ProWrestlingRulesPage;
