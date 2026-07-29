import Head from "next/head";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaShoppingBag, FaTshirt } from "react-icons/fa";

const APPAREL_ITEMS = [
  { name: "MMAdness Hoodie", price: "$49.99", image: "/images/mobile-home/app-fixed-v15/ap1-hq.webp", tag: "Heavyweight drop" },
  { name: "Fight Tee", price: "$29.99", image: "/images/mobile-home/app-fixed-v15/ap2-hq.webp", tag: "Everyday fight gear" },
  { name: "Snapback Cap", price: "$24.99", image: "/images/mobile-home/app-fixed-v15/ap3-hq.webp", tag: "Arena-ready" },
  { name: "Fight Shorts", price: "$39.99", image: "/images/mobile-home/app-fixed-v15/ap1-2-hq.webp", tag: "Training style" },
  { name: "Training Gloves", price: "$34.99", image: "/images/mobile-home/app-fixed-v15/ap2-2-hq.webp", tag: "Limited preview" },
];

const ApparelPage = () => (
  <>
    <Head>
      <title>Fantasy MMAdness Apparel</title>
      <meta
        name="description"
        content="Official Fantasy MMAdness apparel, fight-night merchandise, hoodies, tees, caps, shorts, and gloves."
      />
    </Head>
    <main className="fmm-apparel-page-v18">
      <section className="fmm-apparel-hero-v18">
        <div className="fmm-apparel-hero-copy-v18">
          <p><FaTshirt aria-hidden="true" /> Official fight gear</p>
          <h1>Fantasy MMAdness Apparel</h1>
          <span>Same products shown on the homepage, now available as a real apparel page instead of a coming-soon placeholder.</span>
          <div>
            <Link href="/"><FaArrowLeft aria-hidden="true" /> Back Home</Link>
            <Link href="/contact">Get Drop Updates <FaArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
        <figure>
          <img src="/images/brand/fantasy-mmadness-sticker-logo.png" alt="Fantasy MMAdness sticker logo" />
        </figure>
      </section>

      <section className="fmm-apparel-grid-v18" aria-label="Official Fantasy MMAdness apparel products">
        {APPAREL_ITEMS.map((item) => (
          <article key={item.name}>
            <div><img src={item.image} alt={item.name} loading="lazy" decoding="async" /></div>
            <p>{item.tag}</p>
            <h2>{item.name}</h2>
            <strong>{item.price}</strong>
            <Link href="/contact"><FaShoppingBag aria-hidden="true" /> Request availability</Link>
          </article>
        ))}
      </section>

      <style jsx>{`
        .fmm-apparel-page-v18 {
          min-height: 100vh;
          padding: 120px 20px 64px;
          color: #fff;
          background:
            radial-gradient(circle at 15% 10%, rgba(224, 30, 22, .30), transparent 32%),
            radial-gradient(circle at 85% 8%, rgba(26, 94, 220, .28), transparent 30%),
            linear-gradient(180deg, #070910 0%, #020306 100%);
        }
        .fmm-apparel-hero-v18,
        .fmm-apparel-grid-v18 {
          width: min(1180px, 100%);
          margin: 0 auto;
        }
        .fmm-apparel-hero-v18 {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr);
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
        .fmm-apparel-hero-copy-v18 > p {
          margin: 0 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ffcf45;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .12em;
        }
        .fmm-apparel-hero-copy-v18 h1 {
          margin: 0;
          font-size: clamp(2.4rem, 7vw, 5.6rem);
          line-height: .9;
          text-transform: uppercase;
        }
        .fmm-apparel-hero-copy-v18 > span {
          max-width: 660px;
          display: block;
          margin-top: 18px;
          color: rgba(255,255,255,.76);
          line-height: 1.7;
        }
        .fmm-apparel-hero-copy-v18 div {
          margin-top: 26px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .fmm-apparel-page-v18 a {
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
        }
        .fmm-apparel-hero-copy-v18 a:last-child,
        .fmm-apparel-grid-v18 a {
          color: #2b1300;
          background: linear-gradient(180deg, #ffe06a, #efb51a);
          border-color: rgba(255,216,85,.7);
        }
        .fmm-apparel-hero-v18 figure {
          margin: 0;
          min-height: 300px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background: radial-gradient(circle, rgba(255,0,0,.2), transparent 58%), rgba(0,0,0,.45);
        }
        .fmm-apparel-hero-v18 figure img {
          width: min(340px, 90%);
          height: auto;
          filter: drop-shadow(0 24px 42px rgba(0,0,0,.55));
        }
        .fmm-apparel-grid-v18 {
          margin-top: 26px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }
        .fmm-apparel-grid-v18 article {
          padding: 14px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          box-shadow: 0 18px 44px rgba(0,0,0,.28);
        }
        .fmm-apparel-grid-v18 article div {
          aspect-ratio: 1 / .82;
          border-radius: 18px;
          overflow: hidden;
          background: #06080e;
        }
        .fmm-apparel-grid-v18 img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .fmm-apparel-grid-v18 p {
          margin: 13px 0 5px;
          color: #ffcf45;
          font-size: .74rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .fmm-apparel-grid-v18 h2 {
          margin: 0;
          font-size: 1rem;
          text-transform: uppercase;
        }
        .fmm-apparel-grid-v18 strong {
          display: block;
          margin: 7px 0 13px;
          color: #ffcf45;
          font-size: 1.1rem;
        }
        .fmm-apparel-grid-v18 a {
          width: 100%;
          min-height: 42px;
          font-size: .72rem;
        }
        @media (max-width: 980px) {
          .fmm-apparel-hero-v18 { grid-template-columns: 1fr; }
          .fmm-apparel-grid-v18 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .fmm-apparel-page-v18 { padding-inline: 14px; }
          .fmm-apparel-grid-v18 { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  </>
);

export default ApparelPage;
