import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { buildPublicApiUrl } from '@/Utils/publicApi';

// Sponsor details come from the server, keyed off the sponsor session token.
//
// This page used to read the whole record out of localStorage and render it
// unchecked, which meant anyone could invent a `sponsorData` entry and get a
// dashboard. It also parsed the shape of the old email-only login response
// (`{ data: [sponsor] }`), so the current login — which stores a single sponsor
// object — left it stuck on "Loading" forever.
const SponsorDashboard = () => {
  const router = useRouter();
  const [sponsor, setSponsor] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = typeof window === 'undefined' ? '' : window.localStorage.getItem('sponsorAuthToken');
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const response = await fetch(buildPublicApiUrl('/api/sponsor/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (!response.ok || !payload?.sponsor) {
          setStatus(response.status === 401 || response.status === 403 ? 'unauthenticated' : 'error');
          return;
        }
        setSponsor(payload.sponsor);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) setStatus('error');
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return <div className="sponsors-wrap"><p>Loading sponsor details…</p></div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="sponsors-wrap">
        <h1>Sponsor sign-in required</h1>
        <p>Your sponsor session has ended. Request a new sign-in code to continue.</p>
        <button type="button" className="btn-grad" onClick={() => router.push('/sponsor-login')}>
          Go to sponsor sign-in
        </button>
      </div>
    );
  }

  if (status === 'error' || !sponsor) {
    return (
      <div className="sponsors-wrap">
        <h1>We could not load your details</h1>
        <p>Please try again in a moment, or contact support if it keeps happening.</p>
      </div>
    );
  }

  const created = sponsor.dateCreated || sponsor.createdAt;

  return (
    <div className="sponsors-wrap">
      <img
        src="https://ufcfightclub.com/assets/ufc2/patterns/double_black_top_right.svg"
        alt="design"
        className="toabsolutedesign"
      />

      <h1>
        Welcome {sponsor.name}
        <img
          src="https://ufcfightclub.com/assets/ufc2/patterns/brackets.svg"
          alt="brackets"
        />
      </h1>

      <h2>We have used the following data for our website:</h2>

      <div className="sponsor-container-parent">
        <div className="sponsors-main">
          <a
            href={sponsor.websiteLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="sponsorItem">
              {sponsor.image ? <img src={sponsor.image} alt={sponsor.name} /> : null}
            </div>
            <h1>{sponsor.name}</h1>
          </a>
        </div>
      </div>

      <p>{sponsor.description}</p>
      <p>
        <strong>Website:</strong> {sponsor.websiteLink || 'Not provided'}
      </p>
      <p>
        <strong>Instagram:</strong> {sponsor.instaLink || 'Not provided'}
      </p>
      <p>
        <strong>Date Created:</strong>{' '}
        {created ? new Date(created).toLocaleDateString() : 'N/A'}
      </p>
    </div>
  );
};

export default SponsorDashboard;
