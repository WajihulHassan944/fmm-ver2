import dynamic from 'next/dynamic';
import React from 'react';

// The sponsor sign-in screen had no route of its own: the component existed but
// nothing mounted it, and sign-in happened inside AuthPortal off an email
// address alone. Now that sponsors sign in with an emailed one-time code, the
// screen needs a real URL to send them to.
const SponsorLogin = dynamic(
  () => import('@/Components/Login/SponsorLogin'),
  {
    loading: () => <p>Loading...</p>,
    ssr: false,
  }
);

const SponsorLoginPage = () => <SponsorLogin />;

export default SponsorLoginPage;
