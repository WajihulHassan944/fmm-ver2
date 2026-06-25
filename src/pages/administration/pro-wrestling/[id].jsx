import React from 'react';
import { useRouter } from 'next/router';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminMatchForm from '@/Components/ProWrestling/WrestlingAdminMatchForm';

const EditProWrestlingMatchPage = () => {
  const router = useRouter();
  return (
    <AdminPrivateRoute>
      <WrestlingAdminMatchForm matchId={router.query.id} />
    </AdminPrivateRoute>
  );
};

export default EditProWrestlingMatchPage;
