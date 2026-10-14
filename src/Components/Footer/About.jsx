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
            <p className={styles.eyebrow}>THE FOUNDER</p>
            <h1 id="founder-name">Kelly<br/><span>Davis.</span></h1>
            <p className={styles.role}>Founder &amp; CEO, FANTASY MMADNESS</p>
            <div className={styles.line}/>
            <p className={styles.lead}>A lifetime in the corner.<br/>A new way to experience the fight.</p>
            <p className={styles.summary}>From training fighters to building a game for the fans, Kelly brings decades of combat sports experience to every round.</p>
            <a href="#the-story" className={styles.storyLink}>Discover the story <span aria-hidden="true">↓</span></a>
          </div>
          <figure className={styles.portrait}><img src={founderPhoto} alt="Kelly Davis in the boxing gym" width="750" height="1624" fetchPriority="high"/><figcaption><span>FROM THE GYM TO THE GAME</span><span>KELLY DAVIS / FOUNDER</span></figcaption></figure>
        </section>
        <section className={styles.chapter} id="the-story" aria-labelledby="story-heading">
          <div><p className={styles.eyebrow}>01 / THE EXPERIENCE</p><h2 id="story-heading">Built on years<br/>inside the fight game.</h2></div>
          <div className={styles.prose}><p>Originally from Reno, Nevada, Kelly has been a head trainer since 1998. His work spans boxing, MMA, kickboxing and bare knuckle, with fights taking him around the world.</p><p>He knows the preparation behind every performance: the hours in the gym, the decisions in the corner, and the moments that can change a round. That perspective is the foundation of FANTASY MMADNESS.</p></div>
        </section>
        <section className={styles.brothers} id="brothers-in-arms" aria-labelledby="brothers-heading">
          <div className={styles.year}><span>A CHAMPIONSHIP CHAPTER</span><strong>2004</strong><span>IBF CRUISERWEIGHT WORLD TITLE</span></div>
          <div><p className={styles.eyebrow}>02 / BROTHERS IN ARMS</p><h2 id="brothers-heading">Family. Dedication.<br/>A world championship.</h2><p>Kelly trained his brother, Kelvin “Concrete” Davis, throughout his boxing career. In 2004, Kelvin became the IBF cruiserweight world champion in Miami, Florida.</p><p>It is a shared history built on trust, discipline and a life spent working toward the next round.</p></div>
        </section>
        <section className={styles.chapter} aria-labelledby="vision-heading">
          <div><p className={styles.eyebrow}>03 / THE VISION</p><h2 id="vision-heading">For fans who see<br/>every detail.</h2></div>
          <div className={styles.prose}><p>A fight is more than its final result. Fans read the pace, spot momentum shifts and watch the details that make each round different.</p><p>Kelly created FANTASY MMADNESS to turn that knowledge into participation: predict what happens inside the fight, earn points for accurate calls and compete with other fans.</p><p className={styles.disciplines}>BOXING · MMA · KICKBOXING · BARE KNUCKLE · PRO WRESTLING</p></div>
        </section>
        <section className={styles.closing}><p className={styles.eyebrow}>THE NEXT ROUND STARTS WITH YOU</p><h2>We don’t pick winners.<br/><span>We predict the game.</span></h2><Link href="/play" className={styles.play}>Start predicting ↗</Link></section>
      </main>
      <footer className={styles.footer}><Link href="/">FANTASY MMADNESS</Link><span>DON’T JUST WATCH THE FIGHT. PREDICT IT.</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </div>
  );
}
