import React, { useState, useEffect } from "react";

const ThankyouPurchaseTokens = ({ amount }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-16787825610',
        value: amount, // Pass the transaction amount
        currency: 'USD', // Specify the currency
      });
    }
  }, [amount]);


  useEffect(() => {
    // Set a timer to hide the component after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    // Clear the timer if the component unmounts before 4 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null; // Do not render anything if `isVisible` is false
  }

  return (
    <div className="thankyou-purchase-tokens-parent">
      <div className="thankyou-purchase-tokens-child">
        <h1>Thank you for your purchase!</h1>
        <h2>Tokens are successfully added to your fight wallet.</h2>
      </div>
    </div>
  );
};

export default ThankyouPurchaseTokens;
