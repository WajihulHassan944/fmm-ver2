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
  const requestedAmount = Number(router.query.amount || 0);
  const initialSku = PACKS.find((pack) => pack.coins === requestedAmount)?.sku || 'fm-5000';
  const [cart, setCart] = useState(() => ({ [initialSku]: 1 }));
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
    const requestedCart = parseCartQuery(router.query.cart);
    if (requestedCart) {
      setCart(requestedCart);
      return;
    }
    if (!requestedAmount) return;
    const requestedPack = PACKS.find((pack) => pack.coins === requestedAmount);
    if (requestedPack) setCart({ [requestedPack.sku]: 1 });
  }, [requestedAmount, router.isReady, router.query.cart]);

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
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
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
    if (!items.length) return setStatus('Add at least one coin pack to continue.');
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
      const response = await fetch(buildPublicApiUrl('/api/checkout/coin-orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map(({ sku, quantity }) => ({ sku, quantity })),
          email: form.email,
          billing: form,
          returnUrl: `${window.location.origin}/checkout?status=return`,
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
        <title>FM Coin Cart | Fantasy MMAdness</title>
        <meta name="description" content="Choose FM coin packs and continue to the secure hosted Fantasy MMAdness checkout." />
      </Head>
      <main className="fm-cart-page">
        <div className="fm-cart-shell">
          <header className="fm-cart-header">
            <Link href="/" aria-label="Back to Fantasy MMAdness"><FaArrowLeft /></Link>
            <div className="fm-cart-heading"><span><FaShoppingCart /> FM COIN CART</span><h1>Fuel your next fight card.</h1></div>
            <i><FaLock /></i>
          </header>

          <form onSubmit={submit}>
            <section className="fm-cart-products">
              <div className="fm-cart-section-title"><span>1</span><div><h2>Choose coin packs</h2><p>Apparel remains on Etsy; this cart is only for FM coins.</p></div></div>
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
            </section>

            <section className="fm-cart-billing">
              <div className="fm-cart-section-title"><span>2</span><div><h2>Billing details</h2><p>Used for account matching and address verification at hosted checkout.</p></div></div>
              {user?.email
                ? <aside className="fm-cart-account is-signed-in"><FaCheck /><span><strong>Signed in as {user.email}</strong><small>Coins credit directly to this player wallet after Kurv confirms payment.</small></span></aside>
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
              {items.length ? items.map((item) => <p key={item.sku}><span>{item.coins.toLocaleString()} FM × {item.quantity}</span><strong>{money(item.priceCents * item.quantity)}</strong></p>) : <p><span>Your cart is empty</span><strong>—</strong></p>}
              <div><span>Coins</span><strong>{baseCoins.toLocaleString()} FM</strong></div>
              <div className="is-total"><span>Total</span><strong>{money(subtotalCents)}</strong></div>
              <button type="submit" disabled={submitting || !items.length}>{submitting ? 'CREATING CHECKOUT…' : 'CONTINUE TO SECURE PAYMENT'}</button>
              <small><FaShieldAlt /> Payment details are entered on Kurv Merchant’s hosted checkout. Card data is never collected by this page.</small>
              {status ? <p className="fm-cart-status" role="alert">{status}</p> : null}
            </aside>
          </form>
        </div>
      </main>
      <style jsx>{`
        .fm-cart-page{box-sizing:border-box;min-height:100dvh;width:100%;max-width:100vw;overflow-x:hidden;padding:110px 18px 70px;background:radial-gradient(circle at 12% 10%,rgba(239,68,68,.2),transparent 28rem),radial-gradient(circle at 88% 18%,rgba(77,141,255,.18),transparent 30rem),#05060a;color:#fff;font-family:Rajdhani,sans-serif}.fm-cart-page *{box-sizing:border-box;min-width:0}.fm-cart-shell{width:min(1180px,100%);margin:auto}.fm-cart-header{display:grid;grid-template-columns:48px minmax(0,1fr) 48px;gap:16px;align-items:center;margin-bottom:24px}.fm-cart-heading{min-width:0}.fm-cart-header>a,.fm-cart-header>i{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff}.fm-cart-header>i{color:#f2b544}.fm-cart-header span{display:flex;align-items:center;color:#f2b544;font-size:12px;font-weight:900;letter-spacing:.12em}.fm-cart-header h1{max-width:100%;overflow-wrap:anywhere;margin:3px 0 0;font-family:Anton,sans-serif;font-size:clamp(30px,5vw,58px);line-height:1.02;text-transform:uppercase}.fm-cart-header svg{flex:0 0 auto;margin-right:6px}form{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,360px);gap:18px}.fm-cart-products,.fm-cart-billing,.fm-cart-summary{min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025));padding:22px}.fm-cart-products,.fm-cart-billing{grid-column:1}.fm-cart-summary{grid-column:2;grid-row:1 / span 2;align-self:start;position:sticky;top:20px}.fm-cart-section-title{display:flex;gap:12px;align-items:flex-start;margin-bottom:18px}.fm-cart-section-title>span{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f2b544;color:#2b1b00;font-weight:900}.fm-cart-section-title h2,.fm-cart-summary h2{margin:0;font-family:Anton,sans-serif;font-size:23px;line-height:1.1;text-transform:uppercase}.fm-cart-section-title p{margin:3px 0 0;color:rgba(255,255,255,.58);font-size:13px}.fm-cart-pack-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.fm-cart-pack-grid article{min-width:0;position:relative;text-align:center;padding:20px 8px 14px;border-radius:15px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.11)}.fm-cart-pack-grid article.is-popular{border-color:#f2b544;box-shadow:0 0 24px rgba(242,181,68,.18)}.fm-cart-pack-grid article>b{position:absolute;top:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;border-radius:999px;padding:3px 9px;background:#f2b544;color:#2b1b00;font-size:8px}.fm-cart-pack-grid article>svg{font-size:25px;color:#f2b544}.fm-cart-pack-grid small{display:block;color:rgba(255,255,255,.55);font-weight:800}.fm-cart-pack-grid h3{margin:5px 0 0;font-size:20px}.fm-cart-pack-grid article>strong{display:block;color:#f2b544;font-size:17px}.fm-cart-pack-grid article>div{display:flex;justify-content:center;align-items:center;gap:13px;margin-top:10px}.fm-cart-pack-grid button{flex:0 0 30px;width:30px!important;height:30px!important;min-height:30px!important;padding:0!important;border:0;border-radius:8px;background:rgba(255,255,255,.1)!important;color:#fff!important;cursor:pointer}.fm-cart-bonus,.fm-cart-account{display:flex;gap:10px;margin:14px 0;padding:12px;border-radius:12px;background:rgba(242,181,68,.09);border:1px solid rgba(242,181,68,.35);color:#f2b544}.fm-cart-bonus>svg,.fm-cart-account>svg{flex:0 0 auto}.fm-cart-bonus{margin-bottom:0;background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.35);color:#22c55e}.fm-cart-account.is-signed-in{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.35);color:#22c55e}.fm-cart-bonus span,.fm-cart-account span{display:grid}.fm-cart-bonus small,.fm-cart-account small{color:rgba(255,255,255,.6);line-height:1.4}.fm-cart-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fm-cart-fields label{display:grid;min-width:0;gap:5px}.fm-cart-fields label.is-wide{grid-column:1/-1}.fm-cart-fields span{color:#f2b544;font-size:11px;font-weight:900;text-transform:uppercase}.fm-cart-fields input{display:block;width:100%!important;max-width:100%;min-width:0;min-height:47px;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:0 13px;background:#080b11;color:#fff}.fm-cart-check{display:flex;align-items:flex-start;gap:9px;margin-top:13px;color:rgba(255,255,255,.72);font-size:12px;line-height:1.45}.fm-cart-check input{appearance:auto!important;flex:0 0 18px;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;margin:0!important;padding:0!important;border-radius:4px!important;box-shadow:none!important}.fm-cart-check a{color:#f2b544}.fm-cart-summary p,.fm-cart-summary>div{display:flex;justify-content:space-between;gap:12px;margin:0;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}.fm-cart-summary p span,.fm-cart-summary p strong{overflow-wrap:anywhere}.fm-cart-summary>div.is-total{font-size:19px;color:#f2b544;border-bottom:0}.fm-cart-summary button{width:100%;min-height:50px;margin-top:12px;border:0;border-radius:12px;background:linear-gradient(90deg,#f2b544,#ffcf58);color:#2b1b00;font-weight:1000;cursor:pointer;white-space:normal;line-height:1.25}.fm-cart-summary button:disabled{opacity:.5;cursor:not-allowed}.fm-cart-summary>small{display:block;margin-top:12px;color:rgba(255,255,255,.5);line-height:1.45}.fm-cart-status{display:block!important;margin-top:12px!important;padding:10px!important;border:1px solid rgba(239,68,68,.4)!important;border-radius:9px;color:#ff8a8a!important;background:rgba(239,68,68,.08)}
        @media(max-width:800px){.fm-cart-page{padding:max(14px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(32px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}.fm-cart-header{grid-template-columns:40px minmax(0,1fr) 40px;gap:8px;margin-bottom:16px}.fm-cart-header>a,.fm-cart-header>i{width:40px;height:40px;border-radius:12px}.fm-cart-header span{font-size:10px;letter-spacing:.08em}.fm-cart-header h1{font-size:clamp(22px,7.3vw,32px)}form{grid-template-columns:minmax(0,1fr);gap:12px}.fm-cart-products,.fm-cart-billing,.fm-cart-summary{grid-column:1;grid-row:auto;width:100%;padding:15px;border-radius:17px}.fm-cart-summary{position:static}.fm-cart-section-title{gap:9px;margin-bottom:15px}.fm-cart-section-title h2,.fm-cart-summary h2{font-size:20px}.fm-cart-section-title p{font-size:11px;line-height:1.4}.fm-cart-pack-grid{grid-template-columns:minmax(0,1fr);gap:9px}.fm-cart-pack-grid article{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;align-items:center;column-gap:8px;text-align:left;padding:13px 10px}.fm-cart-pack-grid article>b{left:auto;right:9px;transform:none}.fm-cart-pack-grid article>svg{grid-row:1 / span 2;margin:0!important}.fm-cart-pack-grid small{grid-column:2}.fm-cart-pack-grid h3{grid-column:2;margin:0;font-size:17px}.fm-cart-pack-grid article>strong{grid-column:3;grid-row:1 / span 2;font-size:15px;white-space:nowrap}.fm-cart-pack-grid article>div{grid-column:4;grid-row:1 / span 2;margin:0;gap:5px}.fm-cart-fields{grid-template-columns:minmax(0,1fr)}.fm-cart-fields label.is-wide{grid-column:auto}.fm-cart-account,.fm-cart-bonus{font-size:12px}.fm-cart-summary p,.fm-cart-summary>div{font-size:12px}}
        @media(max-width:355px){.fm-cart-page{padding-left:8px;padding-right:8px}.fm-cart-header{grid-template-columns:36px minmax(0,1fr) 36px;gap:6px}.fm-cart-header>a,.fm-cart-header>i{width:36px;height:36px}.fm-cart-header h1{font-size:20px}.fm-cart-products,.fm-cart-billing,.fm-cart-summary{padding:12px}.fm-cart-pack-grid article{grid-template-columns:28px minmax(0,1fr) auto}.fm-cart-pack-grid article>strong{grid-column:2;text-align:left}.fm-cart-pack-grid article>div{grid-column:3}.fm-cart-section-title>span{flex-basis:26px;width:26px;height:26px}}
      `}</style>
    </>
  );
}
