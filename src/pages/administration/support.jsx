import AdminSupportTickets from '@/Components/Admin/AdminSupportTickets';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';

export default function SupportAdministrationPage() {
  return <AdminPrivateRoute><AdminSupportTickets /></AdminPrivateRoute>;
}
