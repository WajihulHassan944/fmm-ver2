import dynamic from 'next/dynamic';
import React from 'react';

const Contact = dynamic(
  () => import('@/Components/Footer/Contact'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const ContactPage = () => {
  return <Contact />;
};

export default ContactPage;
