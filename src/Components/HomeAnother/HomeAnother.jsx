import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { fetchMatches } from '../../Redux/matchSlice';
import Link from 'next/link';
import ReactPlayer from 'react-player/lazy';
import Head from 'next/head';

const formatDateTime = (match) => {
  const rawDate = match?.matchDate?.split?.('T')?.[0];
  const rawTime = match?.matchTime || '00:00';
  const date = rawDate ? new Date(`${rawDate}T${rawTime}:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Schedule pending';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const getUpcomingMatches = (matches) => {
  const now = new Date();
  return (Array.isArray(matches) ? matches : [])
    .filter((match) => {
      const rawDate = match?.matchDate?.split?.('T')?.[0];
      if (!rawDate || !match?.matchTime) return true;
      const matchDate = new Date(`${rawDate}T${match.matchTime}:00`);
      return Number.isNaN(matchDate.getTime()) || matchDate >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a?.matchDate?.split?.('T')?.[0] || ''}T${a?.matchTime || '00:00'}:00`).getTime();
      const dateB = new Date(`${b?.matchDate?.split?.('T')?.[0] || ''}T${b?.matchTime || '00:00'}:00`).getTime();
      return (Number.isNaN(dateA) ? Infinity : dateA) - (Number.isNaN(dateB) ? Infinity : dateB);
    })
    .slice(0, 4);
};

const fightTitle = (match) => match ? `${match.matchFighterA || 'Fighter A'} vs ${match.matchFighterB || 'Fighter B'}` : 'Next Fight Loading';

const HomeAnother = () => {
  const dispatch = useDispatch();
  const howlerRef = useRef(null);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const matchError = useSelector((state) => state.matches.error);
  const [buttonText, setButtonText] = useState('Send Message');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentSeek = howlerRef.current?.seek() || 0;
    dispatch(stopMusic(currentSeek));
    return () => dispatch(playMusic());
  }, [dispatch]);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  const upcomingMatches = useMemo(() => getUpcomingMatches(matches), [matches]);
  const primaryFight = upcomingMatches[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setButtonText('Sending');
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/contact-us-fantasymmadness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setButtonText('Message Sent');
        e.target.reset();
      } else {
        setButtonText('Try Again');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setButtonText('Try Again');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setButtonText('Send Message'), 2500);
    }
  };

  return (
    <>
      <Head>
        <title>Fantasy MMAadness | Fantasy Combat Sports, MMA, Boxing</title>
        <meta name="description" content="Play Fantasy MMA, Fantasy Boxing, Fantasy UFC, Fantasy BKFC, Fantasy Kickboxing, and Fantasy Bare Knuckle. Create dream fantasy fights, climb fighter rankings, and dominate fantasy combat leagues." />
        <meta property="og:title" content="Fantasy MMAadness - Fantasy Fighting Action Awaits" />
        <meta property="og:description" content="Join Fantasy MMAadness and experience the ultimate fantasy combat sports world. Build lineups for Fantasy MMA, Boxing, Wrestling, and more!" />
        <meta property="og:url" content="https://fantasymmadness.com/" />
        <meta name="keywords" content="Fantasy MMA, Fantasy UFC, Fantasy BKFC, Fantasy Boxing, Fantasy Kickboxing, Fantasy Bare Knuckle, Fantasy Combat, Fantasy Fighting, Fantasy Sports Betting Combat, Fantasy Fighter Rankings, Fantasy League Combat Sports, Fantasy Matchups, Fantasy Wrestling, Fantasy Combat Sports Analysis" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Fantasy MMAadness', url: 'https://www.fantasymmadness.com', description: 'Play Fantasy MMA, Boxing, Kickboxing, and Fantasy Combat Sports leagues. Draft fighters, score big, and win rewards.', potentialAction: { '@type': 'SearchAction', target: 'https://www.fantasymmadness.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } }) }} />
      </Head>

      <div className="theme-home page-shell">
        <section className="theme-hero bg-hero-fade">
          <div className="theme-container theme-hero-grid">
            <div className="theme-hero-copy">
              <p className="theme-eyebrow">Fantasy Combat Sports · V2</p>
              <h1>Predict Combat Sports. <span>Score Every Round.</span></h1>
              <p className="theme-hero-subtitle">Join MMA, boxing, kickboxing, wrestling, and bare-knuckle prediction contests. Pick winners, methods, rounds, and key stats. Climb live leaderboards and win fantasy rewards.</p>
              <div className="theme-hero-actions"><Link href="/mock-game" className="theme-btn theme-btn-primary">Try Demo Fight</Link><Link href="/upcomingfights" className="theme-btn theme-btn-secondary">Join Free Contest</Link></div>
              <div className="theme-proof-grid"><div><strong>100% Free</strong><span>To play</span></div><div><strong>Real Prizes</strong><span>Every week</span></div><div><strong>Fast Payouts</strong><span>Wallet ledger</span></div><div><strong>Secure & Fair</strong><span>Auditable scoring</span></div></div>
            </div>
            <aside className="theme-next-fight-card">
              <p className="theme-eyebrow">Next Big Fight</p>
              <h2>{primaryFight ? primaryFight.matchFighterA : 'Upcoming'} <span>vs</span> {primaryFight ? primaryFight.matchFighterB : 'Matchup'}</h2>
              <div className="theme-fight-meta-grid"><div><span>Date</span><strong>{formatDateTime(primaryFight)}</strong></div><div><span>Category</span><strong>{primaryFight?.matchCategoryTwo || primaryFight?.matchCategory || 'Combat Sports'}</strong></div><div><span>Status</span><strong>{primaryFight?.matchStatus || 'Open'}</strong></div><div><span>Predictions</span><strong>{primaryFight?.userPredictions?.length || 0}</strong></div></div>
              <Link href="/upcomingfights" className="theme-btn theme-btn-primary theme-full-width">Make Prediction</Link>
            </aside>
          </div>
        </section>
        <main className="theme-container theme-home-main">
          <section>
            <div className="theme-section-heading"><p className="theme-eyebrow">Active Contests</p><div><h2>Fight cards ready for picks</h2><Link href="/upcomingfights">View all fights</Link></div></div>
            <div className="theme-contest-grid">
              {matchStatus === 'loading' && <div className="theme-empty-card">Loading active fights...</div>}
              {matchStatus === 'failed' && <div className="theme-empty-card">Unable to load fights: {matchError}</div>}
              {matchStatus !== 'loading' && matchStatus !== 'failed' && upcomingMatches.length === 0 && <div className="theme-empty-card">No upcoming fights are currently open.</div>}
              {upcomingMatches.map((match) => <article className="theme-contest-card" key={match._id || fightTitle(match)}><div className="theme-contest-images"><img src={match.fighterAImage || '/images/hero-fight.png'} alt={match.matchFighterA || 'Fighter A'} loading="lazy" /><strong>VS</strong><img src={match.fighterBImage || '/images/hero-fight.png'} alt={match.matchFighterB || 'Fighter B'} loading="lazy" /></div><p className="theme-card-kicker">{match.matchCategoryTwo || match.matchCategory || 'Combat Sports'}</p><h3>{match.matchFighterA || 'Fighter A'} <span>vs</span> {match.matchFighterB || 'Fighter B'}</h3><div className="theme-card-stats"><span>{formatDateTime(match)}</span><span>{match.matchStatus || 'Open'} · {match.userPredictions?.length || 0} predictions</span></div><Link href="/upcomingfights" className="theme-btn theme-btn-primary theme-full-width">Enter Contest</Link></article>)}
            </div>
          </section>
          <section className="theme-info-grid">
            <div className="theme-panel"><p className="theme-eyebrow">How it works</p><h2>Make smarter fight picks</h2>{['Pick winner, method, round and stats', 'Score points based on accuracy', 'Climb ranks and win rewards'].map((step, index) => <div className="theme-step" key={step}><span>{index + 1}</span><p>{step}</p></div>)}<Link href="/guides" className="theme-link-red">Read gameplay guide</Link></div>
            <div className="theme-panel"><p className="theme-eyebrow">Live the action</p><h2>Fantasy fight predictor</h2><p>Activate your fight IQ in real time. Choose winners, methods, and rounds while tracking your score against the global leaderboard.</p><div className="theme-video-frame"><ReactPlayer url="https://www.youtube.com/watch?v=erHfHDovoCE" playing muted loop controls={false} width="100%" height="100%" /></div></div>
            <div className="theme-panel"><p className="theme-eyebrow">Recent winners</p><h2>Rewards every week</h2>{[['Tasha', '$2,500'], ['Kelly', '$1,000'], ['Wajih ul Hassan', '$750']].map(([name, amount]) => <div className="theme-list-row" key={name}><span>🏆</span><p>{name}</p><strong>{amount}</strong></div>)}<Link href="/global-leaderboard" className="theme-link-red">Open leaderboard</Link></div>
          </section>
          <section className="theme-metrics-grid"><div className="theme-metric-card"><p>Players</p><strong>128K+</strong><p>Worldwide community</p></div><div className="theme-metric-card"><p>Predictions</p><strong>4.2M+</strong><p>Submitted</p></div><div className="theme-metric-card"><p>Tokens Awarded</p><strong>$1.7M+</strong><p>To champions</p></div><div className="theme-metric-card"><p>Secure & Fair</p><strong>100%</strong><p>Auditable scoring</p></div></section>
          <section className="theme-contact-panel"><div><p className="theme-eyebrow">Contact Fantasy MMAdness</p><h2>Questions about leagues, sponsors, or fight cards?</h2><p>Send a message to the production contact endpoint. The payload and request behavior are unchanged.</p></div><form onSubmit={handleSubmit}><input type="text" name="fullName" placeholder="Full name" required /><input type="email" name="email" placeholder="Email address" required /><input type="text" name="subject" placeholder="Subject" required /><textarea name="message" placeholder="Message" required /><button type="submit" className="theme-btn theme-btn-primary" disabled={isSubmitting}>{buttonText}</button></form></section>
        </main>
      </div>
    </>
  );
};

export default HomeAnother;
