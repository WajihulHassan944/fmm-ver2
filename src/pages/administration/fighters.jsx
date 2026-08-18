import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import CombatFightersAdmin from '@/Components/Admin/CombatFightersAdmin';

const AdminCombatFightersPage = () => (
  <AdminPrivateRoute>
    <CombatFightersAdmin />
  </AdminPrivateRoute>
);

export default AdminCombatFightersPage;
