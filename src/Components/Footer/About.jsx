import Link from 'next/link';
import founderPhoto from '@/Utils/founderPhoto';
import { FaArrowRight, FaFistRaised, FaTrophy, FaGlobeAmericas, FaShieldAlt } from 'react-icons/fa';

const disciplines = ['BOXING', 'MMA', 'KICKBOXING', 'BARE KNUCKLE', 'PRO WRESTLING'];

export default function About() {
  return (
    <main className="founder-story">
      <section className="founder-hero">
        <div className="founder-inner founder-hero-grid">
          <div>
            <span className="founder-eyebrow">THE STORY BEHIND FANTASY MMADNESS</span>
            <h1>KELLY DAVIS.<br/><em>BUILT IN THE FIGHT GAME.</em></h1>
            <p className="founder-role">FOUNDER &amp; CEO · FANTASY MMADNESS</p><p className="founder-lead">From the boxing gym to the digital arena, FANTASY MMADNESS was created to give combat sports fans a new way to experience every round.</p>
            <div className="founder-actions"><Link href="/play">START PREDICTING <FaArrowRight /></Link><Link href="/how-to-play" className="founder-outline">HOW IT WORKS</Link></div>
          </div>
          <aside className="founder-statement"><img className="founder-portrait" src={founderPhoto} alt="Kelly Davis, founder of FANTASY MMADNESS, in the boxing gym" width="750" height="1624"/><h2>KELLY DAVIS</h2><p>Trainer. Combat sports veteran. Founder of FANTASY MMADNESS.</p></aside>
        </div>
      </section>
      <section id="brothers-in-arms" className="founder-inner founder-story-grid">
        <div><a className="founder-ring-label" href="#brothers-in-arms">THE RING · BROTHERS IN ARMS</a><span className="founder-eyebrow founder-red">A LIFETIME IN COMBAT SPORTS</span><h2>THE EXPERIENCE BEHIND THE VISION</h2><p>Originally from Reno, Nevada, Kelly Davis has been a head trainer since 1998. His experience spans boxing, MMA, kickboxing and bare knuckle, with fights taking him around the world.</p><p>Kelly trained his brother, Kelvin “Concrete” Davis, throughout his boxing career. In 2004, Kelvin became the IBF cruiserweight world champion in Miami, Florida.</p><p>That history shaped a simple idea: fans understand more about a fight than just who wins. They see the punches, momentum shifts, rounds and defining moments.</p></div>
        <div className="founder-milestones"><div><span>1998</span><p>Training and coaching fighters professionally</p></div><div><span>2004</span><p>Kelvin “Concrete” Davis wins the IBF cruiserweight world championship</p></div><div><span>TODAY</span><p>Building a new interactive experience for fight fans worldwide</p></div></div>
      </section>
      <section className="founder-vision"><div className="founder-inner"><span className="founder-eyebrow">THE FANTASY MMADNESS DIFFERENCE</span><h2>WE DON'T PICK WINNERS.<br/><em>WE PREDICT THE GAME.</em></h2><p>Predict what happens inside the fight, earn points for accurate calls and compete on the leaderboard. Built for fans who watch every second—not just the final result.</p><div className="founder-disciplines">{disciplines.map(d => <span key={d}>{d}</span>)}</div></div></section>
      <section className="founder-inner founder-bottom"><FaFistRaised/><h2>DON'T JUST WATCH THE FIGHT. PREDICT IT.</h2><p>Join the next generation of combat sports fans.</p><Link href="/play">PLAY THIS FIGHT <FaArrowRight/></Link></section>
      <style jsx global>{`
        .founder-story{background:#090b10;color:#f6f6f6;overflow:hidden}
        .founder-inner{max-width:1180px;margin:auto;padding-left:24px;padding-right:24px}
        .founder-hero{background:radial-gradient(ellipse at 75% 10%,#681219 0%,transparent 45%),linear-gradient(135deg,#10151e,#08090d 70%);border-bottom:1px solid #2a3038;padding:100px 0 92px}
        .founder-hero-grid{display:grid;grid-template-columns:1.3fr .8fr;gap:70px;align-items:center}
        .founder-eyebrow{display:inline-block;color:#ff6262;font-size:12px;font-weight:900;letter-spacing:3px;margin-bottom:22px}
        .founder-hero h1{font-size:clamp(42px,5.6vw,78px);line-height:1.04;font-weight:950;letter-spacing:-2.5px;margin:0 0 28px}
        .founder-hero h1 em,.founder-vision h2 em{color:#fa2638;font-style:normal}
        .founder-lead{font-size:19px;line-height:1.75;color:#c8cbd1;max-width:650px}
        .founder-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:34px}
        .founder-actions a,.founder-bottom a{display:inline-flex;align-items:center;gap:12px;background:#e7192b;border:1px solid #e7192b;color:white!important;text-decoration:none;padding:16px 24px;font-weight:900;letter-spacing:.6px;border-radius:7px}
        .founder-actions .founder-outline{background:transparent;border-color:#777d87}
        .founder-role{color:#f5a623;font-size:14px;font-weight:800;letter-spacing:1.5px}.founder-ring-label{display:block;width:fit-content;background:#e60012;color:white!important;padding:14px 20px;margin-bottom:26px;font-weight:900;letter-spacing:1px;text-decoration:none}.founder-portrait{display:block;width:100%;height:auto;max-height:540px;object-fit:contain;margin-bottom:24px}.founder-statement{background:linear-gradient(155deg,#20252d,#101217);border:1px solid #424953;border-top:5px solid #f02536;padding:42px 38px;box-shadow:0 24px 70px #0007}
        .founder-ring-box{background:#e60012;border:2px solid #ff4655;min-height:170px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:20px;margin-bottom:30px;box-shadow:0 10px 35px #0005}
        .founder-ring-box span{font-family:Georgia,serif;font-size:clamp(45px,5vw,68px);font-weight:900;letter-spacing:-3px;line-height:1;color:#fff}
        .founder-ring-box small{font-size:10px;font-weight:900;letter-spacing:1.7px;color:#fff;margin-top:14px}
        .founder-statement-top{font-size:12px;letter-spacing:2.5px;color:#b4b8c0;font-weight:800}
        .founder-monogram{font-size:clamp(95px,13vw,160px);line-height:1.2;font-weight:950;letter-spacing:-15px;color:#f4f4f4;margin:22px 0 12px}
        .founder-monogram span{color:#ef2436}
        .founder-statement h2{font-size:30px;letter-spacing:2px;margin:0 0 12px}
        .founder-statement p{color:#bdc2cb;line-height:1.7}
        .founder-rule{height:1px;background:#4b4f58;margin:28px 0}
        .founder-statement strong{font-size:13px;letter-spacing:1.4px;color:#ff5966}
        .founder-story-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:90px;padding-top:100px;padding-bottom:100px}
        .founder-red{color:#ff4756}
        .founder-story-grid h2,.founder-bottom h2{font-size:clamp(32px,4vw,49px);line-height:1.15;margin:0 0 26px}
        .founder-story-grid p{font-size:17px;color:#c5c9d0;line-height:1.85}
        .founder-milestones{border-left:2px solid #e52636;padding-left:30px;display:flex;flex-direction:column;justify-content:space-around;gap:24px}
        .founder-milestones div{border-bottom:1px solid #343944;padding-bottom:20px}
        .founder-milestones span{font-size:32px;font-weight:950;color:#ff3c4e}
        .founder-milestones p{margin:7px 0 0}
        .founder-vision{text-align:center;background:linear-gradient(135deg,#250e13,#13141b 65%);padding:94px 0;border-top:1px solid #40242c;border-bottom:1px solid #40242c}
        .founder-vision h2{font-size:clamp(36px,5vw,65px);line-height:1.15;margin:0 0 24px}
        .founder-vision p{max-width:750px;margin:0 auto 36px;font-size:18px;line-height:1.8;color:#c9c9ce}
        .founder-disciplines{display:flex;justify-content:center;flex-wrap:wrap;gap:12px}
        .founder-disciplines span{padding:11px 16px;border:1px solid #5b3439;border-radius:5px;font-size:12px;letter-spacing:1px;font-weight:900}
        .founder-bottom{text-align:center;padding-top:90px;padding-bottom:110px}
        .founder-bottom>svg{font-size:38px;color:#ef293a;margin-bottom:18px}
        .founder-bottom p{color:#b6bbc4;margin-bottom:28px}
        @media(max-width:800px){.founder-hero{padding:65px 0}.founder-hero-grid,.founder-story-grid{grid-template-columns:1fr;gap:38px}.founder-story-grid{padding-top:70px;padding-bottom:70px}.founder-statement{padding:30px}.founder-monogram{font-size:100px}.founder-vision{padding:70px 0}.founder-hero h1{letter-spacing:-1px}}
      `}</style>
    </main>
  );
}
