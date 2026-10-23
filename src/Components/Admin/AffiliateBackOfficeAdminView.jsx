import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AffiliateDashboard from '@/Components/Affiliates/AffiliateDashboard';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';

const num = (value) => Number(value || 0).toLocaleString();

const getJson = async (path) => {
  const response = await fetch(`${PUBLIC_API_BASE_URL}${path}`, { headers: adminHeaders(), cache: 'no-store' });
  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403
      ? 'Your administrator session has expired. Please sign in to the back office again.'
      : response.status === 404 ? 'That affiliate was not found.' : 'This information could not be loaded right now.');
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Read-only administrator view of one affiliate's private back office. It loads data for the
// affiliate named in the address using the administrator's own session; it never signs in as
// the affiliate. The parent keys this component by affiliate id, so switching affiliates
// always starts from empty state.
const AffiliateBackOfficeAdminView = ({ affiliateId }) => {
  const [state, setState] = useState({ loading: true, error: '', affiliate: null, referrals: null, money: null, partial: [] });

  useEffect(() => {
    let active = true;
    const base = `/api/admin/affiliates/${encodeURIComponent(affiliateId)}/back-office`;
    (async () => {
      try {
        const profile = await getJson(`${base}/profile`);
        const [referrals, money] = await Promise.allSettled([getJson(`${base}/fight-referrals`), getJson(`${base}/money`)]);
        if (!active) return;
        setState({
          loading: false,
          error: '',
          affiliate: profile.user,
          referrals: referrals.status === 'fulfilled' ? referrals.value : null,
          money: money.status === 'fulfilled' ? money.value : null,
          partial: [referrals.status === 'rejected' && 'referrals', money.status === 'rejected' && 'earnings'].filter(Boolean),
        });
      } catch (error) {
        if (active) setState({ loading: false, error: error.message, affiliate: null, referrals: null, money: null, partial: [] });
      }
    })();
    return () => { active = false; };
  }, [affiliateId]);

  if (state.loading) return <p style={{ padding: 24 }}>Loading this affiliate&apos;s back office…</p>;
  if (state.error || !state.affiliate) {
    return (
      <div style={{ padding: 24 }}>
        <p role="alert">{state.error || 'This affiliate could not be loaded.'}</p>
        <Link href="/administration/AffiliateUsers">Back to Affiliate Users</Link>
      </div>
    );
  }

  const { affiliate, referrals, money } = state;
  const summary = money?.summary || {};
  const box = { background: '#0d1117', border: '1px solid #2a3340', borderRadius: 10, padding: '12px 14px' };

  return (
    <>
      <div style={{ padding: '10px 16px', background: '#0b0f14', color: '#e6edf3' }}>
        <Link href="/administration/AffiliateUsers">← Back to Affiliate Users</Link>
      </div>
      <AffiliateDashboard adminAffiliate={affiliate} readOnly />
      <section aria-label="Earnings and referrals (read only)" style={{ background: '#0b0f14', color: '#e6edf3', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Earnings &amp; referrals · read only</h2>
          {state.partial.length > 0 && <p role="status">Could not load {state.partial.join(' and ')} right now. Reload to try again.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <div style={box}><small>Signups through their links</small><br /><strong>{referrals ? num(referrals.signups) : '—'}</strong></div>
            <div style={box}><small>Verified signups</small><br /><strong>{referrals ? num(referrals.verifiedSignups) : '—'}</strong></div>
            <div style={box}><small>Players who entered fights</small><br /><strong>{referrals ? num(referrals.participatingPlayers) : '—'}</strong></div>
            <div style={box}><small>Paid entries</small><br /><strong>{referrals ? num(referrals.paidEntries) : '—'}</strong></div>
            <div style={box}><small>Coin balance</small><br /><strong>{money ? num(summary.balance) : '—'}</strong></div>
            <div style={box}><small>Lifetime earned</small><br /><strong>{money ? num(summary.lifetimeEarned) : '—'}</strong></div>
            <div style={box}><small>Paid out</small><br /><strong>{money ? num(summary.paidOut) : '—'}</strong></div>
            <div style={box}><small>Pending payouts</small><br /><strong>{money ? num(summary.pendingPayouts) : '—'}</strong></div>
          </div>
          <p style={{ opacity: 0.75, fontSize: 13 }}>Payout approvals and payment changes stay in the normal Payouts screen. Nothing on this page can change money or promotions.</p>
        </div>
      </section>
    </>
  );
};

export default AffiliateBackOfficeAdminView;
