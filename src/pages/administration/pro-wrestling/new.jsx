import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminMatchForm from '@/Components/ProWrestling/WrestlingAdminMatchForm';

const NewProWrestlingMatchPage = () => (
  <AdminPrivateRoute>
    <WrestlingAdminMatchForm />
  </AdminPrivateRoute>
);

export default NewProWrestlingMatchPage;
