import dynamic from 'next/dynamic';
import React from 'react';

const About = dynamic(() => import('@/Components/Footer/About'), {
  loading: () => <p>Loading...</p>, // Optional placeholder
});

const Index = () => {
  return <About />;
};

export default Index;
