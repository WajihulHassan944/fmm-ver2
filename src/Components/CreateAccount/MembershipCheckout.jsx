import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaCheck, FaCoins, FaLock, FaMinus, FaPlus, FaShieldAlt } from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const PACKS = [
  { sku: 'fm-1000', coins: 1000, priceCents: 99, label: 'Starter' },
  { sku: 'fm-5000', coins: 5000, priceCents: 399, label: 'Most popular', popular: true },
  { sku: 'fm-15000', coins: 15000, priceCents: 999, label: 'Power pack' },
];

const FM_PLUS_PLANS = [
  { id: 'monthly', label: 'Monthly', priceCents: 499, description: 'Auto-renews · cancel anytime', badge: 'BEST FOR REGULAR PLAY' },
  { id: 'pass', label: '30-day pass', priceCents: 499, description: 'One-time payment · no auto-renew', badge: 'NO AUTO-RENEW' },
];

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const parseCartQuery = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = {};
  String(raw).split(',').forEach((entry) => {
    const [sku, quantityValue] = entry.split(':');
    if (!PACKS.some((pack) => pack.sku === sku)) return;
    const quantity = Math.min(10, Math.max(0, Number(quantityValue || 0)));
    if (quantity > 0) parsed[sku] = quantity;
  });
  return Object.keys(parsed).length ? parsed : null;
};

const splitName = (name = '') => {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  return { firstName: pieces.shift() || '', lastName: pieces.join(' ') || '' };
};

export default function MembershipCheckout() {
  const router = useRouter();
  const user = useSelector((state) => state?.user?.user || state?.user || null);
  const isFmPlus = String(router.query.product || '').toLowerCase() === 'fm-plus';
  const requestedAmount = Number(router.query.amount || 0);
  const initialSku = PACKS.find((pack) => pack.coins === requestedAmount)?.sku || 'fm-5000';
  const [cart, setCart] = useState(() => ({ [initialSku]: 1 }));
  const [showPacks, setShowPacks] = useState(false);
  const [fmPlusPlan, setFmPlusPlan] = useState('pass');
  const [form, setForm] = useState({
    name: [user?.firstName, user?.lastName].filter(Boolean).join(' '), email: user?.email || '', phone: user?.phone || '',
    address: user?.billing?.address || '', city: user?.billing?.city || '', state: user?.billing?.state || '',
    zipCode: user?.billing?.zip || user?.zipCode || '', country: user?.billing?.country || 'US',
    ageConfirmed: false, termsAccepted: false,
  });
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const idempotencyKey = useRef('');
  const returnOrder = String(router.query.order || '').trim();
  const checkoutReturnStatus = String(router.query.status || '').trim().toLowerCase();
  const requestedReturnTo = String(router.query.returnTo || '').trim();
  const safeReturnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/';

  useEffect(() => {
    if (!router.isReady) return;
    if (isFmPlus) {
      const requestedPlan = String(router.query.plan || '').toLowerCase();
      if (requestedPlan === 'pass') setFmPlusPlan(requestedPlan);
      return;
    }
    const requestedCart = parseCartQuery(router.query.cart);
    if (requestedCart) setCart(requestedCart);
    else if (requestedAmount) {
      const requestedPack = PACKS.find((pack) => pack.coins === requestedAmount);
      if (requestedPack) setCart({ [requestedPack.sku]: 1 });
    }
  }, [isFmPlus, requestedAmount, router.isReady, router.query.cart, router.query.plan]);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => ({
      ...current,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || current.name,
      email: user.email || current.email,
      phone: user.phone || current.phone,
      address: user.billing?.address || current.address,
      city: user.billing?.city || current.city,
      state: user.billing?.state || current.state,
      zipCode: user.billing?.zip || user.zipCode || current.zipCode,
      country: user.billing?.country || current.country,
    }));
  }, [user]);

  useEffect(() => {
    if (!router.isReady || !returnOrder || checkoutReturnStatus !== 'return') return undefined;
    let active = true;
    let attempts = 0;
    const checkStatus = async () => {
      attempts += 1;
      const response = await fetch(buildPublicApiUrl(`/api/checkout/orders/${encodeURIComponent(returnOrder)}/status`)).catch(() => null);
      const payload = response?.ok ? await response.json().catch(() => ({})) : {};
      if (!active) return;
      if (payload.status === 'CREDITED') {
        setPaymentResult({ state: 'success', ...payload });
        return;
      }
      if (payload.status === 'FAILED' || payload.status === 'CANCELLED') {
        setPaymentResult({ state: 'failed', ...payload });
        return;
      }
      setPaymentResult({ state: attempts >= 6 ? 'pending' : 'checking', orderNumber: returnOrder });
      if (attempts < 6) window.setTimeout(checkStatus, 1800);
    };
    checkStatus();
    return () => { active = false; };
  }, [checkoutReturnStatus, returnOrder, router.isReady]);

  const items = useMemo(() => PACKS.map((pack) => ({ ...pack, quantity: Math.max(0, Number(cart[pack.sku] || 0)) })).filter((pack) => pack.quantity > 0), [cart]);
  const selectedPlan = FM_PLUS_PLANS.find((plan) => plan.id === fmPlusPlan) || FM_PLUS_PLANS[0];
  const subtotalCents = isFmPlus ? selectedPlan.priceCents : items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const baseCoins = items.reduce((sum, item) => sum + item.coins * item.quantity, 0);
  const firstPurchaseEligible = !isFmPlus && user?.hasReceivedFirstPurchaseBonus !== true;
  const bonusCoins = firstPurchaseEligible ? baseCoins : 0;
  const creditedCoins = isFmPlus ? 1000 : baseCoins + bonusCoins;

  const changeQuantity = (sku, delta) => {
    idempotencyKey.current = '';
    setCart((current) => ({ ...current, [sku]: Math.min(10, Math.max(0, Number(current[sku] || 0) + delta)) }));
  };

  const choosePack = (sku) => {
    idempotencyKey.current = '';
    setCart({ [sku]: 1 });
    setShowPacks(false);
  };

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!isFmPlus && !items.length) return setStatus('Choose at least one coin pack to continue.');
    if (!form.ageConfirmed || !form.termsAccepted) return setStatus('Confirm age eligibility and accept the terms to continue.');
    const name = splitName(form.name);
    if (!user?.email && (!name.firstName || !name.lastName)) return setStatus('Enter the first and last name shown on the payment card.');
    setSubmitting(true);
    setStatus('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      if (!idempotencyKey.current) {
        idempotencyKey.current = typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `fmm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      const response = await fetch(buildPublicApiUrl(isFmPlus ? '/api/checkout/fm-plus-orders' : '/api/checkout/coin-orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...(isFmPlus ? { plan: fmPlusPlan } : { items: items.map(({ sku, quantity }) => ({ sku, quantity })) }),
          email: form.email,
          billing: { ...form, ...name },
          returnUrl: `${window.location.origin}/checkout?product=${isFmPlus ? 'fm-plus' : 'fm-coins'}&status=return${safeReturnTo !== '/' ? `&returnTo=${encodeURIComponent(safeReturnTo)}` : ''}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Secure checkout could not be created.');
      if (!payload.checkoutUrl) throw new Error('Secure payment is not configured yet.');
      if (payload.checkoutMethod === 'POST' && payload.formToken) {
        const hostedForm = document.createElement('form');
        hostedForm.method = 'POST';
        hostedForm.action = payload.checkoutUrl;
        hostedForm.style.display = 'none';
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = payload.formToken;
        hostedForm.appendChild(tokenInput);
        document.body.appendChild(hostedForm);
        hostedForm.submit();
        return;
      }
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setStatus(error.message || 'Secure checkout could not be started.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isFmPlus ? 'FM+ Checkout' : 'FM Coin Checkout'} | Fantasy MMAdness</title>
        <meta name="description" content={isFmPlus ? 'Choose an FM+ plan and continue to secure payment.' : 'Review FM coin packs and continue to secure Fantasy MMAdness payment.'} />
      </Head>
      <main className="fm-cart-page">
        <div className="fm-cart-shell">
          <header className="fm-cart-header">
            <Link href="/" aria-label="Back to Fantasy MMAdness"><FaArrowLeft /></Link>
            <div className="fm-cart-heading">
              <h1>{isFmPlus ? '⭐ FM+ CHECKOUT' : '🪙 FM COIN CHECKOUT'}</h1>
              <p>{isFmPlus ? 'Choose how you want to unlock FM+.' : `${creditedCoins.toLocaleString()} FM coins · secure encrypted checkout`}</p>
            </div>
            <i aria-hidden="true"><FaLock /></i>
          </header>

          {checkoutReturnStatus === 'cancelled' ? <section className="fm-checkout-card fm-payment-result is-cancelled">
            <FaArrowLeft /><h2>PAYMENT CANCELLED</h2><p>No payment was charged or credited. Your selection is still available if you want to try again.</p><Link href={`/checkout?product=${isFmPlus ? 'fm-plus&plan=pass' : 'fm-coins'}`}>RETURN TO CHECKOUT</Link>
          </section> : checkoutReturnStatus === 'return' ? <section className={`fm-checkout-card fm-payment-result is-${paymentResult?.state || 'checking'}`}>
            {paymentResult?.state === 'success' ? <FaCheck /> : <FaShieldAlt />}
            <h2>{paymentResult?.state === 'success' ? 'PAYMENT CONFIRMED' : paymentResult?.state === 'failed' ? 'PAYMENT NEEDS ATTENTION' : paymentResult?.state === 'pending' ? 'PAYMENT IS PROCESSING' : 'VERIFYING PAYMENT'}</h2>
            <p>{paymentResult?.state === 'success'
              ? `${Number(paymentResult.creditedCoins || 0).toLocaleString()} FM has been credited successfully.`
              : paymentResult?.state === 'failed'
                ? paymentResult.message || 'The payment could not be confirmed. Please contact support with the order reference.'
                : 'The secure processor is confirming the transaction. Coins are credited only after approval.'}</p>
            <small>ORDER: {returnOrder || 'PENDING'}</small>
            <Link href={paymentResult?.state === 'success' ? safeReturnTo : `/checkout?product=${isFmPlus ? 'fm-plus&plan=pass' : 'fm-coins'}`}>{paymentResult?.state === 'success' ? (safeReturnTo === '/' ? 'RETURN HOME' : 'CONTINUE') : 'RETURN TO CHECKOUT'}</Link>
          </section> : <form onSubmit={submit}>
            {isFmPlus ? (
              <section className="fm-checkout-card fm-plus-products">
                <div className="fm-card-title"><span>1</span><div><h2>Choose your FM+ plan</h2><p>Both plans unlock the same benefits.</p></div></div>
                <div className="fm-plus-plan-grid">
                  {FM_PLUS_PLANS.map((plan) => <button type="button" key={plan.id} disabled={plan.id === 'monthly'} className={fmPlusPlan === plan.id ? 'is-active' : ''} onClick={() => { setFmPlusPlan(plan.id); idempotencyKey.current = ''; }}>
                    <b>{plan.id === 'monthly' ? 'COMING SOON' : plan.badge}</b><span>{plan.label}</span><strong>{money(plan.priceCents)}{plan.id === 'monthly' ? '/mo' : ''}</strong><small>{plan.id === 'monthly' ? 'Available after recurring billing is activated' : plan.description}</small>
                  </button>)}
                </div>
                <aside className="fm-plus-benefits"><strong>FM+ BENEFITS</strong>{['1,000 bonus FM coins', 'Early Fantasy Card access', 'Exclusive FM+ leagues', 'No ads', '25 FM streak saves'].map((benefit) => <span key={benefit}><FaCheck /> {benefit}</span>)}</aside>
              </section>
            ) : (
              <section className="fm-checkout-card fm-line-items">
                {items.length ? items.map((item) => <article key={item.sku}>
                  <div className="fm-pack-coin">FM</div>
                  <div className="fm-pack-copy"><strong>{item.coins.toLocaleString()} FM COIN PACK</strong><span>{(item.coins * item.quantity).toLocaleString()} FM coins</span><b>{money(item.priceCents * item.quantity)}</b><button type="button" onClick={() => changeQuantity(item.sku, -item.quantity)}>Remove</button></div>
                  <div className="fm-qty"><button type="button" onClick={() => changeQuantity(item.sku, -1)} aria-label={`Decrease ${item.coins} FM quantity`}><FaMinus /></button><b>{item.quantity}</b><button type="button" onClick={() => changeQuantity(item.sku, 1)} aria-label={`Increase ${item.coins} FM quantity`}><FaPlus /></button></div>
                </article>) : <div className="fm-empty-cart"><FaCoins /><strong>Choose a coin pack</strong><p>Select the amount you want credited to your fight wallet.</p></div>}
                <button className="fm-change-pack" type="button" onClick={() => setShowPacks((value) => !value)}>{showPacks ? 'CLOSE PACK OPTIONS' : items.length ? 'CHANGE OR ADD A PACK' : 'SHOW COIN PACKS'}</button>
                {showPacks || !items.length ? <div className="fm-pack-picker">{PACKS.map((pack) => <button type="button" key={pack.sku} onClick={() => choosePack(pack.sku)} className={pack.popular ? 'is-popular' : ''}>{pack.popular ? <b>MOST POPULAR</b> : null}<span>{pack.coins.toLocaleString()} FM</span><strong>{money(pack.priceCents)}</strong></button>)}</div> : null}
              </section>
            )}

            <aside className="fm-checkout-card fm-cart-summary">
              <h2>ORDER SUMMARY</h2>
              {isFmPlus ? <p><span>FM+ {selectedPlan.label}</span><strong>{money(selectedPlan.priceCents)}</strong></p> : <>
                <p><span>Subtotal</span><strong>{money(subtotalCents)}</strong></p>
                <p><span>Coin pack</span><strong>{baseCoins.toLocaleString()} FM</strong></p>
                {firstPurchaseEligible && baseCoins > 0 ? <p className="is-bonus"><span>🎁 First-purchase bonus</span><strong>+{bonusCoins.toLocaleString()} FM</strong></p> : null}
                <p><span>FM coins credited</span><strong>{creditedCoins.toLocaleString()} FM</strong></p>
              </>}
              <p className="is-total"><span>Total</span><strong>{money(subtotalCents)}</strong></p>
              <small>Digital purchase — coins credit to your wallet immediately after confirmed payment. No shipping required.</small>
            </aside>

            <section className="fm-checkout-card fm-cart-billing">
              {user?.email
                ? <aside className="fm-cart-account is-signed-in"><FaCheck /><span><strong>Signed in as {user.email}</strong><small>{isFmPlus ? 'FM+ benefits apply to this player account after confirmed payment.' : 'Coins credit directly to this player wallet after confirmed payment.'}</small></span></aside>
                : <aside className="fm-cart-account"><FaCoins /><span><strong>Your player account is created automatically</strong><small>We use the details below, include 500 FM welcome coins, and email a single-use link to set your password. No separate sign-up form.</small></span></aside>}
              <div className="fm-card-title"><span>{isFmPlus ? '2' : '1'}</span><div><h2>BILLING DETAILS</h2><p>Must match the billing address on your card.</p></div></div>
              <div className="fm-cart-fields">
                <label className="is-wide"><span>NAME ON CARD *</span><input name="name" required value={form.name} onChange={update} autoComplete="cc-name" placeholder="Jordan Reyes" /></label>
                <label className="is-wide"><span>EMAIL (RECEIPT) *</span><input name="email" type="email" required value={form.email} onChange={update} autoComplete="email" placeholder="you@email.com" /></label>
                <label className="is-wide"><span>PHONE</span><input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" /></label>
                <label className="is-wide"><span>BILLING ADDRESS *</span><input name="address" required value={form.address} onChange={update} autoComplete="street-address" /></label>
                <label><span>CITY *</span><input name="city" required value={form.city} onChange={update} autoComplete="address-level2" /></label>
                <label><span>STATE / REGION *</span><input name="state" required value={form.state} onChange={update} autoComplete="address-level1" /></label>
                <label><span>ZIP / POSTAL *</span><input name="zipCode" required value={form.zipCode} onChange={update} autoComplete="postal-code" /></label>
                <label><span>COUNTRY *</span><input name="country" required value={form.country} onChange={update} autoComplete="country" /></label>
              </div>
              <label className="fm-cart-check"><input type="checkbox" name="ageConfirmed" checked={form.ageConfirmed} onChange={update} /><span>I confirm that I am 18 or older and eligible to purchase.</span></label>
              <label className="fm-cart-check"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} /><span>I accept the <Link href="/terms-of-service">terms</Link> and <Link href="/privacy-policy">privacy policy</Link>.</span></label>
              <button className="fm-pay-button" type="submit" disabled={submitting || (!isFmPlus && !items.length)}>{submitting ? 'CREATING SECURE CHECKOUT…' : `PAY ${money(subtotalCents)} · ${isFmPlus ? `START ${selectedPlan.label.toUpperCase()}` : `GET ${creditedCoins.toLocaleString()} FM`}`}</button>
              <small className="fm-security-note"><FaShieldAlt /> Card details are entered on the secure payment page. Fantasy MMAdness never sees or stores your card number.</small>
              {status ? <p className="fm-cart-status" role="alert">{status}</p> : null}
            </section>
          </form>}
        </div>
      </main>
      <style jsx>{`
        .fm-cart-page{min-height:100vh;background:radial-gradient(circle at 20% 0%,rgba(242,181,68,.13),transparent 30rem),#05060a;color:#fff;padding:30px 16px 56px;font-family:Rajdhani,sans-serif;-webkit-font-smoothing:antialiased}.fm-cart-page *{box-sizing:border-box}.fm-cart-shell{width:min(680px,100%);margin:0 auto}.fm-cart-header{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:12px;align-items:center;margin-bottom:16px}.fm-cart-header>a,.fm-cart-header>i{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#11141b;color:#fff;font-style:normal}.fm-cart-header>a{color:#9eb8ff}.fm-cart-heading{min-width:0}.fm-cart-heading h1{margin:0;color:#f2b544;font-family:Anton,sans-serif;font-size:25px;line-height:1.05;letter-spacing:.02em}.fm-cart-heading p{margin:4px 0 0;color:rgba(255,255,255,.55);font-size:11px;font-weight:800}.fm-cart-shell form{display:flex;flex-direction:column;gap:14px}.fm-checkout-card{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:linear-gradient(160deg,rgba(255,255,255,.065),rgba(255,255,255,.025));padding:16px;box-shadow:0 14px 36px rgba(0,0,0,.2)}.fm-line-items article{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:12px;align-items:center;padding:2px 0 14px;border-bottom:1px solid rgba(255,255,255,.09)}.fm-pack-coin{width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 25%,#fff2a8,#ffd338 46%,#b17800);color:#674100;font-weight:1000;box-shadow:0 0 18px rgba(242,181,68,.28)}.fm-pack-copy{min-width:0}.fm-pack-copy strong,.fm-pack-copy span,.fm-pack-copy b{display:block}.fm-pack-copy strong{color:#fff;font-size:12px}.fm-pack-copy span{margin-top:2px;color:rgba(255,255,255,.55);font-size:10px;font-weight:800}.fm-pack-copy b{margin-top:3px;color:#f2b544;font-size:12px}.fm-pack-copy button,.fm-change-pack{border:0;background:transparent;color:rgba(255,255,255,.5);font:800 9px Rajdhani,sans-serif;text-decoration:underline;padding:4px 0 0;cursor:pointer}.fm-qty{display:flex;align-items:center;gap:7px;padding:4px 7px;border:1px solid rgba(255,255,255,.23);border-radius:999px}.fm-qty button{width:25px;height:25px;display:grid;place-items:center;border:0;background:transparent;color:#fff;cursor:pointer}.fm-qty button:last-child{color:#f2b544}.fm-qty svg{width:9px}.fm-qty b{min-width:13px;text-align:center}.fm-change-pack{display:block;margin:10px 0 0 auto;color:#9eb8ff;text-decoration:none}.fm-pack-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.fm-pack-picker button{position:relative;min-width:0;padding:13px 6px;border:1px solid rgba(255,255,255,.15);border-radius:11px;background:rgba(255,255,255,.04);color:#fff;cursor:pointer}.fm-pack-picker span,.fm-pack-picker strong{display:block}.fm-pack-picker span{font-size:12px;font-weight:1000}.fm-pack-picker strong{margin-top:3px;color:#f2b544}.fm-pack-picker b{position:absolute;top:-7px;left:50%;transform:translateX(-50%);padding:2px 6px;border-radius:999px;background:#f2b544;color:#2b1b00;font-size:6.5px;white-space:nowrap}.fm-pack-picker .is-popular{border-color:rgba(242,181,68,.55)}.fm-empty-cart{text-align:center;padding:12px}.fm-empty-cart svg{font-size:28px;color:#f2b544}.fm-empty-cart strong{display:block;margin-top:6px}.fm-empty-cart p{margin:3px 0 0;color:rgba(255,255,255,.5);font-size:11px}.fm-cart-summary h2{margin:0 0 8px;color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.08em}.fm-cart-summary p{display:flex;justify-content:space-between;gap:14px;margin:0;padding:5px 0;color:rgba(255,255,255,.72);font-size:12px;font-weight:800}.fm-cart-summary p strong{color:#fff;white-space:nowrap}.fm-cart-summary p.is-bonus,.fm-cart-summary p.is-bonus strong{color:#22c55e}.fm-cart-summary p.is-total{margin-top:7px;padding-top:11px;border-top:1px solid rgba(255,255,255,.16);color:#f2b544;font-size:17px;font-weight:1000}.fm-cart-summary p.is-total strong{color:#f2b544}.fm-cart-summary>small{display:block;margin-top:8px;color:rgba(255,255,255,.45);font-size:10px;font-weight:700;line-height:1.45}.fm-cart-account{display:flex;gap:10px;align-items:flex-start;margin-bottom:14px;padding:12px;border:1px solid rgba(242,181,68,.4);border-radius:11px;background:rgba(242,181,68,.08)}.fm-cart-account>svg{flex:0 0 auto;margin-top:2px;color:#f2b544}.fm-cart-account strong,.fm-cart-account small{display:block}.fm-cart-account strong{color:#f2b544;font-size:11px}.fm-cart-account small{margin-top:3px;color:rgba(255,255,255,.65);font-size:10px;font-weight:700;line-height:1.45}.fm-cart-account.is-signed-in{border-color:rgba(34,197,94,.38);background:rgba(34,197,94,.07)}.fm-cart-account.is-signed-in svg,.fm-cart-account.is-signed-in strong{color:#22c55e}.fm-card-title{display:flex;gap:10px;align-items:flex-start;margin-bottom:13px}.fm-card-title>span{flex:0 0 28px;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#f2b544;color:#2b1b00;font-weight:1000}.fm-card-title h2{margin:0;font-family:Anton,sans-serif;font-size:19px;line-height:1.05}.fm-card-title p{margin:3px 0 0;color:rgba(255,255,255,.48);font-size:10px;font-weight:800}.fm-cart-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fm-cart-fields label{min-width:0}.fm-cart-fields label.is-wide{grid-column:1/-1}.fm-cart-fields span{display:block;margin-bottom:4px;color:rgba(255,255,255,.58);font-size:9px;font-weight:1000;letter-spacing:.04em}.fm-cart-fields input{width:100%;height:41px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:rgba(255,255,255,.05);color:#fff;padding:0 11px;font:800 12px Rajdhani,sans-serif;outline:none}.fm-cart-fields input:focus{border-color:#f2b544;box-shadow:0 0 0 2px rgba(242,181,68,.12)}.fm-cart-check{display:flex;gap:8px;align-items:flex-start;margin-top:12px;color:rgba(255,255,255,.6);font-size:10px;font-weight:800;line-height:1.45}.fm-cart-check input{margin:2px 0 0;accent-color:#22c55e}.fm-cart-check a{color:#f2b544}.fm-pay-button{width:100%;min-height:50px;margin-top:15px;border:0;border-radius:999px;background:linear-gradient(90deg,#ffd873,#f2b544);color:#2b1b00;font:1000 13px Rajdhani,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 7px 22px rgba(242,181,68,.25)}.fm-pay-button:disabled{opacity:.55;cursor:not-allowed}.fm-security-note{display:flex;justify-content:center;gap:6px;margin-top:10px;color:rgba(255,255,255,.48);font-size:9.5px;font-weight:700;line-height:1.4;text-align:center}.fm-security-note svg{flex:0 0 auto;margin-top:2px;color:#22c55e}.fm-cart-status{margin:10px 0 0;padding:9px;border-radius:8px;background:rgba(239,68,68,.1);color:#ff9a9a;font-size:11px;font-weight:900;text-align:center}.fm-plus-plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fm-plus-plan-grid button{min-height:135px;padding:16px 12px;border:1.5px solid rgba(255,255,255,.14);border-radius:13px;background:rgba(255,255,255,.045);color:#fff;text-align:left;cursor:pointer}.fm-plus-plan-grid button:disabled{opacity:.42;cursor:not-allowed}.fm-plus-plan-grid button.is-active{border-color:#a855f7;background:rgba(168,85,247,.14);box-shadow:0 0 22px rgba(168,85,247,.24)}.fm-plus-plan-grid b,.fm-plus-plan-grid span,.fm-plus-plan-grid strong,.fm-plus-plan-grid small{display:block}.fm-plus-plan-grid b{color:#d8a8ff;font-size:8px}.fm-plus-plan-grid span{margin-top:9px;font-family:Anton,sans-serif;font-size:21px}.fm-plus-plan-grid strong{color:#f2b544;font-size:19px}.fm-plus-plan-grid small{margin-top:4px;color:rgba(255,255,255,.58);font-weight:700}.fm-plus-benefits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px;padding:12px;border:1px solid rgba(168,85,247,.35);border-radius:11px;background:rgba(168,85,247,.08)}.fm-plus-benefits>strong{grid-column:1/-1;color:#d8a8ff;font-size:11px}.fm-plus-benefits span{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.75);font-size:11px;font-weight:800}.fm-plus-benefits svg{flex:0 0 auto;color:#22c55e}
        .fm-payment-result{text-align:center;padding:34px 22px}.fm-payment-result>svg{font-size:38px;color:#f2b544}.fm-payment-result.is-success>svg{color:#22c55e}.fm-payment-result h2{margin:12px 0 7px;font-family:Anton,sans-serif;font-size:25px;color:#fff}.fm-payment-result p{margin:0 auto;max-width:480px;color:rgba(255,255,255,.68);font-weight:700;line-height:1.5}.fm-payment-result small{display:block;margin-top:12px;color:rgba(255,255,255,.38);font-size:9px;overflow-wrap:anywhere}.fm-payment-result>a{display:grid;place-items:center;min-height:48px;margin:18px auto 0;max-width:330px;border-radius:999px;background:linear-gradient(90deg,#ffd873,#f2b544);color:#2b1b00;font-weight:1000;text-decoration:none}
        @media(max-width:600px){.fm-cart-page{padding:max(12px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(32px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}.fm-cart-header{grid-template-columns:38px minmax(0,1fr) 38px;gap:8px}.fm-cart-header>a,.fm-cart-header>i{width:38px;height:38px}.fm-cart-heading h1{font-size:20px}.fm-cart-heading p{font-size:9.5px}.fm-checkout-card{padding:13px;border-radius:14px}.fm-line-items article{grid-template-columns:48px minmax(0,1fr) auto;gap:9px}.fm-pack-coin{width:48px;height:48px}.fm-qty{gap:3px;padding:3px 4px}.fm-qty button{width:20px;height:22px}.fm-cart-fields{grid-template-columns:minmax(0,1fr)}.fm-cart-fields label.is-wide{grid-column:auto}.fm-plus-plan-grid,.fm-plus-benefits{grid-template-columns:minmax(0,1fr)}.fm-pack-picker{gap:5px}.fm-pack-picker button{padding:12px 3px}.fm-pack-picker span{font-size:10px}.fm-pack-picker strong{font-size:10px}}
        @media(max-width:360px){.fm-cart-page{padding-left:7px;padding-right:7px}.fm-cart-header{grid-template-columns:34px minmax(0,1fr) 34px}.fm-cart-header>a,.fm-cart-header>i{width:34px;height:34px}.fm-cart-heading h1{font-size:18px}.fm-line-items article{grid-template-columns:42px minmax(0,1fr);align-items:start}.fm-pack-coin{width:42px;height:42px}.fm-qty{grid-column:2;justify-self:start;margin-top:3px}.fm-checkout-card{padding:11px}}
      `}</style>
    </>
  );
}
