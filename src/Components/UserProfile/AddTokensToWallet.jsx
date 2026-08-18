import React from 'react';
import MembershipCheckout from '../CreateAccount/MembershipCheckout';

// Wallet top-ups use the same hosted checkout as the public coin cart.
// Card data is collected by the payment gateway and never reaches this app.
export default function AddTokensToWallet() {
  return <MembershipCheckout />;
}
