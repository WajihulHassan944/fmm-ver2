import Link from 'next/link';
import founderPhoto from '@/Utils/founderPhoto';
import styles from './Founder.module.css';

export default function About() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><img src="/site/logo.jpg" width="40" height="40" alt=""/><span>FANTASY <b>MMADNESS</b></span></Link>
        <nav aria-label="Founder page navigation"><Link href="/">Home</Link><Link href="/how-to-play">How to play</Link><Link href="/play" className={styles.play}>Play a fight ↗</Link></nav>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="founder-name">
          <div className={styles.intro}>
            <p className={styles.eyebrow}>THE STORY BEHIND FANTASY MMADNESS</p>
            <h1 id="founder-name">Kelly<br/><span>Davis.</span></h1>
            <p className={styles.role}>Founder &amp; CEO, FANTASY MMADNESS</p>
            <div className={styles.line}/>
            <p className={styles.lead}>FROM THE CORNER TO THE FUTURE OF COMBAT SPORTS.</p>
            <p className={styles.summary}>With more than 30 years in combat sports and experience as a head trainer since 1998, Kelly Davis built FANTASY MMADNESS from a lifetime spent understanding what happens inside every round.</p>
            <a href="#the-story" className={styles.storyLink}>Discover the story <span aria-hidden="true">↓</span></a>
          </div>
          <figure className={styles.portrait}><img src={founderPhoto} alt="Kelly Davis in the boxing gym" width="750" height="1624" fetchPriority="high"/><figcaption><span>FROM THE GYM TO THE GAME</span><span>KELLY DAVIS / FOUNDER</span></figcaption></figure>
        </section>
        <section className={styles.chapter} id="the-story" aria-labelledby="story-heading">
          <div><p className={styles.eyebrow}>01 / THE EXPERIENCE</p><h2 id="story-heading">Built on years<br/>inside the fight game.</h2></div>
          <div className={styles.prose}><p>Born and raised in Reno, Nevada, Kelly Davis has spent more than three decades in the fight business. A head trainer since 1998, his experience spans professional boxing, MMA and the UFC, kickboxing and bare-knuckle fighting. His work has taken him to training camps and fight events around the world.</p><p>Kelly has worked throughout combat sports as a trainer and cornerman, and his experience extends to management, judging, refereeing and cutman duties. He understands what the audience rarely sees: the hours of preparation, the adjustments between rounds, the pressure in the corner, and the split-second decisions that change a fight. That knowledge became the foundation of FANTASY MMADNESS.</p></div>
        </section>
        <section className={styles.brothers} id="brothers-in-arms" aria-labelledby="brothers-heading">
          <div className={styles.year}><span>A CHAMPIONSHIP CHAPTER</span><strong>2004</strong><span>IBF CRUISERWEIGHT WORLD TITLE</span></div>
          <div><p className={styles.eyebrow}>02 / BROTHERS IN ARMS</p><h2 id="brothers-heading">Family. Dedication.<br/>A world championship.</h2><p>Kelly trained his brother, Kelvin “Concrete” Davis, throughout his boxing career. In 2004, Kelvin became the IBF cruiserweight world champion in Miami, Florida.</p><p>Together, the brothers built their boxing journey out of Reno and Koncrete Gym. Kelvin’s championship was the result of years of dedication, setbacks, sacrifice and trust between fighter and trainer. Their journey received national coverage in The Ring magazine’s “Brothers-In-Arms” feature by Mike Houser, with photography credited to Tom Casino/Showtime.</p></div>
        </section>
        <section className={styles.ringFeature} aria-labelledby="ring-heading"><div><p className={styles.eyebrow}>FEATURED BOXING HISTORY</p><h2 id="ring-heading">THE <span>RING</span> MAGAZINE</h2><p>The story of Kelvin “Concrete” Davis and the team behind his world championship belongs in the history of the sport. Kelly trained Kelvin throughout his boxing career, including his 2004 IBF cruiserweight title run.</p><p>The original six-page “Brothers-In-Arms” magazine feature tells the story behind the championship, including the brothers’ journey from Reno to the world-title stage.</p></div><div className={styles.ringMark} aria-label="The Ring Magazine feature">THE <strong>RING</strong><small>BOXING HISTORY · 2004</small></div></section><section className={styles.chapter} aria-labelledby="vision-heading">
          <div><p className={styles.eyebrow}>03 / THE VISION</p><h2 id="vision-heading">For fans who see<br/>every detail.</h2></div>
          <div className={styles.prose}><p>A fight is more than its final result. Fans read the pace, spot momentum shifts and watch the details that make each round different.</p><p>Kelly created FANTASY MMADNESS because he wanted fans to do more than simply choose a winner. The platform invites fans to predict the action round by round, earn points for accurate predictions and compete on leaderboards. Built for boxing, MMA, kickboxing, bare knuckle and pro wrestling, the game brings the fan closer to the strategy, anticipation and drama of every contest.</p><p className={styles.disciplines}>BOXING · MMA · KICKBOXING · BARE KNUCKLE · PRO WRESTLING</p></div>
        </section>
        <section className={styles.closing}><p className={styles.eyebrow}>THE NEXT ROUND STARTS WITH YOU</p><h2>We don’t pick winners.<br/><span>We predict the game.</span></h2><Link href="/play" className={styles.play}>PLAY THIS FIGHT ↗</Link></section>
      </main>
      <footer className={styles.footer}><Link href="/">FANTASY MMADNESS</Link><span>DON’T JUST WATCH THE FIGHT. PREDICT IT.</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </div>
  );
}
