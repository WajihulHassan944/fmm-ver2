import Link from 'next/link';

export default function FounderHomepageFeature() {
  return (
    <section className="fmm-founder-feature" aria-labelledby="fmm-founder-title">
      <div className="fmm-founder-wrap">
        <div className="fmm-founder-copy">
          <div className="fmm-founder-kicker">THE STORY BEHIND FANTASY MMADNESS</div>
          <h2 id="fmm-founder-title">BUILT IN THE FIGHT GAME.<br/><span>MADE FOR THE FANS.</span></h2>
          <p>Founder Kelly Davis has spent decades in combat sports, training fighters and building a new way for fans to experience every round.</p>
          <p>Kelly trained his brother, Kelvin “Concrete” Davis, throughout his boxing career. In 2004, Kelvin became the IBF cruiserweight world champion in Miami, Florida.</p>
          <div className="fmm-founder-cta"><Link href="/about">MEET THE FOUNDER →</Link><Link href="/play" className="secondary">START PREDICTING →</Link></div>
        </div>
        <Link href="/about" className="fmm-founder-ring" aria-label="Read the Brothers in Arms founder story">
          <span className="fmm-ring-heading">THE RING</span>
          <span className="fmm-ring-divider"/>
          <span className="fmm-ring-story">BROTHERS<br/>IN ARMS</span>
          <span className="fmm-ring-subtitle">KELLY &amp; KELVIN “CONCRETE” DAVIS</span>
          <span className="fmm-ring-link">READ THE STORY ↗</span>
        </Link>
      </div>
      <style jsx global>{`
        .fmm-founder-feature{background:linear-gradient(110deg,#14151c,#08090e 65%);border-top:1px solid #38303a;border-bottom:1px solid #38303a;padding:72px 24px}
        .fmm-founder-wrap{max-width:1256px;margin:auto;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(290px,.65fr);gap:54px;align-items:center}
        .fmm-founder-kicker{font:800 12px 'Rajdhani',sans-serif;letter-spacing:3px;color:#ff4a59;margin-bottom:17px}
        .fmm-founder-copy h2{font:900 clamp(35px,4.2vw,59px)/1.1 'Anton',Impact,sans-serif;letter-spacing:.4px;color:white;margin:0 0 24px}
        .fmm-founder-copy h2 span{color:#f62b3e}
        .fmm-founder-copy p{max-width:680px;color:#c5c9d1;font:600 18px/1.65 'Rajdhani',sans-serif;margin:0 0 17px}
        .fmm-founder-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
        .fmm-founder-cta a{padding:15px 23px;background:#e21d30;border-radius:7px;color:#fff!important;font:800 15px 'Rajdhani',sans-serif;letter-spacing:1px;text-decoration:none}
        .fmm-founder-cta a.secondary{background:transparent;border:1px solid #656b75}
        .fmm-founder-ring{background:#e00014;min-height:345px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:26px;border:2px solid #ff5360;box-shadow:0 20px 60px #0008;text-decoration:none!important;transition:transform .2s}
        .fmm-founder-ring:hover{transform:translateY(-3px)}
        .fmm-ring-heading{font:900 clamp(51px,6vw,82px)/1 Georgia,serif;letter-spacing:-4px;color:white}
        .fmm-ring-divider{width:72%;height:2px;background:#fff8;margin:19px 0}
        .fmm-ring-story{font:900 41px/1.05 'Anton',Impact,sans-serif;color:white;letter-spacing:2px}
        .fmm-ring-subtitle{font:800 12px 'Rajdhani',sans-serif;letter-spacing:1.3px;color:white;margin-top:19px}
        .fmm-ring-link{font:900 13px 'Rajdhani',sans-serif;color:white;margin-top:26px;border-bottom:1px solid white;padding-bottom:4px}
        @media(max-width:800px){.fmm-founder-feature{padding:52px 20px}.fmm-founder-wrap{grid-template-columns:1fr;gap:32px}.fmm-founder-ring{min-height:300px}.fmm-founder-copy p{font-size:17px}}
      `}</style>
    </section>
  );
}
