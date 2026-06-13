import dynamic from 'next/dynamic';
import React from 'react';

const Termsofservice = dynamic(
  () => import('@/Components/LegalDocuments/Termsofservice'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <Termsofservice />
}

export default index
