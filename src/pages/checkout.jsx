import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux'; // Import useSelector to access the Redux store
import React from 'react';

const MembershipCheckout = dynamic(
  () => import('@/Components/CreateAccount/MembershipCheckout'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const Index = () => {
  const reduxUser = useSelector((state) => state.user); // Access user details from Redux store
console.log("redux", reduxUser);
  return <MembershipCheckout userId={reduxUser._id}  />; // Pass user as a prop to MembershipCheckout
};

export default Index;
