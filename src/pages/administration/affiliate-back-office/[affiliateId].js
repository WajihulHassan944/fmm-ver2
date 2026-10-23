import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';

const AffiliateBackOfficeAdminView = dynamic(
  () => import('@/Components/Admin/AffiliateBackOfficeAdminView'),
  { loading: () => <p>Loading...</p> },
);

// Administrator-only, read-only view of one affiliate's private back office.
const AffiliateBackOfficePage = () => {
  const router = useRouter();
  const affiliateId = typeof router.query.affiliateId === 'string' ? router.query.affiliateId : '';
  return (
    <AdminPrivateRoute>
      {affiliateId ? <AffiliateBackOfficeAdminView key={affiliateId} affiliateId={affiliateId} /> : <p>Loading...</p>}
    </AdminPrivateRoute>
  );
};

export default AffiliateBackOfficePage;
