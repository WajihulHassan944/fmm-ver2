import React, { useState } from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';

// Administrator-only payment gateway health check. Makes no charge and shows no key values.
const PaymentHealth = () => {
  const [state, setState] = useState({ busy: false, error: '', result: null });
  const run = async () => {
    setState({ busy: true, error: '', result: null });
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/diagnostics/authorize-net`, { headers: adminHeaders(), cache: 'no-store' });
      if (response.status === 401 || response.status === 403) throw new Error('Your administrator session has expired. Please sign in again.');
      if (!response.ok) throw new Error('The health check could not run right now.');
      setState({ busy: false, error: '', result: await response.json() });
    } catch (error) {
      setState({ busy: false, error: error.message, result: null });
    }
  };
  const { busy, error, result } = state;
  const hosted = result?.hostedPaymentPage;
  const row = (label, ok, detail) => (
    <li key={label}><strong>{label}:</strong> {ok === null ? '—' : ok ? 'OK' : 'PROBLEM'}{detail ? ` · ${detail}` : ''}</li>
  );
  return (
    <AdminPrivateRoute>
      <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
        <h1>Payment gateway health</h1>
        <p>Checks which Authorize.Net mode the live backend uses and whether the gateway accepts the stored credentials. No charge is made and no key is shown.</p>
        <button type="button" onClick={run} disabled={busy}>{busy ? 'Checking…' : 'Run payment health check'}</button>
        {error && <p role="alert">{error}</p>}
        {result && (
          <ul style={{ lineHeight: 1.8 }}>
            {row('Mode', true, result.environment)}
            {row('All keys present', Boolean(result.allKeysLoaded))}
            {row('Gateway accepts credentials', Boolean(result.credentialsValid), result.authorizeNet?.messages?.[0]?.text || '')}
            {row('Card form key', result.cardForm ? Boolean(result.cardForm.ok) : null, result.cardForm?.message || '')}
            {row('Hosted payment page', hosted ? Boolean(hosted.ok) : null, hosted?.messages?.[0]?.text || hosted?.error || '')}
          </ul>
        )}
      </main>
    </AdminPrivateRoute>
  );
};

export default PaymentHealth;
