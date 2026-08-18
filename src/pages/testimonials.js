import dynamic from 'next/dynamic';
import React from 'react';

const Testimonials = dynamic(
  () => import('@/Components/Home/Testimonials'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const index = () => {
  return <Testimonials />
}

export default index
