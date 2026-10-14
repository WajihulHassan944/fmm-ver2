import Head from 'next/head';
import { useState } from 'react';

function FounderPhoto({ src, alt, className, fallback }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={className} role="img" aria-label={alt}>{fallback}</div> : <img className={className} src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />;
}
import Link from 'next/link';
import { FaArrowRight, FaBookOpen, FaBullseye, FaFistRaised, FaTrophy, FaUsers } from 'react-icons/fa';

const milestones = [
  { year: 'THE BEGINNING', title: 'Built in the boxing gyms of Reno', copy: 'Kelly and Kelvin Davis began their journey in amateur boxing through the Boys & Girls Club and the University of Nevada boxing community.' },
  { year: '2004', title: 'A world championship in the family', copy: 'Kelly trained his brother Kelvin “Koncrete” Davis, who captured the IBF Cruiserweight World Championship.' },
  { year: 'THE EXPERIENCE', title: 'Decades inside combat sports', copy: 'More than 30 years of experience as a trainer, manager, gym owner and ringside professional across boxing and other combat sports.' },
  { year: 'THE NEXT CHAPTER', title: 'FANTASY MMADNESS', copy: 'That firsthand experience became a new kind of fight-night challenge: predicting what happens round by round.' },
];

export default function About() {
  return (
    <main className="fmm-story">
      <Head>
        <title>Our Story | FANTASY MMADNESS</title>
        <meta name="description" content="Discover the championship boxing history and combat sports experience behind FANTASY MMADNESS, founded by Kelly Davis." />
      </Head>
      <style jsx>{`
        .fmm-story { color:#f7f7fa; background: #07090e; overflow:hidden; font-family:'Rajdhani',system-ui,sans-serif; }
        .wrap { width:min(1180px,calc(100% - 44px)); margin:0 auto; }
        .eyebrow { color:#f6ad36; font-weight:800; letter-spacing:.18em; font-size:13px; text-transform:uppercase; margin:0 0 16px; }
        h1,h2,h3 { font-family:'Anton',Impact,sans-serif; font-weight:400; letter-spacing:.025em; }
        .hero { position:relative; isolation:isolate; padding:90px 0 88px; border-bottom:1px solid #30261e; background:radial-gradient(ellipse at 80% 25%,rgba(206,32,42,.28),transparent 45%),linear-gradient(135deg,#171016,#080a10 68%); }
        .hero:before { content:''; position:absolute; inset:0; z-index:-1; opacity:.12; background:repeating-linear-gradient(135deg,transparent 0,transparent 16px,#fff 17px,transparent 18px); mask-image:linear-gradient(to left,#000,transparent 75%); }
        .hero-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(270px,.65fr); gap:50px; align-items:center; }
        h1 { font-size:clamp(44px,6.2vw,90px); line-height:1.05; margin:0 0 22px; max-width:850px; }
        .accent { color:#f6aa2b; }
        .lead { font-size:clamp(19px,2vw,25px); line-height:1.5; color:#d0d3da; max-width:690px; margin:0 0 28px; }
        .actions { display:flex; flex-wrap:wrap; gap:12px; }
        .action { display:inline-flex; align-items:center; gap:10px; border-radius:8px; background:#e52935; color:#fff; padding:15px 22px; font-size:16px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; text-decoration:none; box-shadow:0 8px 26px rgba(229,41,53,.23); }
        .action.secondary { background:transparent; border:1px solid #737681; box-shadow:none; }
        .founder-photo { width:100%; max-height:520px; min-height:320px; object-fit:cover; object-position:center 30%; border-radius:14px; border:1px solid rgba(246,170,43,.35); background:linear-gradient(145deg,#2c211d,#10141e); display:flex; align-items:center; justify-content:center; text-align:center; color:#f6aa2b; font-family:'Anton',Impact,sans-serif; font-size:32px; letter-spacing:.05em; }
        .belt-photo { width:100%; height:360px; object-fit:contain; border-radius:12px; background:radial-gradient(ellipse at center,#30251c,#11141a 70%); display:flex; align-items:center; justify-content:center; text-align:center; color:#f6aa2b; font-family:'Anton',Impact,sans-serif; font-size:28px; }
        .photo-caption { font-size:14px; color:#b9bfca; margin:10px 0 0; line-height:1.4; }
        .hero-proof { border:1px solid rgba(246,170,43,.5); background:linear-gradient(155deg,rgba(246,170,43,.12),rgba(255,255,255,.02)); border-radius:18px; padding:28px; box-shadow:0 24px 60px rgba(0,0,0,.3); }
        .hero-proof .year { font-family:'Anton',Impact,sans-serif; color:#f6aa2b; font-size:76px; line-height:1; }
        .hero-proof h2 { font-size:28px; line-height:1.2; margin:12px 0; }
        .hero-proof p { font-size:18px; line-height:1.5; color:#cdd0d8; margin:0; }
        .section { padding:76px 0; }
        .section-title { font-size:clamp(32px,4vw,52px); line-height:1.15; margin:0 0 16px; }
        .section-intro { max-width:800px; color:#b9bfca; font-size:19px; line-height:1.6; margin:0 0 30px; }
        .timeline { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .milestone { padding:25px 23px; background:#111620; border:1px solid #2b3442; border-radius:12px; min-height:210px; }
        .milestone .date { color:#f6aa2b; font-size:13px; font-weight:900; letter-spacing:.12em; }
        .milestone h3 { font-size:23px; line-height:1.2; margin:16px 0 12px; }
        .milestone p { font-size:16px; line-height:1.55; color:#c4c8d1; margin:0; }
        .ring { background:linear-gradient(110deg,#19120f,#11141c); border-top:1px solid #3a2c1c; border-bottom:1px solid #3a2c1c; }
        .ring-grid { display:grid; grid-template-columns: .8fr 1.2fr; gap:44px; align-items:center; }
        .ring-cover { padding:34px; min-height:290px; border:1px solid #c39447; background:linear-gradient(140deg,#302016,#12141a); border-radius:12px; display:flex; flex-direction:column; justify-content:center; }
        .ring-cover .publication { font-family:Georgia,serif; font-style:italic; font-weight:800; font-size:clamp(40px,5vw,72px); color:#fff; line-height:1; border-bottom:3px solid #dba445; padding-bottom:18px; }
        .ring-cover .feature { font-family:'Anton',Impact,sans-serif; font-size:clamp(26px,3vw,38px); margin:20px 0 10px; }
        .ring-cover .credit { color:#f6aa2b; font-size:15px; font-weight:800; }
        .ring-note { font-size:14px; color:#aeb4be; line-height:1.5; }
        .why-grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
        .why-card { background:#111620; border:1px solid #2b3442; border-radius:14px; padding:30px; }
        .why-card svg { color:#f6aa2b; }
        .why-card h3 { font-size:28px; margin:18px 0 10px; }
        .why-card p { font-size:18px; line-height:1.6; color:#c2c8d2; margin:0; }
        .closing { text-align:center; padding:72px 0 90px; background:radial-gradient(ellipse at 50% 100%,rgba(229,41,53,.2),transparent 65%); }
        .closing h2 { font-size:clamp(38px,5vw,64px); margin:0 0 16px; }
        .closing p { font-size:19px; color:#c5cad3; margin:0 auto 25px; max-width:660px; }
        .closing .actions { justify-content:center; }
        @media(max-width:850px) { .hero-grid,.ring-grid,.why-grid {grid-template-columns:1fr;} .timeline {grid-template-columns:repeat(2,minmax(0,1fr));} .hero {padding:60px 0;} }
        @media(max-width:540px) { .wrap {width:calc(100% - 30px);} .section {padding:52px 0;} .timeline {grid-template-columns:1fr;} .milestone {min-height:auto;} .hero-proof {padding:22px;} .ring-cover {padding:25px; min-height:240px;} .actions .action {justify-content:center; width:100%;} }
      `}</style>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">THE FOUNDER'S STORY · KELLY DAVIS</p>
            <h1>KELLY DAVIS. <span className="accent">A LIFETIME IN THE FIGHT GAME.</span></h1>
            <p className="lead">Founder and CEO of FANTASY MMADNESS. Trainer, manager, gym owner and lifelong student of combat sports. From Reno's amateur boxing gyms to his brother's IBF world championship, Kelly's story is the foundation of this platform.</p>
            <div className="actions">
              <Link className="action" href="/play">Explore fight cards <FaArrowRight /></Link>
              <Link className="action secondary" href="/how-to-play">How it works</Link>
            </div>
          </div>
          <aside className="hero-proof">
            <FounderPhoto className="founder-photo" src="/images/founder/kelly-davis-gym.jpg" alt="Kelly Davis, founder of FANTASY MMADNESS, photographed inside a boxing gym" fallback="KELLY DAVIS · FOUNDER & CEO" />
            <p className="photo-caption">Kelly Davis · Founder & CEO · FANTASY MMADNESS</p>
            <div style={{height:20}} />
            <p className="eyebrow">A championship foundation</p>
            <div className="year">2004</div>
            <h2>IBF CRUISERWEIGHT WORLD CHAMPIONSHIP</h2>
            <p>Kelvin “Koncrete” Davis captured the world title with his brother and trainer, Kelly Davis, in his corner.</p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">The journey</p>
          <h2 className="section-title">THE JOURNEY OF KELLY DAVIS.</h2>
          <p className="section-intro">Kelly began boxing as a teenager in Reno, Nevada, alongside his brother Kelvin. What started with amateur training became decades of professional coaching, managing fighters and building boxing and mixed martial arts gyms.</p>
          <div className="timeline">
            {milestones.map((item) => <article className="milestone" key={item.year}>
              <span className="date">{item.year}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="section ring">
        <div className="wrap ring-grid">
          <div>
            <FounderPhoto className="belt-photo" src="/images/founder/kelly-davis-championship-belts.png" alt="Kelly Davis posing with championship boxing belts" fallback="KELLY DAVIS · CHAMPIONSHIP BOXING TRAINER" />
            <p className="photo-caption">Kelly Davis with championship belts. Kelly trained his brother Kelvin “Koncrete” Davis, the 2004 IBF Cruiserweight World Champion.</p>
          </div>
          <div className="ring-cover" aria-label="Text presentation of The Ring magazine's Brothers-In-Arms feature">
            <div className="publication">The Ring</div>
            <div className="feature">BROTHERS-IN-ARMS</div>
            <div className="credit">KELVIN & KELLY DAVIS · 2004</div>
          </div>
          <div>
            <p className="eyebrow"><FaBookOpen /> National boxing media recognition</p>
            <h2 className="section-title">A CHAMPIONSHIP STORY DOCUMENTED IN THE RING.</h2>
            <p className="section-intro"><em>The Ring</em> magazine documented the brothers' journey in its multi-page feature “Brothers-In-Arms: How Kelvin & Kelly Davis Took Their Two-Man Bandwagon to the Top,” written by Mike Houser, with photography credited to Tom Casino / Showtime. The article follows the two brothers from Reno through the world-title breakthrough, including Kelvin's May 1, 2004 victory over Ezra Sellers. It is an independent, contemporary record of Kelly's role as a championship trainer.</p>
            <p className="ring-note">The graphic at left is a typographic tribute to the article, not a reproduction of the original magazine cover.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">Why we built it</p>
          <h2 className="section-title">THE FIGHT IS MORE THAN THE FINAL RESULT.</h2>
          <p className="section-intro">Every round has its own story. A knockdown, a takedown, a kick, a comeback or a finish can change everything. FANTASY MMADNESS gives fans a way to put their fight knowledge to the test.</p>
          <div className="why-grid">
            <article className="why-card"><FaBullseye size={28} /><h3>PREDICT THE ACTION</h3><p>Make round-by-round predictions across boxing, MMA, kickboxing, bare-knuckle fighting and professional wrestling—not just a pick for who wins.</p></article>
            <article className="why-card"><FaTrophy size={28} /><h3>PROVE YOUR FIGHT IQ</h3><p>Earn points based on scored results and see how your predictions compare with other fans. Standings reflect completed, scored play.</p></article>
            <article className="why-card"><FaFistRaised size={28} /><h3>BUILT FROM REAL EXPERIENCE</h3><p>Founder Kelly Davis brings more than three decades of coaching, gym ownership, management and ringside experience to the idea.</p></article>
            <article className="why-card"><FaUsers size={28} /><h3>GIVING BACK TO THE SPORT</h3><p>Kelly's longer-term vision includes giving back to active and retired fighters, helping fighters and promoters connect with their audiences and explore opportunities beyond fight night.</p></article>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap">
          <p className="eyebrow">Combat sports just got interactive</p>
          <h2>DON'T JUST WATCH THE FIGHT. <span className="accent">PREDICT IT.</span></h2>
          <p>Step into the action, explore upcoming fight cards and see how well you can predict what happens next.</p>
          <div className="actions"><Link className="action" href="/play">Start predicting <FaArrowRight /></Link><Link className="action secondary" href="/auth?mode=signup&role=affiliate">Become an affiliate</Link></div>
        </div>
      </section>
    </main>
  );
}
