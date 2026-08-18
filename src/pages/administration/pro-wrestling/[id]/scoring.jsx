import React from 'react';
import { useRouter } from 'next/router';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WrestlingAdminScoring from '@/Components/ProWrestling/WrestlingAdminScoring';

const ScoreProWrestlingMatchPage = () => {
  const router = useRouter();
  return (
    <AdminPrivateRoute>
      <WrestlingAdminScoring matchId={router.query.id} />
    </AdminPrivateRoute>
  );
};

export default ScoreProWrestlingMatchPage;
