import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaCheck, FaChevronLeft, FaComments, FaHome, FaRedo, FaTrophy } from 'react-icons/fa';

const ASSET_BASE = '/images/mobile-home/final-v35';

const createCard = (genre) => {
  const card = { a: {}, b: {}, winner: '', outcome: '' };
  genre.cats.forEach(([key]) => {
    card.a[key] = 0;
    card.b[key] = 0;
  });
  return card;
};

const demoGenres = {
  boxing: {
    title: 'BOXING / BARE KNUCKLE',
    subtitle: 'Punching scorecard format',
    color: '#f2b544',
    emoji: '🥊',
    fa: 'IRON JACKSON',
    fb: 'SLICK MORALES',
    imageA: `${ASSET_BASE}/sport-boxing.webp`,
    imageB: `${ASSET_BASE}/sport-bareknuckle.webp`,
    cats: [
      ['hp', 'Head Punches', 'Any punch thrown at the head'],
      ['bp', 'Body Punches', 'Any punch thrown at the body'],
      ['tp', 'Total Punches', 'All punches thrown, independent of HP + BP'],
    ],
    rounds: [
      { note: 'Jackson presses forward behind the jab', a: { hp: 12, bp: 6, tp: 20 }, b: { hp: 9, bp: 5, tp: 16 } },
      { note: 'Morales counters clean off the ropes', a: { hp: 10, bp: 5, tp: 17 }, b: { hp: 13, bp: 7, tp: 22 } },
      { note: 'Jackson closes the round on volume', a: { hp: 14, bp: 8, tp: 24 }, b: { hp: 11, bp: 6, tp: 19 } },
    ],
  },
  mma: {
    title: 'MMA / KICKBOXING',
    subtitle: 'Striking scorecard format',
    color: '#4d8dff',
    emoji: '👊',
    fa: 'HAWK',
    fb: 'VIPER',
    imageA: `${ASSET_BASE}/sport-mma.webp`,
    imageB: `${ASSET_BASE}/sport-kickboxing.webp`,
    cats: [
      ['hp', 'Head Punches', 'Any punch thrown at the head'],
      ['bp', 'Body Punches', 'Any punch thrown at the body'],
      ['kicks', 'Kicks', 'Any leg, body, or head kick thrown'],
      ['knees', 'Knees', 'Any clinch or flying knee thrown'],
      ['elbows', 'Elbows', 'Any elbow strike thrown'],
    ],
    rounds: [
      { note: 'Both fighters find range early', a: { hp: 4, bp: 2, kicks: 1, knees: 1, elbows: 0 }, b: { hp: 3, bp: 2, kicks: 2, knees: 0, elbows: 0 } },
      { note: 'Viper opens up with leg kicks', a: { hp: 5, bp: 3, kicks: 0, knees: 1, elbows: 0 }, b: { hp: 2, bp: 1, kicks: 5, knees: 1, elbows: 1 } },
      { note: 'Hawk closes strong behind volume', a: { hp: 6, bp: 3, kicks: 1, knees: 0, elbows: 0 }, b: { hp: 4, bp: 2, kicks: 2, knees: 0, elbows: 1 } },
    ],
  },
  wrestling: {
    title: 'PRO WRESTLING',
    subtitle: '25-minute fantasy card format',
    color: '#a855f7',
    emoji: '🤼',
    fa: 'THE MAULER',
    fb: 'SHOWTIME',
    imageA: `${ASSET_BASE}/sport-wrestling.webp`,
    imageB: `${ASSET_BASE}/pasted-1785012202182-0.png`,
    cats: [
      ['hp', 'Head Strikes', 'Closed-fist strikes, forearms, and open-hand strikes'],
      ['bp', 'Body Strikes', 'Body punches and forearm shots'],
      ['kicks', 'Kicks', 'Dropkicks, superkicks, and roundhouse kicks'],
      ['pm', 'Power Moves', 'Slams, suplexes, and powerbombs'],
      ['fm', 'Finishers', 'Signature finishing sequences'],
    ],
    rounds: [
      { note: 'Early lock-up, feeling out the pace', a: { hp: 3, bp: 2, kicks: 1, pm: 1, fm: 0 }, b: { hp: 2, bp: 2, kicks: 1, pm: 1, fm: 0 } },
      { note: 'Showtime hits a big power move', a: { hp: 3, bp: 2, kicks: 2, pm: 1, fm: 0 }, b: { hp: 4, bp: 3, kicks: 1, pm: 2, fm: 0 } },
      { note: 'The Mauler lands the finisher', a: { hp: 4, bp: 3, kicks: 2, pm: 2, fm: 1 }, b: { hp: 3, bp: 2, kicks: 1, pm: 1, fm: 0 } },
    ],
  },
};

const steps = ['MEET', 'SCORECARD', 'LIVE SCORE', 'LEADERBOARD', 'COMMENTS', 'RECAP'];

const roundTotal = (round, side, cats) => cats.reduce((total, [key]) => total + Number(round[side]?.[key] || 0), 0);

export default function FreeDemoFight() {
  const [genreKey, setGenreKey] = useState('');
  const [card, setCard] = useState(null);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [tried, setTried] = useState({});
  const [comments, setComments] = useState([
    { id: 'one', name: 'DemoBot_Ace', text: 'Good luck everyone! 🔥' },
    { id: 'two', name: 'DemoBot_Rook', text: 'Let’s see how this scores out.' },
  ]);
  const [comment, setComment] = useState('');

  const genre = genreKey ? demoGenres[genreKey] : null;
  const leaderboard = useMemo(() => {
    const youWon = card?.winner === 'a';
    return [
      { name: 'You', score: revealed >= 3 ? (youWon ? 87 : 42) : 0 },
      { name: 'DemoBot_Nova', score: revealed >= 3 ? 73 : 0 },
      { name: 'DemoBot_Ace', score: revealed >= 3 ? 61 : 0 },
      { name: 'DemoBot_Rook', score: revealed >= 3 ? 55 : 0 },
      { name: 'DemoBot_Zed', score: revealed >= 3 ? 38 : 0 },
    ].sort((a, b) => b.score - a.score);
  }, [card?.winner, revealed]);

  const startGenre = (key) => {
    const nextGenre = demoGenres[key];
    setGenreKey(key);
    setCard(createCard(nextGenre));
    setStep(0);
    setRevealed(0);
  };

  const updateCard = (side, key, delta) => {
    setCard((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [key]: Math.max(0, Number(current[side]?.[key] || 0) + delta),
      },
    }));
  };

  const nextStep = () => {
    if (step === 1 && !card?.winner) return;
    setStep((current) => Math.min(5, current + 1));
  };

  const finishCard = () => {
    setTried((current) => ({ ...current, [genreKey]: true }));
    setGenreKey('');
    setCard(null);
    setStep(0);
    setRevealed(0);
  };

  const addComment = () => {
    const text = comment.trim();
    if (!text) return;
    setComments((current) => [...current, { id: Date.now(), name: 'You', text }]);
    setComment('');
  };

  const triedCount = Object.values(tried).filter(Boolean).length;

  return (
    <>
      <Head>
        <title>Free Demo Fight | Fantasy MMAdness</title>
        <meta name="description" content="Try the Fantasy MMAdness scorecard flow with no coins needed." />
      </Head>
      <main className="fmm-demo-page">
        <section className="fmm-demo-phone">
          <header className="fmm-demo-topbar">
            <Link href="/" aria-label="Back to home"><FaChevronLeft /></Link>
            <div><strong>FREE DEMO</strong><span>No coins needed</span></div>
            <Link href="/leaderboard" aria-label="Leaderboard"><FaTrophy /></Link>
          </header>

          {!genre && (
            <section className="fmm-demo-select">
              <h1>🎓 FREE DEMO WALKTHROUGH</h1>
              <p>Pick a genre and play the same kind of mobile scorecard flow from the client design.</p>
              <strong>{triedCount} OF 3 CARD TYPES TRIED</strong>
              <div className="fmm-demo-genre-list">
                {Object.entries(demoGenres).map(([key, item]) => (
                  <button type="button" key={key} style={{ '--demo-color': item.color }} onClick={() => startGenre(key)}>
                    {tried[key] && <em>✓ TRIED</em>}
                    <span>{item.emoji}</span>
                    <b>{item.title}</b>
                    <small>{item.fa} vs {item.fb} · practice this scorecard →</small>
                  </button>
                ))}
              </div>
              {triedCount >= 3 && (
                <div className="fmm-demo-complete">
                  <b>🏆 YOU’VE TRIED EVERY SCORECARD TYPE!</b>
                  <Link href="/upcomingfights">SEE ALL OPEN FIGHTS</Link>
                </div>
              )}
            </section>
          )}

          {genre && card && (
            <section className="fmm-demo-flow" style={{ '--demo-color': genre.color }}>
              <div className="fmm-demo-flow-head">
                <button type="button" onClick={() => setGenreKey('')}>✕ EXIT</button>
                <div><b>{genre.emoji} {genre.title}</b><span>{genre.fa} vs {genre.fb}</span></div>
              </div>

              <nav className="fmm-demo-steps">
                {steps.map((label, index) => <i key={label} className={index <= step ? 'is-active' : ''}><b /><span>{label}</span></i>)}
              </nav>

              {step === 0 && (
                <div className="fmm-demo-panel">
                  <div className="fmm-demo-fighters">
                    {[['a', genre.fa, genre.imageA], ['b', genre.fb, genre.imageB]].map(([side, name, image]) => (
                      <article key={side}>
                        <img src={image} alt={name} />
                        <h2>{name}</h2>
                        <p>Demo fighter · practice profile</p>
                      </article>
                    ))}
                  </div>
                  <button type="button" className="fmm-demo-primary" onClick={nextStep}>START THE SCORECARD →</button>
                </div>
              )}

              {step === 1 && (
                <div className="fmm-demo-panel">
                  <p className="fmm-demo-help">Use + / − to make stat predictions for both fighters. Higher correct predictions score more.</p>
                  {genre.cats.map(([key, label, hint]) => (
                    <div className="fmm-demo-stat" key={key}>
                      <header><b>{label}</b><small>{hint}</small></header>
                      {['a', 'b'].map((side) => (
                        <div key={side}>
                          <span>{side === 'a' ? genre.fa : genre.fb}</span>
                          <button type="button" onClick={() => updateCard(side, key, -1)}>−</button>
                          <strong>{card[side][key]}</strong>
                          <button type="button" onClick={() => updateCard(side, key, 1)}>+</button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="fmm-demo-pick-row">
                    <button type="button" className={card.winner === 'a' ? 'is-active' : ''} onClick={() => setCard((current) => ({ ...current, winner: 'a' }))}>PICK {genre.fa}</button>
                    <button type="button" className={card.winner === 'b' ? 'is-active' : ''} onClick={() => setCard((current) => ({ ...current, winner: 'b' }))}>PICK {genre.fb}</button>
                  </div>
                  {genreKey !== 'wrestling' && (
                    <div className="fmm-demo-pick-row is-red">
                      <button type="button" className={card.outcome === 'a' ? 'is-active' : ''} onClick={() => setCard((current) => ({ ...current, outcome: 'a' }))}>{genre.fa} BY FINISH</button>
                      <button type="button" className={card.outcome === 'b' ? 'is-active' : ''} onClick={() => setCard((current) => ({ ...current, outcome: 'b' }))}>{genre.fb} BY FINISH</button>
                    </div>
                  )}
                  <div className="fmm-demo-actions"><button type="button" onClick={() => setStep(0)}>← BACK</button><button type="button" className="fmm-demo-primary" onClick={nextStep}>SUBMIT & WATCH IT SCORE →</button></div>
                </div>
              )}

              {step === 2 && (
                <div className="fmm-demo-panel">
                  <p className="fmm-demo-help">Reveal each round and watch totals move, just like the mobile design walkthrough.</p>
                  {genre.rounds.slice(0, revealed).map((round, index) => (
                    <article className="fmm-demo-round" key={index}>
                      <h3>ROUND {index + 1}</h3><p>{round.note}</p>
                      <div><b>{genre.fa}</b><span>{roundTotal(round, 'a', genre.cats)}</span></div>
                      <div><b>{genre.fb}</b><span>{roundTotal(round, 'b', genre.cats)}</span></div>
                      <section>{genre.cats.map(([key, label]) => <small key={key}>{label}: {round.a[key]} / {round.b[key]}</small>)}</section>
                    </article>
                  ))}
                  {revealed < 3 ? <button type="button" className="fmm-demo-primary is-gold" onClick={() => setRevealed((current) => current + 1)}>REVEAL ROUND {revealed + 1} →</button> : <button type="button" className="fmm-demo-primary is-green" onClick={nextStep}>SEE HOW THE LEADERBOARD MOVED →</button>}
                </div>
              )}

              {step === 3 && (
                <div className="fmm-demo-panel">
                  <p className="fmm-demo-help">Your score ranks against every player in the same contest.</p>
                  <div className="fmm-demo-leaderboard">
                    {leaderboard.map((row, index) => <p key={row.name} className={row.name === 'You' ? 'is-you' : ''}><span>{index + 1}. {row.name}</span><b>{row.score} PTS</b></p>)}
                  </div>
                  <button type="button" className="fmm-demo-primary is-green" onClick={nextStep}>SEE POST-FIGHT COMMENTS →</button>
                </div>
              )}

              {step === 4 && (
                <div className="fmm-demo-panel">
                  <p className="fmm-demo-help">Every fight has a comment thread. Try it below.</p>
                  <div className="fmm-demo-comments">
                    {comments.map((item) => <p key={item.id}><b>{item.name}: </b>{item.text}</p>)}
                  </div>
                  <div className="fmm-demo-comment-box"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addComment(); }} placeholder="Type a comment..." /><button type="button" onClick={addComment}><FaComments /></button></div>
                  <button type="button" className="fmm-demo-primary is-green" onClick={nextStep}>FINISH THIS CARD →</button>
                </div>
              )}

              {step === 5 && (
                <div className="fmm-demo-panel">
                  <h2 className="fmm-demo-finished"><FaCheck /> CARD COMPLETE — {genre.title}</h2>
                  <ul>
                    <li>Scorecards: predict stats per fighter plus the winner.</li>
                    <li>Round scoring: each round adds to your total.</li>
                    <li>Leaderboard: your score ranks against all players.</li>
                    <li>Comments: every fight has its own discussion thread.</li>
                  </ul>
                  <button type="button" className="fmm-demo-primary" onClick={finishCard}>→ TRY ANOTHER CARD TYPE</button>
                  <Link className="fmm-demo-secondary" href="/upcomingfights">🔥 SEE ALL OPEN FIGHTS NOW</Link>
                </div>
              )}
            </section>
          )}

          <footer className="fmm-demo-footer"><Link href="/"><FaHome /> Back to Home</Link><Link href="/upcomingfights">Contests</Link><Link href="/leaderboard">Leaderboard</Link></footer>
        </section>
      </main>
    </>
  );
}
