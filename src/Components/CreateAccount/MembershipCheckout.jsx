import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ThankyouPurchaseTokens from '../Dashboard/ThankyouPurchaseTokens';
import Link from 'next/link';

const MembershipCheckout = (userId) => {
  const reduxUser = useSelector((state) => state.user); // Access user details from Redux store
  const [user, setUser] = useState(reduxUser);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  if (!user) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    if (reduxUser && reduxUser._id !== user?._id) {
      setUser(reduxUser); 
    }
  }, [reduxUser, user]);
  const [billingInfo, setBillingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: user?.billing?.address || '',
    city: user?.billing?.city || '',
    state: user?.billing?.state || '',
    zipCode: user?.zipCode || '',
    phone: user?.phone || '',
    creditCardNumber: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
    termsAccepted: false,
    amount: '10',
  });

  useEffect(() => {
    // If user? is not found in Redux store, fetch user data using userId prop
    if (!user || !user._id) {
      const fetchUser = async () => {
        try {
          const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users');
          if (!response.ok) {
            throw new Error(`Error fetching users: ${response.statusText}`);
          }
          const users = await response.json();
          // Filter the fetched users to find the user with the provided userId
          const foundUser = users.find(u => u._id === userId);
          if (foundUser) {
            setUser(foundUser);
            setBillingInfo((prevInfo) => ({
              ...prevInfo,
              firstName: foundUser.firstName,
              lastName: foundUser.lastName,
            }));
          } else {
            console.error('User not found');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };

      fetchUser();
    } else {
      // If user is already set in Redux, update billing info
      setBillingInfo((prevInfo) => ({
        ...prevInfo,
        firstName: user.firstName || prevInfo.firstName,
        lastName: user.lastName || prevInfo.lastName,
        address: user.billing?.address || prevInfo.address,
        city: user.billing?.city || prevInfo.city,
        state: user.billing?.state || prevInfo.state,
        zipCode: user.zipCode || prevInfo.zipCode,
        phone: user.phone || prevInfo.phone,
        // Keep other fields unchanged
        creditCardNumber: prevInfo.creditCardNumber,
        expMonth: prevInfo.expMonth,
        expYear: prevInfo.expYear,
        securityCode: prevInfo.securityCode,
        termsAccepted: prevInfo.termsAccepted,
      }));
    }
  }, [userId, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setBillingInfo((prevInfo) => ({ ...prevInfo, termsAccepted: e.target.checked }));
  };
  const handleTokenizeCard = async (card, billingAddress, contactEmail) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/authorize-net/first-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: billingInfo.amount, // Ensure to set the amount you want to send
          cardNumber: card.number,
          expirationDate: `${card.exp}`,
          cardCode: card.cvv,
          email: contactEmail,
          firstName: billingInfo.firstName,
          lastName: billingInfo.lastName,
          address: billingAddress.address,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zipCode,
          country: "US" // You can dynamically set this if needed
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error tokenizing card");
      }

      // Set the payment success flag
      setPaymentSuccessful(true);

      // Automatically hide thank-you component after 4 seconds
      setTimeout(() => setPaymentSuccessful(false), 4000);
    } catch (error) {
      console.error("Card error:", error);
      alert(`Error card: ${error.message}`);
    }
  };

  if (paymentSuccessful) {
    // Pass the amount from billingInfo to ThankyouPurchaseTokens
    return <ThankyouPurchaseTokens amount={billingInfo.amount} />;
  }
  


    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!billingInfo.termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    const { creditCardNumber, expMonth, expYear, securityCode } = billingInfo;
    const card = {
      name: `${billingInfo.firstName} ${billingInfo.lastName}`,
      number: creditCardNumber,
      exp: `${expMonth}/${expYear}`,
      cvv: securityCode,
    };
    const billingAddress = {
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      zipCode: billingInfo.zipCode,
      phone: billingInfo.phone,
    };

    try {
      await handleTokenizeCard(card, billingAddress, user.email); // Call tokenization API
    } catch (error) {
      console.error('Error during tokenization:', error);
    }
  };

  return (
    <div className='membership-chackout-wrapper premium-membership-checkout'>
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl} alt="Profile" />
        </div>
        <h3><span className='toRemove'>Member Name - </span>{user.firstName} {user.lastName}</h3>
        <h3><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
      </div>

      <div className='mermbership-cards'>
      <div className='cardone'>
                    <h1 className='cardHeading'>10 Tokens</h1>
                    <div className='cardprice'>
                        <div className="ribbon"><span>Tokens</span></div>
                        <p>$</p>
                        <div className='cardprice-two'><h1>10</h1></div>
                        <p>00</p>
                    </div>
                    <div className='card-features'>
                        <li>First deduction $10</li>
                        <li>Use on POT Fights</li>
                        <li>Tokens are added to wallet</li>
                        <li>Share fight portfolio</li>
                        <li>Get on the FMMA Leaderboard</li>
                    </div>
                    <button className='btn-grad' style={{pointerEvents:'none'}}>SELECTED</button>
                </div>

        
        <div className='billingInformation'>
          <h2>Billing Information</h2>
          <div className='input-group'>
            <label>First Name</label>
            <input type='text' name="firstName" value={billingInfo.firstName} onChange={handleInputChange} disabled style={{background:'#fff'}} />
          </div>
          <div className='input-group'>
            <label>Last Name</label>
            <input type='text' name="lastName" value={billingInfo.lastName} onChange={handleInputChange} disabled style={{background:'#fff'}} />
          </div>
          <div className='input-group'>
            <label>Address</label>
            <input type='text' name="address" value={billingInfo.address} onChange={handleInputChange} />
          </div>
          <div className='input-group'>
            <label>City</label>
            <input type='text' name="city" value={billingInfo.city} onChange={handleInputChange} />
          </div>
          <div className='input-group input-group-state'>
            <label>State</label>
            <input type='text' name="state" value={billingInfo.state} onChange={handleInputChange} />
          </div>
          <div className='input-group input-group-zipcode'>
            <label>Zip Code</label>
            <input type='text' name="zipCode" value={billingInfo.zipCode} onChange={handleInputChange} />
          </div>
          <div className='input-group'>
            <label>Phone</label>
            <input type='text' name="phone" value={billingInfo.phone} onChange={handleInputChange} />
          </div>
        </div>

        <div className='billingInformation'>
          <h2>Credit Card Information</h2>
          <div className='input-group'>
            <label>Credit Card Number</label>
            <input type='text' name="creditCardNumber" value={billingInfo.creditCardNumber} onChange={handleInputChange} />
          </div>

          <div className='input-group input-group-select'>
            <label>Expiration Mo/Yr</label>
            <div className="select-container">
              <select name="expMonth" className="exp-month" value={billingInfo.expMonth} onChange={handleInputChange}>
                <option value="" disabled>Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </option>
                ))}
              </select>
              <select name="expYear" className="exp-year" value={billingInfo.expYear} onChange={handleInputChange}>
                <option value="" disabled>Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className='input-group input-group-zipcode'>
            <label>Security Code</label>
            <input type='text' name="securityCode" value={billingInfo.securityCode} onChange={handleInputChange} />
          </div>

          <div className='input-group'>
            <h3>Please read <Link href="/" style={{color:'#ccc' }}>Terms and Conditions</Link></h3>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3>I have read terms and conditions </h3>
              <input type="checkbox" className='checkboxCreditCard' checked={billingInfo.termsAccepted} onChange={handleCheckboxChange} />
            </div>
          </div>

          <button className='submitcardbtn' onClick={handleSubmit} style={{cursor:'pointer'}}>Submit</button>
          <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743303997/home/i9ytqz99fkgmked7tkud.png" className='cardaimg' alt="Accepted cards" />
       
       
        
        
        </div>
      </div>
    </div>
  );
}

export default MembershipCheckout;
