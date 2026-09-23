import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import DeleteFights from '@/Components/Admin/DeleteFights';

export default function FightMaintenancePage() {
  return <AdminPrivateRoute>
    <Head><title>Edit Fight | FANTASY MMADNESS Administration</title></Head>
    <DeleteFights />
  </AdminPrivateRoute>;
}
