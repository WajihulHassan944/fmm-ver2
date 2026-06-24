import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBell,
  FaCheckCircle,
  FaCoins,
  FaCreditCard,
  FaEnvelope,
  FaGlobeAmericas,
  FaIdBadge,
  FaMoneyCheckAlt,
  FaShieldAlt,
  FaUserCog,
} from 'react-icons/fa';
import AddTokensToWallet from './AddTokensToWallet';
import MembershipCheckout from '../CreateAccount/MembershipCheckout';
import UserWorkspaceNav from './UserWorkspaceNav';

const UserAccountSettings = () => {
  const router = useRouter();
  const user = useSelector((state) => state.user);

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(Boolean(user?.isNotificationsEnabled));
  const [isSubscribed, setIsSubscribed] = useState(Boolean(user?.isSubscribed));
  const [isUSCitizen, setIsUSCitizen] = useState(Boolean(user?.isUSCitizen));
  const [venmoId, setVenmoId] = useState('');
  const [cashAppId, setCashAppId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(user?.preferredPaymentMethod || '');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [activeView, setActiveView] = useState(null);

  useEffect(() => {
    if (!user) return;
    setIsNotificationsEnabled(Boolean(user.isNotificationsEnabled));
    setIsSubscribed(Boolean(user.isSubscribed));
    setIsUSCitizen(Boolean(user.isUSCitizen));
    setSelectedPaymentMethod(user.preferredPaymentMethod || '');
    const paymentValue = user.preferredPaymentMethodValue || '';
    setVenmoId(user.preferredPaymentMethod === 'Venmo' ? paymentValue : '');
    setCashAppId(user.preferredPaymentMethod === 'CashApp' ? paymentValue : '');
    setPaypalEmail(user.preferredPaymentMethod === 'PayPal' ? paymentValue : '');
  }, [user]);

  if (!user?.firstName) {
    return <div className="player-dynamic-empty"><FaUserCog /><h2>Loading account settings…</h2></div>;
  }

  if (activeView === 'tokens') {
    return (
      <section className="player-account-nested-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setActiveView(null)}><FaArrowLeft /> Back to account settings</button></div>
        <AddTokensToWallet userId={user._id} />
      </section>
    );
  }

  if (activeView === 'billing') {
    return (
      <section className="player-account-nested-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setActiveView(null)}><FaArrowLeft /> Back to account settings</button></div>
        <MembershipCheckout userId={user._id} email={user.email} name={`${user.firstName} ${user.lastName}`} avatar={user.profileUrl} />
      </section>
    );
  }

  const savePreferences = async (event) => {
    event.preventDefault();
    setSavingPreferences(true);

    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('firstName', user.firstName || '');
        formData.append('lastName', user.lastName || '');
        formData.append('playerName', user.playerName || '');
        formData.append('phone', user.phone || '');
        formData.append('zipCode', user.zipCode || '');
        formData.append('shortBio', user.shortBio || '');
        formData.append('isNotificationsEnabled', isNotificationsEnabled);
        formData.append('isSubscribed', isSubscribed);
        formData.append('isUSCitizen', isUSCitizen);

        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/update-profile/${user._id}`, {
          method: 'PUT',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to update account preferences');
        resolve(await response.json());
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });

    toast.promise(updatePromise, {
      pending: 'Saving account preferences...',
      success: 'Account preferences saved! 👌',
      error: { render: ({ data }) => data?.message || 'Failed to save account preferences' },
    }).finally(() => setSavingPreferences(false));
  };

  const selectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    if (method !== 'Venmo') setVenmoId('');
    if (method !== 'CashApp') setCashAppId('');
    if (method !== 'PayPal') setPaypalEmail('');
  };

  const savePaymentMethod = async (event) => {
    event.preventDefault();
    setSavingPayment(true);

    const methodValues = {
      Venmo: venmoId.trim(),
      CashApp: cashAppId.trim(),
      PayPal: paypalEmail.trim(),
    };
    const preferredPaymentMethod = selectedPaymentMethod
      || (venmoId.trim() ? 'Venmo' : cashAppId.trim() ? 'CashApp' : paypalEmail.trim() ? 'PayPal' : '');
    const preferredPaymentMethodValue = methodValues[preferredPaymentMethod] || '';

    if (!preferredPaymentMethod || !preferredPaymentMethodValue) {
      toast.error('Please choose a payment method and enter its account value.');
      setSavingPayment(false);
      return;
    }

    const paymentPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/user/updatePayment/${user._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredPaymentMethod, preferredPaymentMethodValue }),
        });
        if (!response.ok) throw new Error('Failed to save payment method.');
        resolve(await response.json());
      } catch (error) {
        console.error('Error updating payment method:', error);
        reject(error);
      }
    });

    toast.promise(paymentPromise, {
      pending: 'Saving payment method...',
      success: 'Payment settings saved successfully! 👌',
      error: { render: ({ data }) => data?.message || 'Failed to save payment method' },
    }).finally(() => setSavingPayment(false));
  };

  const paymentMethods = [
    { key: 'Venmo', label: 'Venmo ID', value: venmoId, setter: setVenmoId, color: '#4997cf', image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008104/affiliateGuide/dlncedhoow0psafar6sp.png' },
    { key: 'CashApp', label: 'Cash App ID', value: cashAppId, setter: setCashAppId, color: '#00d54b', image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008182/affiliateGuide/kxgccvamkih3l4pupenh.png' },
    { key: 'PayPal', label: 'PayPal email address', value: paypalEmail, setter: setPaypalEmail, color: '#168fe6', image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008237/affiliateGuide/fg8ozrnkepmtv3r7wqli.png' },
  ];

  return (
    <div className="player-account-page">
      <section className="player-account-hero">
        <div className="theme-container player-account-hero-layout">
          <div>
            <button type="button" onClick={() => router.back()}><FaArrowLeft /> Previous page</button>
            <p><FaUserCog /> Private account workspace</p>
            <h1>Preferences. Payments. <span>Fight wallet.</span></h1>
            <p>Manage private communication preferences, residency confirmation, payment method, billing details, and wallet access separately from your public player profile.</p>
          </div>
          <aside>
            <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
            <span><small>Account holder</small><strong>{user.firstName} {user.lastName}</strong><em>{user.email}</em></span>
            <Link href="/profile"><FaIdBadge /> Public profile</Link>
          </aside>
        </div>
      </section>

      <UserWorkspaceNav />

      <main className="theme-container player-account-main">
        <section className="player-account-summary-grid">
          <article><FaCoins /><span><small>Wallet balance</small><strong>{user.tokens || 0} tokens</strong></span><button type="button" onClick={() => setActiveView('tokens')}>Add tokens</button></article>
          <article><FaCreditCard /><span><small>Billing workspace</small><strong>Payment details</strong></span><button type="button" onClick={() => setActiveView('billing')}>Open billing</button></article>
          <article><FaShieldAlt /><span><small>Profile status</small><strong>{user.verified ? 'Verified' : 'Active'}</strong></span><Link href="/profile">View profile</Link></article>
        </section>

        <section className="player-account-layout">
          <form className="player-account-panel" onSubmit={savePreferences}>
            <header><div><p>Communication and eligibility</p><h2>Account preferences</h2></div><FaBell /></header>
            <div className="player-account-toggle-list">
              <label>
                <input type="checkbox" checked={isNotificationsEnabled} onChange={(event) => setIsNotificationsEnabled(event.target.checked)} />
                <span><i><FaBell /></i><strong>SMS activity notifications</strong><small>I would like to be sent activity notifications via SMS.</small></span>
                <b aria-hidden="true" />
              </label>
              <label>
                <input type="checkbox" checked={isSubscribed} onChange={(event) => setIsSubscribed(event.target.checked)} />
                <span><i><FaEnvelope /></i><strong>FMMA E-list</strong><small>Subscribe to platform updates and promotions.</small></span>
                <b aria-hidden="true" />
              </label>
              <label>
                <input type="checkbox" checked={isUSCitizen} onChange={(event) => setIsUSCitizen(event.target.checked)} />
                <span><i><FaGlobeAmericas /></i><strong>United States residency</strong><small>I am a US citizen and reside in the United States.</small></span>
                <b aria-hidden="true" />
              </label>
              <label className="is-locked">
                <input type="checkbox" checked readOnly />
                <span><i><FaCheckCircle /></i><strong>Terms and conditions</strong><small>I have read and agree to the existing platform terms and conditions.</small></span>
                <b aria-hidden="true" />
              </label>
            </div>
            <button type="submit" className="player-account-save" disabled={savingPreferences}>{savingPreferences ? 'Saving preferences…' : 'Save preferences'} <FaArrowRight /></button>
          </form>

          <form className="player-account-panel" onSubmit={savePaymentMethod}>
            <header><div><p>Preferred payout destination</p><h2>Payment method</h2></div><FaMoneyCheckAlt /></header>
            <p className="player-account-panel-intro">Choose one existing payout method and save its identifier using the original user payment endpoint.</p>
            <div className="player-payment-method-list">
              {paymentMethods.map(({ key, label, value, setter, color, image }) => (
                <label key={key} className={selectedPaymentMethod === key ? 'is-selected' : ''} style={{ '--payment-accent': color }}>
                  <input type="radio" name="paymentMethod" checked={selectedPaymentMethod === key} onChange={() => selectPaymentMethod(key)} />
                  <img src={image} alt={key} />
                  <span><strong>{key}</strong><small>{label}</small><input type={key === 'PayPal' ? 'email' : 'text'} value={value} onFocus={() => selectPaymentMethod(key)} onChange={(event) => { selectPaymentMethod(key); setter(event.target.value); }} /></span>
                  <b aria-hidden="true" />
                </label>
              ))}
            </div>
            <button type="submit" className="player-account-save" disabled={savingPayment}>{savingPayment ? 'Saving payment method…' : 'Save payment method'} <FaArrowRight /></button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default UserAccountSettings;
