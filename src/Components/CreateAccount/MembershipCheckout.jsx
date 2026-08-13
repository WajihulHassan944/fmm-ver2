import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaCheck, FaCoins, FaLock, FaMinus, FaPlus, FaShieldAlt, FaShoppingCart } from 'react-icons/fa';
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

export default function MembershipCheckout() {
  const router = useRouter();
  const user = useSelector((state) => state?.user?.user || state?.user || null);
  const isFmPlus = String(router.query.product || '').toLowerCase() === 'fm-plus';
  const requestedAmount = Number(router.query.amount || 0);
  const initialSku = PACKS.find((pack) => pack.coins === requestedAmount)?.sku || 'fm-5000';
  const [cart, setCart] = useState(() => ({ [initialSku]: 1 }));
  const [fmPlusPlan, setFmPlusPlan] = useState('monthly');
  const [form, setForm] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: user?.billing?.address || '',
    city: user?.billing?.city || '',
    state: user?.billing?.state || '',
    zipCode: user?.billing?.zip || user?.zipCode || '',
    country: user?.billing?.country || 'US',
    ageConfirmed: false,
    termsAccepted: false,
  });
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef('');

  useEffect(() => {
    if (!router.isReady) return;
    if (isFmPlus) {
      const requestedPlan = String(router.query.plan || '').toLowerCase();
      if (FM_PLUS_PLANS.some((plan) => plan.id === requestedPlan)) setFmPlusPlan(requestedPlan);
      return;
    }
    const requestedCart = parseCartQuery(router.query.cart);
    if (requestedCart) {
      setCart(requestedCart);
      return;
    }
    if (!requestedAmount) return;
    const requestedPack = PACKS.find((pack) => pack.coins === requestedAmount);
    if (requestedPack) setCart({ [requestedPack.sku]: 1 });
  }, [isFmPlus, requestedAmount, router.isReady, router.query.cart, router.query.plan]);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => ({
      ...current,
      email: user.email || current.email,
      firstName: user.firstName || current.firstName,
      lastName: user.lastName || current.lastName,
      address: user.billing?.address || current.address,
      city: user.billing?.city || current.city,
      state: user.billing?.state || current.state,
      zipCode: user.billing?.zip || user.zipCode || current.zipCode,
      country: user.billing?.country || current.country,
    }));
  }, [user]);

  const items = useMemo(() => PACKS
    .map((pack) => ({ ...pack, quantity: Math.max(0, Number(cart[pack.sku] || 0)) }))
    .filter((pack) => pack.quantity > 0), [cart]);
  const selectedPlan = FM_PLUS_PLANS.find((plan) => plan.id === fmPlusPlan) || FM_PLUS_PLANS[0];
  const subtotalCents = isFmPlus ? selectedPlan.priceCents : items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const baseCoins = items.reduce((sum, item) => sum + item.coins * item.quantity, 0);

  const changeQuantity = (sku, delta) => {
    setCart((current) => ({ ...current, [sku]: Math.min(10, Math.max(0, Number(current[sku] || 0) + delta)) }));
  };

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!isFmPlus && !items.length) return setStatus('Add at least one coin pack to continue.');
    if (!form.ageConfirmed || !form.termsAccepted) return setStatus('Confirm age eligibility and accept the terms to continue.');
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
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...(isFmPlus ? { plan: fmPlusPlan } : { items: items.map(({ sku, quantity }) => ({ sku, quantity })) }),
          email: form.email,
          billing: form,
          returnUrl: `${window.location.origin}/checkout?product=${isFmPlus ? 'fm-plus' : 'fm-coins'}&status=return`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Checkout could not be created.');
      if (!payload.checkoutUrl) throw new Error('The hosted payment URL is not configured yet.');
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setStatus(error.message || 'Checkout could not be started.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isFmPlus ? 'FM+ Checkout' : 'FM Coin Cart'} | Fantasy MMAdness</title>
        <meta name="description" content={isFmPlus ? 'Choose an FM+ plan and continue to secure hosted checkout.' : 'Choose FM coin packs and continue to the secure hosted Fantasy MMAdness checkout.'} />
      </Head>
      <main className="fm-cart-page">
        <div className="fm-cart-shell">
          <header className="fm-cart-header">
            <Link href="/" aria-label="Back to Fantasy MMAdness"><FaArrowLeft /></Link>
            <div className="fm-cart-heading"><span><FaShoppingCart /> {isFmPlus ? 'FM+ CHECKOUT' : 'FM COIN CART'}</span><h1>{isFmPlus ? 'Level up every fight.' : 'Fuel your next fight card.'}</h1></div>
            <i><FaLock /></i>
          </header>

          <form onSubmit={submit}>
            <section className="fm-cart-products">
              <div className="fm-cart-section-title"><span>1</span><div><h2>{isFmPlus ? 'Choose your FM+ plan' : 'Choose coin packs'}</h2><p>{isFmPlus ? 'Both plans unlock the same benefits; choose whether you want auto-renew.' : 'Apparel remains on Etsy; this cart is only for FM coins.'}</p></div></div>
              {isFmPlus ? <>
                <div className="fm-plus-plan-grid">
                  {FM_PLUS_PLANS.map((plan) => <button type="button" key={plan.id} className={fmPlusPlan === plan.id ? 'is-active' : ''} onClick={() => { setFmPlusPlan(plan.id); idempotencyKey.current = ''; }}>
                    <b>{plan.badge}</b><span>{plan.label}</span><strong>{money(plan.priceCents)}{plan.id === 'monthly' ? '/mo' : ''}</strong><small>{plan.description}</small>
                  </button>)}
                </div>
                <aside className="fm-plus-benefits"><strong>FM+ BENEFITS</strong>{['1,000 bonus FM coins', 'Early Fantasy Card access', 'Exclusive FM+ leagues', 'No ads', '25 FM streak saves'].map((benefit) => <span key={benefit}><FaCheck /> {benefit}</span>)}</aside>
              </> : <>
              <div className="fm-cart-pack-grid">
                {PACKS.map((pack) => {
                  const quantity = Number(cart[pack.sku] || 0);
                  return <article key={pack.sku} className={pack.popular ? 'is-popular' : ''}>
                    {pack.popular ? <b>MOST POPULAR</b> : null}
                    <FaCoins />
                    <small>{pack.label}</small>
                    <h3>{pack.coins.toLocaleString()} FM</h3>
                    <strong>{money(pack.priceCents)}</strong>
                    <div><button type="button" onClick={() => changeQuantity(pack.sku, -1)} aria-label={`Remove ${pack.coins} FM pack`}><FaMinus /></button><span>{quantity}</span><button type="button" onClick={() => changeQuantity(pack.sku, 1)} aria-label={`Add ${pack.coins} FM pack`}><FaPlus /></button></div>
                  </article>;
                })}
              </div>
              <aside className="fm-cart-bonus"><FaCheck /><span><strong>First purchase bonus</strong><small>If eligible, the server doubles the purchased coins once. The final bonus appears after payment confirmation.</small></span></aside>
              </>}
            </section>

            <section className="fm-cart-billing">
              <div className="fm-cart-section-title"><span>2</span><div><h2>Billing details</h2><p>Used for account matching and address verification at hosted checkout.</p></div></div>
              {user?.email
                ? <aside className="fm-cart-account is-signed-in"><FaCheck /><span><strong>Signed in as {user.email}</strong><small>{isFmPlus ? 'FM+ benefits and bonus coins apply to this player account after Kurv confirms payment.' : 'Coins credit directly to this player wallet after Kurv confirms payment.'}</small></span></aside>
                : <aside className="fm-cart-account"><FaCoins /><span><strong>Player account included — plus 500 FM welcome coins</strong><small>After Kurv confirms payment, we create your wallet from these details and email a single-use password-set link. No extra signup form.</small></span></aside>}
              <div className="fm-cart-fields">
                <label className="is-wide"><span>Email *</span><input name="email" type="email" required value={form.email} onChange={update} autoComplete="email" /></label>
                <label><span>First name *</span><input name="firstName" required value={form.firstName} onChange={update} autoComplete="given-name" /></label>
                <label><span>Last name *</span><input name="lastName" required value={form.lastName} onChange={update} autoComplete="family-name" /></label>
                <label className="is-wide"><span>Billing address *</span><input name="address" required value={form.address} onChange={update} autoComplete="street-address" /></label>
                <label><span>City *</span><input name="city" required value={form.city} onChange={update} autoComplete="address-level2" /></label>
                <label><span>State / region *</span><input name="state" required value={form.state} onChange={update} autoComplete="address-level1" /></label>
                <label><span>ZIP / postal code *</span><input name="zipCode" required value={form.zipCode} onChange={update} autoComplete="postal-code" /></label>
                <label><span>Country *</span><input name="country" required value={form.country} onChange={update} autoComplete="country" /></label>
              </div>
              <label className="fm-cart-check"><input type="checkbox" name="ageConfirmed" checked={form.ageConfirmed} onChange={update} /><span>I confirm that I am 18 or older and eligible to purchase.</span></label>
              <label className="fm-cart-check"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} /><span>I accept the <Link href="/terms-of-service">terms</Link> and <Link href="/privacy-policy">privacy policy</Link>.</span></label>
            </section>

            <aside className="fm-cart-summary">
              <h2>Order summary</h2>
              {isFmPlus ? <p><span>FM+ {selectedPlan.label}</span><strong>{money(selectedPlan.priceCents)}</strong></p> : items.length ? items.map((item) => <p key={item.sku}><span>{item.coins.toLocaleString()} FM × {item.quantity}</span><strong>{money(item.priceCents * item.quantity)}</strong></p>) : <p><span>Your cart is empty</span><strong>—</strong></p>}
              <div><span>{isFmPlus ? 'Bonus' : 'Coins'}</span><strong>{isFmPlus ? '1,000 FM' : `${baseCoins.toLocaleString()} FM`}</strong></div>
              <div className="is-total"><span>Total</span><strong>{money(subtotalCents)}</strong></div>
              <button type="submit" disabled={submitting || (!isFmPlus && !items.length)}>{submitting ? 'CREATING CHECKOUT…' : 'CONTINUE TO SECURE PAYMENT'}</button>
              <small><FaShieldAlt /> Payment details are entered on Kurv Merchant’s hosted checkout. Card data is never collected by this page.</small>
              {status ? <p className="fm-cart-status" role="alert">{status}</p> : null}
            </aside>
          </form>
        </div>
      </main>
      <style jsx>{`
        .fm-plus-plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fm-plus-plan-grid button{min-height:150px;padding:18px 12px;border:1.5px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(255,255,255,.045);color:#fff;text-align:left;cursor:pointer}.fm-plus-plan-grid button.is-active{border-color:#a855f7;background:rgba(168,85,247,.14);box-shadow:0 0 22px rgba(168,85,247,.24)}.fm-plus-plan-grid b{display:block;color:#d8a8ff;font-size:8px;letter-spacing:.08em}.fm-plus-plan-grid span{display:block;margin-top:10px;font-family:Anton,sans-serif;font-size:22px;color:#fff}.fm-plus-plan-grid strong{display:block;color:#f2b544;font-size:20px}.fm-plus-plan-grid small{display:block;margin-top:5px;color:rgba(255,255,255,.58);font-weight:700}.fm-plus-benefits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:14px;padding:13px;border:1px solid rgba(168,85,247,.35);border-radius:12px;background:rgba(168,85,247,.08)}.fm-plus-benefits>strong{grid-column:1/-1;color:#d8a8ff;font-size:11px}.fm-plus-benefits span{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.75);font-size:11px;font-weight:800}.fm-plus-benefits svg{flex:0 0 auto;color:#22c55e}
        @media(max-width:800px){.fm-cart-page{padding:max(14px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(32px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}.fm-cart-header{grid-template-columns:40px minmax(0,1fr) 40px;gap:8px;margin-bottom:16px}.fm-cart-header>a,.fm-cart-header>i{width:40px;height:40px;border-radius:12px}.fm-cart-header span{font-size:10px;letter-spacing:.08em}.fm-cart-header h1{font-size:clamp(22px,7.3vw,32px)}form{grid-template-columns:minmax(0,1fr);gap:12px}.fm-cart-products,.fm-cart-billing,.fm-cart-summary{grid-column:1;grid-row:auto;width:100%;padding:15px;border-radius:17px}.fm-cart-summary{position:static}.fm-cart-section-title{gap:9px;margin-bottom:15px}.fm-cart-section-title h2,.fm-cart-summary h2{font-size:20px}.fm-cart-section-title p{font-size:11px;line-height:1.4}.fm-cart-pack-grid{grid-template-columns:minmax(0,1fr);gap:9px}.fm-cart-pack-grid article{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;align-items:center;column-gap:8px;text-align:left;padding:13px 10px}.fm-cart-pack-grid article>b{left:auto;right:9px;transform:none}.fm-cart-pack-grid article>svg{grid-row:1 / span 2;margin:0!important}.fm-cart-pack-grid small{grid-column:2}.fm-cart-pack-grid h3{grid-column:2;margin:0;font-size:17px}.fm-cart-pack-grid article>strong{grid-column:3;grid-row:1 / span 2;font-size:15px;white-space:nowrap}.fm-cart-pack-grid article>div{grid-column:4;grid-row:1 / span 2;margin:0;gap:5px}.fm-plus-plan-grid{grid-template-columns:minmax(0,1fr)}.fm-plus-plan-grid button{min-height:118px}.fm-plus-benefits{grid-template-columns:minmax(0,1fr)}.fm-cart-fields{grid-template-columns:minmax(0,1fr)}.fm-cart-fields label.is-wide{grid-column:auto}.fm-cart-account,.fm-cart-bonus{font-size:12px}.fm-cart-summary p,.fm-cart-summary>div{font-size:12px}}
        @media(max-width:355px){.fm-cart-page{padding-left:8px;padding-right:8px}.fm-cart-header{grid-template-columns:36px minmax(0,1fr) 36px;gap:6px}.fm-cart-header>a,.fm-cart-header>i{width:36px;height:36px}.fm-cart-header h1{font-size:20px}.fm-cart-products,.fm-cart-billing,.fm-cart-summary{padding:12px}.fm-cart-pack-grid article{grid-template-columns:28px minmax(0,1fr) auto}.fm-cart-pack-grid article>strong{grid-column:2;text-align:left}.fm-cart-pack-grid article>div{grid-column:3}.fm-cart-section-title>span{flex-basis:26px;width:26px;height:26px}}
      `}</style>
    </>
  );
}
