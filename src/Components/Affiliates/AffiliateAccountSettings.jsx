import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaCheckCircle,
  FaCoins,
  FaDollarSign,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaUserFriends,
  FaWallet,
} from 'react-icons/fa';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import { ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE, safeArray } from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const PAYMENT_METHODS = [
  { value: 'Venmo', label: 'Venmo ID', placeholder: '@creator-name' },
  { value: 'CashApp', label: 'Cash App ID', placeholder: '$creator-name' },
  { value: 'PayPal', label: 'PayPal email', placeholder: 'creator@example.com' },
];

const AffiliateAccountSettings = () => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentValues, setPaymentValues] = useState({ Venmo: '', CashApp: '', PayPal: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (!affiliate) return;
    const method = affiliate.preferredPaymentMethod || '';
    const value = affiliate.preferredPaymentMethodValue || '';
    setSelectedPaymentMethod(method);
    setPaymentValues({
      Venmo: method === 'Venmo' ? value : '',
      CashApp: method === 'CashApp' ? value : '',
      PayPal: method === 'PayPal' ? value : '',
    });
  }, [affiliate]);

  const balance = Number(affiliate?.tokens || 0);
  const memberCount = safeArray(affiliate?.usersJoined).length;

  const savePayment = async (event) => {
    event.preventDefault();
    if (savingPayment || !affiliate?._id) return;
    const paymentValue = paymentValues[selectedPaymentMethod]?.trim() || '';
    if (!selectedPaymentMethod || !paymentValue) {
      toast.error('Select a payment method and enter its account identifier.');
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`${API_BASE}/affiliate/updatePayment/${affiliate._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredPaymentMethod: selectedPaymentMethod,
          preferredPaymentMethodValue: paymentValue,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to save payment method');
      toast.success('Payment settings saved successfully.');
    } catch (error) {
      console.error('Error updating affiliate payment method:', error);
      toast.error(error.message || 'Failed to save payment method');
    } finally {
      setSavingPayment(false);
    }
  };

  const confirmPayout = async (event) => {
    event.preventDefault();
    if (requestingPayout || !affiliate?._id) return;
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a positive payout amount.');
      return;
    }
    if (amount > balance) {
      toast.error('Amount exceeds your current balance.');
      return;
    }

    setRequestingPayout(true);
    try {
      const response = await fetch(`${API_BASE}/affiliate/${affiliate._id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to create payout request');
      toast.success('Payout request created successfully.');
      setIsPayoutOpen(false);
      setPayoutAmount('');
    } catch (error) {
      console.error('Failed to create affiliate payout request:', error);
      toast.error(error.message || 'Failed to create payout request.');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (!affiliate) {
    return (
      <div className="experience-page affiliate-account-settings-page affiliate-auth-state">
        <div className="theme-container xp-route-loading">
          {authLoading ? 'Restoring affiliate account settings…' : 'Sign in as an affiliate to manage payment and payout settings.'}
          {!authLoading && <Link className="theme-btn theme-btn-primary" href="/auth?mode=login&role=affiliate&next=/AffiliateAccountSettings">Affiliate sign in</Link>}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Affiliate Account Settings | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-account-settings-page">
        <ExperienceHero
          eyebrow="Private affiliate account"
          title="Payment and payout."
          accent="Separated from your profile."
          description="Keep your public creator identity focused while managing private payout details in a dedicated, protected workspace."
          backgroundImage={`${FMM_ASSET_BASE}/fighter-duel-arena.jpg`}
          actions={[
            { href: '/AffiliateProfile', label: 'Creator profile' },
            { href: '/AffiliateDashboard', label: 'Affiliate dashboard', variant: 'secondary' },
          ]}
          stats={[
            { value: balance.toLocaleString(), label: 'Available balance', icon: FaCoins },
            { value: affiliate.preferredPaymentMethod || 'Not set', label: 'Payment method', icon: FaWallet },
            { value: memberCount, label: 'League members', icon: FaUserFriends },
          ]}
        />

        <AffiliateExperienceNav />

        <main className="xp-page-main">
          <div className="theme-container affiliate-account-settings-shell">
            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Private payout destination"
                title="Account settings"
                description="The original payment-method and payout endpoints remain unchanged; only their organization has moved out of the public profile editor."
              />
              <div className="affiliate-settings-two-column">
                <form className="affiliate-settings-card" onSubmit={savePayment}>
                  <div className="affiliate-settings-card-heading"><FaWallet /><span><small>Payout destination</small><h2>Payment settings</h2></span></div>
                  <p>Choose one preferred destination. The saved method is used when administrators process an approved payout request.</p>
                  <div className="affiliate-payment-method-list">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.value} className={selectedPaymentMethod === method.value ? 'is-selected' : ''}>
                        <span>
                          <input
                            type="radio"
                            name="preferredPaymentMethod"
                            value={method.value}
                            checked={selectedPaymentMethod === method.value}
                            onChange={() => setSelectedPaymentMethod(method.value)}
                          />
                          {method.label}
                        </span>
                        <input
                          type={method.value === 'PayPal' ? 'email' : 'text'}
                          value={paymentValues[method.value]}
                          onFocus={() => setSelectedPaymentMethod(method.value)}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSelectedPaymentMethod(method.value);
                            setPaymentValues((current) => ({
                              Venmo: method.value === 'Venmo' ? value : '',
                              CashApp: method.value === 'CashApp' ? value : '',
                              PayPal: method.value === 'PayPal' ? value : '',
                            }));
                          }}
                          placeholder={method.placeholder}
                        />
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="theme-btn theme-btn-primary" disabled={savingPayment}><FaSave /> {savingPayment ? 'Saving payment…' : 'Save payment method'}</button>
                </form>

                <article className="affiliate-settings-card affiliate-payout-settings-card">
                  <div className="affiliate-settings-card-heading"><FaDollarSign /><span><small>Affiliate balance</small><h2>Request a payout</h2></span></div>
                  <div className="affiliate-payout-balance"><span>Available balance</span><strong>{balance.toLocaleString()}</strong><small>Affiliate credits</small></div>
                  <p>Requests are queued for administrator review. Your existing payout endpoint and amount validation remain intact.</p>
                  <button type="button" className="theme-btn theme-btn-secondary" disabled={balance <= 0} onClick={() => setIsPayoutOpen(true)}><FaDollarSign /> Request a payout</button>
                </article>
              </div>
            </section>

            <section className="affiliate-account-security-note">
              <FaShieldAlt />
              <div><small>Account privacy</small><h2>Public profile data and payout data are now clearly separated.</h2><p>Your creator name, avatar, username, and bio remain in the profile workspace. Payment identifiers and payout requests remain on this private settings route.</p></div>
              <FaCheckCircle className="affiliate-account-security-check" />
            </section>
          </div>
        </main>

        {isPayoutOpen && (
          <div className="affiliate-settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !requestingPayout) setIsPayoutOpen(false); }}>
            <form className="affiliate-settings-modal" onSubmit={confirmPayout}>
              <button type="button" className="affiliate-settings-modal-close" onClick={() => setIsPayoutOpen(false)} disabled={requestingPayout} aria-label="Close payout request"><FaTimes /></button>
              <div className="affiliate-settings-card-heading"><FaDollarSign /><span><small>Affiliate payout</small><h2>Request funds</h2></span></div>
              <p>Your current balance is <strong>{balance.toLocaleString()}</strong>.</p>
              <label className="affiliate-settings-control"><span>Requested amount</span><input type="number" min="1" step="0.01" max={balance || undefined} value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} placeholder="0.00" autoFocus required /></label>
              <div className="affiliate-settings-modal-actions"><button type="button" className="theme-btn theme-btn-secondary" onClick={() => setIsPayoutOpen(false)} disabled={requestingPayout}>Cancel</button><button type="submit" className="theme-btn theme-btn-primary" disabled={requestingPayout}>{requestingPayout ? 'Submitting…' : 'Confirm payout'}</button></div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default AffiliateAccountSettings;
