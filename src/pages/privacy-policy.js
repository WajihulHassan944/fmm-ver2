import dynamic from 'next/dynamic';
import React from 'react';

const PrivacyPolicy = dynamic(
  () => import('@/Components/LegalDocuments/PrivacyPolicy'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <PrivacyPolicy />
}

export default index
