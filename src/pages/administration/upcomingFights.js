import dynamic from 'next/dynamic';

const UpcomingFights = dynamic(
  () => import('@/Components/Admin/UpcomingFights'),
  {
    loading: () => <p>Loading...</p>,
  }
);

import AdminPrivateRoute from "@/Components/PrivateRoute/PrivateRouteAdmin";

const Index = () => {
  return (
    <AdminPrivateRoute>
      <UpcomingFights />
    </AdminPrivateRoute>
  );
};

export default Index;
