import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AffiliateDashboard from '@/Components/Affiliates/AffiliateDashboard';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { adminHeaders } from '@/Utils/authFetch';
import { buildPublicApiUrl } from '@/Utils/publicApi';

function AffiliateCommand({ affiliateId }) {
  const [affiliate, setAffiliate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!affiliateId) return undefined;
    const controller = new AbortController();

    async function loadAffiliate() {
      try {
        const response = await fetch(buildPublicApiUrl('/affiliates'), {
          headers: adminHeaders(),
          signal: controller.signal,
          cache: 'no-store',
        });
        if (response.status === 401 || response.status === 403) {
          throw new Error('Sign in to the owner back office again to open this Command Center.');
        }
        if (!response.ok) throw new Error('Could not load the affiliate account.');
        const accounts = await response.json();
        const account = accounts.find(({ _id }) => String(_id) === affiliateId);
        if (!account) throw new Error('This affiliate account could not be found.');
        if (!controller.signal.aborted) setAffiliate(account);
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError.message);
      }
    }
    loadAffiliate();
    return () => controller.abort();
  }, [affiliateId]);

  return (
    <>
      <div className="theme-container" style={{ paddingBlock: 16 }}>
        <Link href="/administration/AffiliateUsers">Back to Affiliates</Link>
        {affiliate && (
          <>
            <p>Owner support for {[affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || affiliate.playerName || 'this affiliate'}</p>
            <Link className="admin-action-primary" href={`/owner?affiliate=${encodeURIComponent(affiliateId)}`}>
              View full affiliate workspace
            </Link>
          </>
        )}
        {!affiliate && <p role={error ? 'alert' : 'status'}>{error || 'Loading Affiliate Command Center 3.0…'}</p>}
      </div>
      {affiliate && <AffiliateDashboard managedAffiliate={affiliate} />}
    </>
  );
}

export default function AffiliateCommandPage() {
  const { query } = useRouter();
  const affiliateId = typeof query.affiliateId === 'string' ? query.affiliateId : '';

  return (
    <AdminPrivateRoute>
      <AffiliateCommand key={affiliateId} affiliateId={affiliateId} />
    </AdminPrivateRoute>
  );
}
