import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaShoppingBag,
  FaTshirt,
} from "react-icons/fa";
import { buildPublicApiUrl } from "@/Utils/publicApi";

const FALLBACK_APPAREL_ITEMS = [
  {
    sku: "FMM-HOODIE-001",
    name: "MMAdness Hoodie",
    price: 49.99,
    displayPrice: "$49.99",
    image: "/images/mobile-home/app-fixed-v32/ap1-hq.webp",
    tag: "Heavyweight drop",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    sku: "FMM-TEE-001",
    name: "Fight Tee",
    price: 29.99,
    displayPrice: "$29.99",
    image: "/images/mobile-home/app-fixed-v32/ap2-hq.webp",
    tag: "Everyday fight gear",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    sku: "FMM-CAP-001",
    name: "Snapback Cap",
    price: 24.99,
    displayPrice: "$24.99",
    image: "/images/mobile-home/app-fixed-v32/ap3-hq.webp",
    tag: "Arena-ready",
    sizes: ["One Size"],
  },
  {
    sku: "FMM-SHORTS-001",
    name: "Fight Shorts",
    price: 39.99,
    displayPrice: "$39.99",
    image: "/images/mobile-home/app-fixed-v32/ap1-2-hq.webp",
    tag: "Training style",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    sku: "FMM-GLOVES-001",
    name: "Training Gloves",
    price: 34.99,
    displayPrice: "$34.99",
    image: "/images/mobile-home/app-fixed-v32/ap2-2-hq.webp",
    tag: "Ready to ship",
    sizes: ["S/M", "L/XL"],
  },
];

const APPAREL_IMAGE_FALLBACKS = [
  "/images/mobile-home/app-fixed-v32/ap1-hq.webp",
  "/images/mobile-home/app-fixed-v32/ap2-hq.webp",
  "/images/mobile-home/app-fixed-v32/ap3-hq.webp",
  "/images/mobile-home/app-fixed-v32/ap1-2-hq.webp",
  "/images/mobile-home/app-fixed-v32/ap2-2-hq.webp",
];

const getApparelFallbackImage = (index = 0) => APPAREL_IMAGE_FALLBACKS[index % APPAREL_IMAGE_FALLBACKS.length];

const unwrapMaybeMarkdownUrl = (value = "") => {
  const text = String(value || "").trim();
  const markdownMatch = text.match(/\((https?:\/\/[^)]+)\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const bracketMatch = text.match(/^\[(https?:\/\/[^\]]+)\]$/i);
  if (bracketMatch?.[1]) return bracketMatch[1];
  return text;
};

const normalizeApparelImageUrl = (value, fallbackIndex = 0) => {
  const raw = unwrapMaybeMarkdownUrl(value);
  if (!raw) return getApparelFallbackImage(fallbackIndex);
  if (raw.includes("/images/mobile-home/app-fixed-v15/")) {
    return raw.replace("/images/mobile-home/app-fixed-v15/", "/images/mobile-home/app-fixed-v32/");
  }
  return raw;
};

const getCartKey = (item) => `${item.sku}:${item.size}`;
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatCatalogMoney = (value, currency = "USD") => {
  const amount = Number(value || 0);
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
};

const pickCatalogImage = (item = {}, fallbackIndex = 0) => {
  const firstImage = Array.isArray(item.images) ? item.images[0] : null;
  if (typeof firstImage === "string") return normalizeApparelImageUrl(firstImage, fallbackIndex);
  if (firstImage && typeof firstImage === "object") {
    return normalizeApparelImageUrl(firstImage.url_fullxfull || firstImage.url_570xN || firstImage.url_170x135 || "", fallbackIndex);
  }
  return normalizeApparelImageUrl(item.image, fallbackIndex);
};

const normalizeApparelCatalogItem = (item = {}, fallbackIndex = 0) => {
  const price = Number(item.price || 0);
  const currency = item.currency || "USD";
  const externalUrl = item.buyUrl || item.externalUrl || item.url || "";
  return {
    sku: item.sku || item.etsyListingId || item.id || item.name,
    name: item.name || item.title || "Fantasy MMAdness Apparel",
    price,
    currency,
    displayPrice: item.displayPrice || formatCatalogMoney(price, currency),
    image: pickCatalogImage(item, fallbackIndex),
    tag: item.tag || (item.source === "etsy" ? "Official Etsy shop" : "Official drop"),
    sizes: Array.isArray(item.sizes) && item.sizes.length ? item.sizes : ["One Size"],
    source: item.source || "fallback",
    externalUrl,
    isExternalCheckout: Boolean(item.isExternalCheckout || item.source === "etsy" || externalUrl),
  };
};


const ApparelPage = () => {
  const reduxUser = useSelector((state) => state.auth?.user || state.user || {});
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: [reduxUser?.firstName, reduxUser?.lastName].filter(Boolean).join(" ") || reduxUser?.playerName || "",
    email: reduxUser?.email || "",
    phone: reduxUser?.phone || "",
    shippingAddress: reduxUser?.billing?.address || "",
    city: reduxUser?.billing?.city || "",
    state: reduxUser?.billing?.state || "",
    zipCode: reduxUser?.billing?.zip || "",
    country: reduxUser?.billing?.country || "United States",
    notes: "",
  });
  const [status, setStatus] = useState({ state: "idle", message: "", orderNumber: "" });

  const [products, setProducts] = useState(() => FALLBACK_APPAREL_ITEMS.map((item, index) => normalizeApparelCatalogItem(item, index)));
  const [catalogStatus, setCatalogStatus] = useState({ source: "fallback", message: "Loading official catalog..." });

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const response = await fetch(buildPublicApiUrl("/api/public/apparel-products?limit=100&v=45"), {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(payload?.products) || !payload.products.length) {
          throw new Error(payload?.message || "Using local apparel catalog.");
        }
        if (cancelled) return;
        setProducts(payload.products.map((item, index) => normalizeApparelCatalogItem(item, index)));
        setCatalogStatus({
          source: payload.source || "backend",
          message: payload.source === "etsy" ? "Live Etsy catalog" : "Official apparel catalog",
        });
      } catch (_error) {
        if (cancelled) return;
        setProducts(FALLBACK_APPAREL_ITEMS.map((item, index) => normalizeApparelCatalogItem(item, index)));
        setCatalogStatus({ source: "fallback", message: "Official fallback catalog" });
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const addToCart = (product, size = product.sizes?.[0] || "One Size") => {
    setStatus({ state: "idle", message: "", orderNumber: "" });
    setCart((current) => {
      const key = `${product.sku}:${size}`;
      const existing = current.find((item) => getCartKey(item) === key);
      if (existing) {
        return current.map((item) =>
          getCartKey(item) === key
            ? { ...item, quantity: Math.min(20, item.quantity + 1) }
            : item,
        );
      }
      return [
        ...current,
        {
          sku: product.sku,
          name: product.name,
          image: product.image,
          price: product.price,
          size,
          quantity: 1,
        },
      ];
    });
    setCheckoutOpen(true);
  };

  const updateQuantity = (cartItem, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          getCartKey(item) === getCartKey(cartItem)
            ? { ...item, quantity: Math.max(0, Math.min(20, item.quantity + delta)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (cartItem) => {
    setCart((current) => current.filter((item) => getCartKey(item) !== getCartKey(cartItem)));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      setStatus({ state: "error", message: "Add at least one item before placing an order.", orderNumber: "" });
      return;
    }

    setStatus({ state: "submitting", message: "Sending your order...", orderNumber: "" });
    try {
      const response = await fetch(buildPublicApiUrl("/api/public/apparel-orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...form,
          userId: reduxUser?._id || reduxUser?.id || undefined,
          items: cart.map(({ sku, size, quantity }) => ({ sku, size, quantity })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || "Unable to place order.");

      setCart([]);
      setCheckoutOpen(false);
      setStatus({
        state: "success",
        message: "Order received. The team will follow up with payment and shipping confirmation.",
        orderNumber: payload?.orderNumber || "",
      });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Unable to place order.", orderNumber: "" });
    }
  };

  return (
    <>
      <Head>
        <title>Fantasy MMAdness Apparel</title>
        <meta
          name="description"
          content="Official Fantasy MMAdness apparel, fight-night merchandise, hoodies, tees, caps, shorts, and gloves. Guest checkout is available."
        />
      </Head>
      <main className="fmm-apparel-page-v19">
        <section className="fmm-apparel-hero-v19">
          <div className="fmm-apparel-hero-copy-v19">
            <p><FaTshirt aria-hidden="true" /> Official fight gear</p>
            <h1>Fantasy MMAdness Apparel</h1>
            <span>{catalogStatus.source === "etsy" ? "Showing live products from the official Fantasy MMAdness Etsy shop. Buy buttons open the Etsy listing so price, options, and availability stay accurate." : "Products are ready to order. Players and guests can add items, enter shipping details, and submit an order without being forced to log in."}</span>
            <small className="fmm-apparel-catalog-status-v44">{catalogStatus.message}</small>
            <div className="fmm-apparel-hero-actions-v19">
              <Link href="/"><FaArrowLeft aria-hidden="true" /> Back Home</Link>
              <button type="button" onClick={() => setCheckoutOpen(true)} disabled={!cart.length}>
                <FaShoppingBag aria-hidden="true" /> View Order ({cart.length})
              </button>
            </div>
          </div>
          <figure>
            <img src="/images/brand/fantasy-mmadness-main-logo-v23.jpg" alt="Fantasy MMAdness sticker logo" />
          </figure>
        </section>

        {status.state === "success" && (
          <section className="fmm-apparel-success-v19" role="status">
            <FaCheckCircle aria-hidden="true" />
            <div>
              <strong>Order submitted</strong>
              <p>{status.message} {status.orderNumber ? <span>Order #{status.orderNumber}</span> : null}</p>
            </div>
          </section>
        )}

        <section className="fmm-apparel-grid-v19" aria-label="Official Fantasy MMAdness apparel products">
          {products.map((item, index) => (
            <article key={item.sku}>
              <div className="fmm-apparel-product-image-v19"><img src={item.image} alt={item.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getApparelFallbackImage(index); }} /></div>
              <p>{item.tag}</p>
              <h2>{item.name}</h2>
              <strong>{item.displayPrice}</strong>
              <label>
                <span>Size</span>
                <select id={`size-${item.sku}`} defaultValue={item.sizes[0]}>
                  {item.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              {item.isExternalCheckout && item.externalUrl ? (
                <a
                  className="fmm-apparel-buy-etsy-v44"
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaShoppingBag aria-hidden="true" /> Buy on Etsy
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const select = typeof document !== "undefined" ? document.getElementById(`size-${item.sku}`) : null;
                    addToCart(item, select?.value || item.sizes[0]);
                  }}
                >
                  <FaShoppingBag aria-hidden="true" /> Add to order
                </button>
              )}
            </article>
          ))}
        </section>

        <aside className={`fmm-apparel-checkout-v19 ${checkoutOpen ? "is-open" : ""}`} aria-hidden={!checkoutOpen}>
          <button type="button" className="fmm-apparel-checkout-backdrop-v19" aria-label="Close order drawer" onClick={() => setCheckoutOpen(false)} />
          <section className="fmm-apparel-checkout-panel-v19" aria-label="Apparel order checkout">
            <header>
              <div>
                <p>Guest checkout enabled</p>
                <h2>Place apparel order</h2>
              </div>
              <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close order drawer">×</button>
            </header>

            {cart.length ? (
              <div className="fmm-apparel-cart-list-v19">
                {cart.map((item) => (
                  <article key={getCartKey(item)}>
                    <img src={item.image} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getApparelFallbackImage(1); }} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>Size {item.size} · {money(item.price)}</span>
                      <div className="fmm-apparel-qty-controls-v20" aria-label={`${item.name} quantity controls`}>
                        <button
                          type="button"
                          className="fmm-apparel-qty-btn-v20"
                          onClick={() => updateQuantity(item, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <b aria-label={`Quantity ${item.quantity}`}>{item.quantity}</b>
                        <button
                          type="button"
                          className="fmm-apparel-qty-btn-v20"
                          onClick={() => updateQuantity(item, 1)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="fmm-apparel-remove-btn-v20"
                          onClick={() => removeItem(item)}
                          aria-label={`Remove ${item.name} from order`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <em>{money(item.price * item.quantity)}</em>
                  </article>
                ))}
                <div className="fmm-apparel-subtotal-v19"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              </div>
            ) : (
              <div className="fmm-apparel-empty-cart-v19"><FaShoppingBag /><strong>Your apparel order is empty.</strong><p>Add a product to start checkout.</p></div>
            )}

            <form onSubmit={submitOrder}>
              <div className="fmm-apparel-form-grid-v19">
                <label><span>Full name *</span><input name="customerName" value={form.customerName} onChange={handleFieldChange} required /></label>
                <label><span>Email *</span><input type="email" name="email" value={form.email} onChange={handleFieldChange} required /></label>
                <label><span>Phone</span><input name="phone" value={form.phone} onChange={handleFieldChange} /></label>
                <label><span>Country *</span><input name="country" value={form.country} onChange={handleFieldChange} required /></label>
                <label className="is-wide"><span>Shipping address *</span><input name="shippingAddress" value={form.shippingAddress} onChange={handleFieldChange} required /></label>
                <label><span>City *</span><input name="city" value={form.city} onChange={handleFieldChange} required /></label>
                <label><span>State / region</span><input name="state" value={form.state} onChange={handleFieldChange} /></label>
                <label><span>ZIP / postal code *</span><input name="zipCode" value={form.zipCode} onChange={handleFieldChange} required /></label>
                <label className="is-wide"><span>Order notes</span><textarea name="notes" value={form.notes} onChange={handleFieldChange} placeholder="Color preference, delivery note, or sizing question" /></label>
              </div>
              {status.state === "error" && <p className="fmm-apparel-error-v19">{status.message}</p>}
              <button type="submit" disabled={status.state === "submitting" || !cart.length}>
                {status.state === "submitting" ? "Placing order..." : `Place order · ${money(subtotal)}`}
              </button>
              <small>No login required. The team will confirm payment and shipping after submission.</small>
            </form>
          </section>
        </aside>

        <style jsx>{`
          .fmm-apparel-page-v19 {
            min-height: 100vh;
            padding: 120px 20px 72px;
            color: #fff;
            background:
              radial-gradient(circle at 15% 10%, rgba(224, 30, 22, .30), transparent 32%),
              radial-gradient(circle at 85% 8%, rgba(26, 94, 220, .28), transparent 30%),
              linear-gradient(180deg, #070910 0%, #020306 100%);
          }
          .fmm-apparel-hero-v19,
          .fmm-apparel-grid-v19,
          .fmm-apparel-success-v19 {
            width: min(1180px, 100%);
            margin: 0 auto;
          }
          .fmm-apparel-hero-v19 {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(230px, .7fr);
            gap: 28px;
            align-items: center;
            padding: clamp(28px, 4vw, 52px);
            border: 1px solid rgba(255, 203, 55, .24);
            border-radius: 32px;
            background:
              linear-gradient(135deg, rgba(255,255,255,.08), transparent 36%),
              rgba(8, 11, 18, .94);
            box-shadow: 0 36px 90px rgba(0,0,0,.45);
            overflow: hidden;
          }
          .fmm-apparel-hero-copy-v19 > p {
            margin: 0 0 10px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #ffcf45;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .12em;
          }
          .fmm-apparel-hero-copy-v19 h1 {
            margin: 0;
            font-size: clamp(2.4rem, 7vw, 5.6rem);
            line-height: .9;
            text-transform: uppercase;
          }
          .fmm-apparel-hero-copy-v19 > span {
            max-width: 680px;
            display: block;
            margin-top: 18px;
            color: rgba(255,255,255,.76);
            line-height: 1.7;
          }
          .fmm-apparel-catalog-status-v44 {
            width: fit-content;
            display: inline-flex;
            margin-top: 14px;
            padding: 8px 12px;
            border: 1px solid rgba(255, 207, 69, .28);
            border-radius: 999px;
            color: #ffcf45;
            background: rgba(255, 207, 69, .08);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          .fmm-apparel-hero-actions-v19 {
            margin-top: 26px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .fmm-apparel-page-v19 a,
          .fmm-apparel-page-v19 button {
            min-height: 48px;
            padding: 0 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            border-radius: 14px;
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,.16);
            background: rgba(255,255,255,.06);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .04em;
            cursor: pointer;
          }
          .fmm-apparel-page-v19 button:disabled { opacity: .55; cursor: not-allowed; }
          .fmm-apparel-hero-actions-v19 button,
          .fmm-apparel-grid-v19 button,
          .fmm-apparel-checkout-panel-v19 form > button {
            color: #2b1300;
            background: linear-gradient(180deg, #ffe06a, #efb51a);
            border-color: rgba(255,216,85,.7);
          }
          .fmm-apparel-hero-v19 figure {
            margin: 0;
            min-height: 300px;
            display: grid;
            place-items: center;
            border-radius: 28px;
            background: radial-gradient(circle, rgba(255,0,0,.2), transparent 58%), rgba(0,0,0,.45);
          }
          .fmm-apparel-hero-v19 figure img {
            width: min(340px, 90%);
            height: auto;
            filter: drop-shadow(0 24px 42px rgba(0,0,0,.55));
          }
          .fmm-apparel-success-v19 {
            margin-top: 18px;
            padding: 18px;
            display: flex;
            gap: 14px;
            align-items: center;
            border: 1px solid rgba(52, 211, 153, .28);
            border-radius: 20px;
            background: rgba(10, 80, 50, .38);
          }
          .fmm-apparel-success-v19 svg { color: #34d399; font-size: 28px; }
          .fmm-apparel-success-v19 strong { display: block; }
          .fmm-apparel-success-v19 p { margin: 4px 0 0; color: rgba(255,255,255,.78); }
          .fmm-apparel-success-v19 span { color: #ffcf45; font-weight: 900; }
          .fmm-apparel-grid-v19 {
            margin-top: 26px;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 16px;
          }
          .fmm-apparel-grid-v19 article {
            padding: 14px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
            box-shadow: 0 18px 44px rgba(0,0,0,.28);
          }
          .fmm-apparel-product-image-v19 {
            aspect-ratio: 1 / .82;
            border-radius: 18px;
            overflow: hidden;
            background: #06080e;
          }
          .fmm-apparel-product-image-v19 img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .fmm-apparel-grid-v19 p {
            margin: 13px 0 5px;
            color: #ffcf45;
            font-size: .74rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          .fmm-apparel-grid-v19 h2 { margin: 0; font-size: 1rem; text-transform: uppercase; }
          .fmm-apparel-grid-v19 strong { display: block; margin: 7px 0 13px; color: #ffcf45; font-size: 1.1rem; }
          .fmm-apparel-grid-v19 label { display: grid; gap: 6px; margin-bottom: 12px; color: rgba(255,255,255,.75); font-size: .74rem; text-transform: uppercase; font-weight: 900; }
          .fmm-apparel-grid-v19 select,
          .fmm-apparel-form-grid-v19 input,
          .fmm-apparel-form-grid-v19 textarea {
            width: 100%;
            min-height: 44px;
            border: 1px solid rgba(255,255,255,.16);
            border-radius: 12px;
            background: rgba(0,0,0,.32);
            color: #fff;
            padding: 0 12px;
            outline: none;
          }
          .fmm-apparel-grid-v19 button { width: 100%; min-height: 42px; font-size: .72rem; }
          .fmm-apparel-grid-v19 a.fmm-apparel-buy-etsy-v44 {
            width: 100%;
            min-height: 42px;
            padding: 0 12px;
            color: #2b1300;
            background: linear-gradient(180deg, #ffe06a, #efb51a);
            border-color: rgba(255,216,85,.7);
            font-size: .72rem;
            white-space: nowrap;
          }
          .fmm-apparel-checkout-v19 { position: fixed; inset: 0; z-index: 2500; pointer-events: none; visibility: hidden; }
          .fmm-apparel-checkout-v19.is-open { pointer-events: auto; visibility: visible; }
          .fmm-apparel-checkout-backdrop-v19 { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0; background: rgba(0,0,0,.68); opacity: 0; transition: opacity .2s ease; }
          .fmm-apparel-checkout-v19.is-open .fmm-apparel-checkout-backdrop-v19 { opacity: 1; }
          .fmm-apparel-checkout-panel-v19 {
            position: absolute;
            top: 0;
            right: 0;
            width: min(620px, 100%);
            height: 100%;
            overflow: auto;
            padding: 22px;
            background: #080b12;
            border-left: 1px solid rgba(255,255,255,.12);
            transform: translateX(104%);
            transition: transform .22s ease;
          }
          .fmm-apparel-checkout-v19.is-open .fmm-apparel-checkout-panel-v19 { transform: translateX(0); }
          .fmm-apparel-checkout-panel-v19 header { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
          .fmm-apparel-checkout-panel-v19 header p { margin: 0 0 5px; color: #ffcf45; font-size: .78rem; text-transform: uppercase; font-weight: 900; }
          .fmm-apparel-checkout-panel-v19 header h2 { margin: 0; font-size: 2rem; text-transform: uppercase; }
          .fmm-apparel-checkout-panel-v19 header > button { width: 44px; height: 44px; padding: 0; border-radius: 50%; font-size: 28px; line-height: 1; }
          .fmm-apparel-cart-list-v19 { display: grid; gap: 10px; margin-bottom: 18px; }
          .fmm-apparel-cart-list-v19 article { display: grid; grid-template-columns: 78px 1fr auto; gap: 12px; align-items: center; padding: 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: rgba(255,255,255,.045); }
          .fmm-apparel-cart-list-v19 img { width: 78px; height: 70px; object-fit: cover; border-radius: 14px; }
          .fmm-apparel-cart-list-v19 strong { display: block; }
          .fmm-apparel-cart-list-v19 span { color: rgba(255,255,255,.65); font-size: .84rem; }
          .fmm-apparel-qty-controls-v20 { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
          .fmm-apparel-qty-controls-v20 b {
            min-width: 30px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: #fff;
            background: rgba(255, 255, 255, .08);
            border: 1px solid rgba(255, 255, 255, .12);
            font-size: .95rem;
          }
          .fmm-apparel-cart-list-v19 .fmm-apparel-qty-btn-v20,
          .fmm-apparel-cart-list-v19 .fmm-apparel-remove-btn-v20 {
            height: 32px;
            min-height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, .18);
            background: rgba(255, 255, 255, .10);
            color: #fff !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08);
            line-height: 1;
            text-transform: none;
            letter-spacing: 0;
          }
          .fmm-apparel-cart-list-v19 .fmm-apparel-qty-btn-v20 {
            width: 34px;
            padding: 0;
            border-radius: 11px;
            font-size: 1.25rem;
            font-weight: 900;
          }
          .fmm-apparel-cart-list-v19 .fmm-apparel-remove-btn-v20 {
            width: auto;
            padding: 0 11px;
            border-radius: 11px;
            color: #ffb4b4 !important;
            font-size: .72rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .fmm-apparel-cart-list-v19 .fmm-apparel-qty-btn-v20:hover,
          .fmm-apparel-cart-list-v19 .fmm-apparel-remove-btn-v20:hover {
            border-color: rgba(255, 207, 69, .45);
            background: rgba(255, 255, 255, .16);
          }
          .fmm-apparel-cart-list-v19 em { color: #ffcf45; font-style: normal; font-weight: 900; }
          .fmm-apparel-subtotal-v19 { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 2px; font-size: 1.1rem; }
          .fmm-apparel-subtotal-v19 strong { color: #ffcf45; }
          .fmm-apparel-empty-cart-v19 { display: grid; place-items: center; text-align: center; gap: 8px; padding: 34px 16px; border: 1px dashed rgba(255,255,255,.16); border-radius: 22px; color: rgba(255,255,255,.72); }
          .fmm-apparel-empty-cart-v19 svg { font-size: 38px; color: #ffcf45; }
          .fmm-apparel-empty-cart-v19 strong { color: #fff; }
          .fmm-apparel-form-grid-v19 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .fmm-apparel-form-grid-v19 label { display: grid; gap: 6px; color: rgba(255,255,255,.72); font-weight: 800; font-size: .82rem; }
          .fmm-apparel-form-grid-v19 label.is-wide { grid-column: 1 / -1; }
          .fmm-apparel-form-grid-v19 textarea { min-height: 86px; padding-top: 12px; resize: vertical; }
          .fmm-apparel-checkout-panel-v19 form > button { width: 100%; margin-top: 16px; }
          .fmm-apparel-checkout-panel-v19 form > small { display: block; margin-top: 10px; color: rgba(255,255,255,.58); text-align: center; }
          .fmm-apparel-error-v19 { color: #ff8b8b; font-weight: 800; }
          @media (max-width: 1080px) {
            .fmm-apparel-grid-v19 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (max-width: 780px) {
            .fmm-apparel-page-v19 { padding-top: 104px; }
            .fmm-apparel-hero-v19 { grid-template-columns: 1fr; }
            .fmm-apparel-grid-v19 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 560px) {
            .fmm-apparel-page-v19 { padding-inline: 14px; }
            .fmm-apparel-grid-v19 { grid-template-columns: 1fr; }
            .fmm-apparel-form-grid-v19 { grid-template-columns: 1fr; }
            .fmm-apparel-cart-list-v19 article { grid-template-columns: 64px 1fr; }
            .fmm-apparel-cart-list-v19 em { grid-column: 2; }
          }
        `}</style>
      </main>
    </>
  );
};

export default ApparelPage;
