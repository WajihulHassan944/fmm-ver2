import Head from "next/head";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaTshirt } from "react-icons/fa";

const ApparelPage = () => (
  <>
    <Head>
      <title>Fantasy MMAdness Apparel</title>
      <meta
        name="description"
        content="Official Fantasy MMAdness apparel and fight-night merchandise updates."
      />
    </Head>
    <main className="fmm-apparel-page">
      <section>
        <span><FaTshirt aria-hidden="true" /></span>
        <p>Official Fight Gear</p>
        <h1>Fantasy MMAdness Apparel</h1>
        <p>
          Official apparel drops are being prepared. Join the platform or contact
          the team to receive launch and availability updates.
        </p>
        <div>
          <Link href="/"><FaArrowLeft aria-hidden="true" /> Back Home</Link>
          <Link href="/contact">Get Drop Updates <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <style jsx>{`
        .fmm-apparel-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 110px 20px 40px;
          color: #fff;
          background:
            radial-gradient(circle at 15% 20%, rgba(224, 30, 22, .28), transparent 35%),
            radial-gradient(circle at 85% 20%, rgba(26, 94, 220, .25), transparent 32%),
            #05070c;
        }
        section {
          width: min(680px, 100%);
          padding: clamp(28px, 7vw, 58px);
          text-align: center;
          border: 1px solid rgba(255, 203, 55, .25);
          border-radius: 28px;
          background: rgba(8, 11, 18, .94);
          box-shadow: 0 30px 70px rgba(0,0,0,.45);
        }
        section > span {
          width: 76px;
          height: 76px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 24px;
          color: #221300;
          background: linear-gradient(180deg, #ffdd62, #f2b717);
          font-size: 2rem;
        }
        section > p:first-of-type {
          margin: 0 0 8px;
          color: #ffc72c;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .12em;
        }
        h1 { margin: 0; font-size: clamp(2rem, 7vw, 4rem); }
        section > p:last-of-type { color: rgba(255,255,255,.72); line-height: 1.65; }
        div { margin-top: 24px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        a {
          min-height: 48px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border-radius: 14px;
          color: #fff;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.05);
        }
        a:last-child { color: #251500; background: linear-gradient(180deg, #ffdc5a, #efb51a); }
      `}</style>
    </main>
  </>
);

export default ApparelPage;
