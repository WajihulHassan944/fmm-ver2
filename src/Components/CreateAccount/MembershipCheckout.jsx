import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  FaArrowRight,
  FaCheckCircle,
  FaCoins,
  FaCreditCard,
  FaLock,
  FaShieldAlt,
  FaShoppingBag,
  FaUser,
  FaWallet,
} from 'react-icons/fa';
import ThankyouPurchaseTokens from '../Dashboard/ThankyouPurchaseTokens';
import UserWorkspaceNav from '../UserProfile/UserWorkspaceNav';

const MembershipCheckout = ({ userId }) => {
  const reduxUser = useSelector((state) => state.user);
  const [user, setUser] = useState(reduxUser || null);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    firstName: reduxUser?.firstName || '',
    lastName: reduxUser?.lastName || '',
    address: reduxUser?.billing?.address || '',
    city: reduxUser?.billing?.city || '',
    state: reduxUser?.billing?.state || '',
    zipCode: reduxUser?.zipCode || '',
    phone: reduxUser?.phone || '',
    creditCardNumber: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
    termsAccepted: false,
    amount: '10',
  });

  useEffect(() => {
    if (reduxUser?._id && reduxUser._id !== user?._id) setUser(reduxUser);
  }, [reduxUser, user?._id]);

  useEffect(() => {
    if (!user?._id && userId) {
      const fetchUser = async () => {
        try {
          const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users');
          if (!response.ok) throw new Error(`Error fetching users: ${response.statusText}`);
          const users = await response.json();
          const foundUser = Array.isArray(users) ? users.find((entry) => entry._id === userId) : null;
          if (foundUser) setUser(foundUser);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };
      fetchUser();
    }
  }, [user?._id, userId]);

  useEffect(() => {
    if (!user) return;
    setBillingInfo((previous) => ({
      ...previous,
      firstName: user.firstName || previous.firstName,
      lastName: user.lastName || previous.lastName,
      address: user.billing?.address || previous.address,
      city: user.billing?.city || previous.city,
      state: user.billing?.state || previous.state,
      zipCode: user.zipCode || previous.zipCode,
      phone: user.phone || previous.phone,
    }));
  }, [user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBillingInfo((previous) => ({ ...previous, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    setBillingInfo((previous) => ({ ...previous, termsAccepted: event.target.checked }));
  };

  const handleTokenizeCard = async (card, billingAddress, contactEmail) => {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/authorize-net/first-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: billingInfo.amount,
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
        country: 'US',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error tokenizing card');
    }

    setPaymentSuccessful(true);
    window.setTimeout(() => setPaymentSuccessful(false), 4000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!billingInfo.termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    const card = {
      name: `${billingInfo.firstName} ${billingInfo.lastName}`,
      number: billingInfo.creditCardNumber,
      exp: `${billingInfo.expMonth}/${billingInfo.expYear}`,
      cvv: billingInfo.securityCode,
    };
    const billingAddress = {
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      zipCode: billingInfo.zipCode,
      phone: billingInfo.phone,
    };

    setIsSubmitting(true);
    try {
      await handleTokenizeCard(card, billingAddress, user.email);
    } catch (error) {
      console.error('Card error:', error);
      alert(`Error card: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?._id && !user?.email) {
    return <div className="player-checkout-loading"><FaWallet /><span>Loading fight wallet…</span></div>;
  }

  if (paymentSuccessful) return <ThankyouPurchaseTokens amount={billingInfo.amount} />;

  return (
    <div className="player-checkout-page">
      <section className="player-checkout-hero">
        <div className="player-checkout-hero-grid" aria-hidden="true" />
        <div className="theme-container player-checkout-hero-layout">
          <div>
            <p><FaWallet /> Secure fight wallet</p>
            <h1>Fuel your next <span>fight card.</span></h1>
            <p>Add tokens through the existing secure payment flow and return to your predictions ready for the next matchup.</p>
            <div className="player-checkout-hero-trust">
              <span><FaShieldAlt /><strong>Secure checkout</strong><small>Existing payment endpoint preserved</small></span>
              <span><FaCoins /><strong>10 tokens</strong><small>Added to your fight wallet</small></span>
            </div>
          </div>

          <aside className="player-checkout-identity">
            <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={`${user.firstName || 'Player'} profile`} />
            <div><small>Wallet owner</small><strong>{user.firstName} {user.lastName}</strong><span>{user.currentPlan || 'Member'} plan</span></div>
            <i><FaWallet /></i>
          </aside>
        </div>
      </section>

      <UserWorkspaceNav />

      <main className="theme-container player-checkout-main">
        <section className="player-checkout-summary">
          <div className="player-checkout-package-badge"><FaCoins /></div>
          <p>Selected wallet package</p>
          <h2>10 tokens</h2>
          <div className="player-checkout-price"><span>$</span><strong>10</strong><small>.00</small></div>
          <ul>
            <li><FaCheckCircle /> Use on eligible POT fights</li>
            <li><FaCheckCircle /> Tokens are added to your wallet</li>
            <li><FaCheckCircle /> Share your fight portfolio</li>
            <li><FaCheckCircle /> Compete on FMM leaderboards</li>
          </ul>
          <div className="player-checkout-wallet-status"><FaShoppingBag /><span><small>Current balance</small><strong>{user.tokens || 0} tokens</strong></span></div>
        </section>

        <form className="player-checkout-form" onSubmit={handleSubmit}>
          <header>
            <div><p>Checkout details</p><h2>Complete your token purchase</h2></div>
            <span><FaLock /> Encrypted payment</span>
          </header>

          <section className="player-checkout-form-section">
            <div className="player-checkout-section-heading"><i><FaUser /></i><span><strong>Billing information</strong><small>Confirm the account and billing address attached to this purchase.</small></span></div>
            <div className="player-checkout-field-grid">
              <label><span>First name</span><input type="text" name="firstName" value={billingInfo.firstName} onChange={handleInputChange} disabled /></label>
              <label><span>Last name</span><input type="text" name="lastName" value={billingInfo.lastName} onChange={handleInputChange} disabled /></label>
              <label className="is-wide"><span>Address</span><input type="text" name="address" value={billingInfo.address} onChange={handleInputChange} /></label>
              <label><span>City</span><input type="text" name="city" value={billingInfo.city} onChange={handleInputChange} /></label>
              <label><span>State</span><input type="text" name="state" value={billingInfo.state} onChange={handleInputChange} /></label>
              <label><span>ZIP code</span><input type="text" name="zipCode" value={billingInfo.zipCode} onChange={handleInputChange} /></label>
              <label><span>Phone</span><input type="text" name="phone" value={billingInfo.phone} onChange={handleInputChange} /></label>
            </div>
          </section>

          <section className="player-checkout-form-section">
            <div className="player-checkout-section-heading"><i><FaCreditCard /></i><span><strong>Card information</strong><small>Enter the same card details used by the existing Authorize.Net flow.</small></span></div>
            <div className="player-checkout-field-grid">
              <label className="is-wide"><span>Credit card number</span><input type="text" name="creditCardNumber" value={billingInfo.creditCardNumber} onChange={handleInputChange} inputMode="numeric" autoComplete="cc-number" /></label>
              <label><span>Expiration month</span><select name="expMonth" value={billingInfo.expMonth} onChange={handleInputChange}><option value="" disabled>Month</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, '0')}</option>)}</select></label>
              <label><span>Expiration year</span><select name="expYear" value={billingInfo.expYear} onChange={handleInputChange}><option value="" disabled>Year</option>{Array.from({ length: 10 }, (_, index) => { const year = new Date().getFullYear() + index; return <option key={year} value={year}>{year}</option>; })}</select></label>
              <label><span>Security code</span><input type="text" name="securityCode" value={billingInfo.securityCode} onChange={handleInputChange} inputMode="numeric" autoComplete="cc-csc" /></label>
            </div>
          </section>

          <label className="player-checkout-terms">
            <input type="checkbox" checked={billingInfo.termsAccepted} onChange={handleCheckboxChange} />
            <span>I have read and accept the <Link href="/terms-of-service">terms and conditions</Link>.</span>
          </label>

          <div className="player-checkout-submit-row">
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743303997/home/i9ytqz99fkgmked7tkud.png" alt="Accepted payment cards" />
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing…' : 'Purchase 10 tokens'} <FaArrowRight /></button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default MembershipCheckout;
