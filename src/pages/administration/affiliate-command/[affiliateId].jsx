import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AffiliateDashboard from '@/Components/Affiliates/AffiliateDashboard';
import AffiliatePromotion from '@/Components/Affiliates/AffiliateAllFightPromotion';
import AffiliateMoney from '@/Components/Affiliates/AffiliateMoney';
import AffiliateLeague from '@/Components/Affiliates/AffiliateLeague/AffiliateLeague';
import AffiliateProfile from '@/Components/Affiliates/AffiliateProfile';
import PastPromotions from '@/Components/Affiliates/PastPromotions/PastPromotions';
import AffiliateAccountSettings from '@/Components/Affiliates/AffiliateAccountSettings';
import AffiliateGuide from '@/Components/Affiliates/AffiliateGuide';
import FullCards from '@/pages/promoter/full-cards';
import { AffiliateCommandContext } from '@/Components/Affiliates/AffiliateCommandContext';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { adminHeaders } from '@/Utils/authFetch';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const workspaces = {
  promotions: AffiliatePromotion,
  earnings: AffiliateMoney,
  league: AffiliateLeague,
  profile: AffiliateProfile,
  archive: PastPromotions,
  'payment-settings': AffiliateAccountSettings,
  playbook: AffiliateGuide,
  'how-it-works': AffiliateGuide,
  'full-cards': FullCards,
};

function AffiliateCommand({ affiliateId, section }) {
  const Workspace = Object.hasOwn(workspaces, section) ? workspaces[section] : null;
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
            {Workspace && <Link href={`/administration/affiliate-command/${encodeURIComponent(affiliateId)}`}>Back to Affiliate Command Center</Link>}
          </>
        )}
        {!affiliate && <p role={error ? 'alert' : 'status'}>{error || 'Loading Affiliate Command Center 3.0…'}</p>}
      </div>
      {affiliate && (
        <AffiliateCommandContext.Provider value={affiliate}>
          {Workspace ? <Workspace key={section} /> : <AffiliateDashboard managedAffiliate={affiliate} />}
        </AffiliateCommandContext.Provider>
      )}
    </>
  );
}

export default function AffiliateCommandPage() {
  const { query } = useRouter();
  const affiliateId = typeof query.affiliateId === 'string' ? query.affiliateId : '';

  return (
    <AdminPrivateRoute requestPushNotifications={false}>
      <AffiliateCommand key={affiliateId} affiliateId={affiliateId} section={typeof query.section === 'string' ? query.section : ''} />
    </AdminPrivateRoute>
  );
}
