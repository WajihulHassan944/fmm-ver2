import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaFistRaised,
  FaFlagCheckered,
  FaLock,
  FaMapMarkerAlt,
  FaPlay,
  FaShieldAlt,
  FaTicketAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import RoundByRoundMockScores from './RoundByRoundMockScores';
import { ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const createInitialRounds = () => Array.from({ length: 3 }, (_, index) => ({
  round: index + 1,
  hpPrediction1: '', hpPrediction2: '', bpPrediction1: '', bpPrediction2: '', tpPrediction1: '', tpPrediction2: '',
  stPrediction1: '', stPrediction2: '', kiPrediction1: '', kiPrediction2: '', knPrediction1: '', knPrediction2: '', elPrediction1: '', elPrediction2: '',
  rwPrediction1: 0, rwPrediction2: 0, koPrediction1: 0, koPrediction2: 0,
  rwBorder: '2px solid #95a04d', rlBorder: '2px solid #95a04d', koBorder: '2px solid #95a04d', spBorder: '2px solid #95a04d',
  rwText: 'Fighter A', rlText: 'Fighter B', koText: 'KO A', spText: 'KO B',
}));

const fightCards = [
  {
    id: 'bkfc-main-event',
    promotion: 'BKFC Fight Night',
    bout: 'Main event · 3-round simulator',
    category: 'Boxing',
    date: 'Saturday · 10:00 PM',
    venue: 'Fight-night arena',
    crowd: '1,248 mock entries',
    fighterOne: { name: 'Michael Venom Page', shortName: 'M. Page', image: `${FMM_ASSET_BASE}/fighter-action-blue.jpg`, record: '22-2-0' },
    fighterTwo: { name: 'Mike Perry', shortName: 'M. Perry', image: `${FMM_ASSET_BASE}/fighter-action-red.jpg`, record: '14-8-0' },
  },
  {
    id: 'fmm-cage-series',
    promotion: 'FMM Cage Series 12',
    bout: 'Co-main event · 3-round simulator',
    category: 'MMA',
    date: 'Sunday · 8:30 PM',
    venue: 'Madness performance center',
    crowd: '936 mock entries',
    fighterOne: { name: 'Jadden Addison', shortName: 'J. Addison', image: `${FMM_ASSET_BASE}/fighter-jadden-addison.png`, record: '13-1-0' },
    fighterTwo: { name: 'Zaveer Davis', shortName: 'Z. Davis', image: `${FMM_ASSET_BASE}/fighter-zaveer-davis.png`, record: '12-2-0' },
  },
  {
    id: 'fmm-boxing-series',
    promotion: 'FMM Boxing Series',
    bout: 'Featured bout · 3-round simulator',
    category: 'Boxing',
    date: 'Friday · 9:15 PM',
    venue: 'Red corner arena',
    crowd: '782 mock entries',
    fighterOne: { name: 'Chris Eubank Jr.', shortName: 'C. Eubank Jr.', image: `${FMM_ASSET_BASE}/fighter-chris-eubank-jr.png`, record: '34-3-0' },
    fighterTwo: { name: 'Conor Benn', shortName: 'C. Benn', image: `${FMM_ASSET_BASE}/fighter-conor-benn.png`, record: '23-0-0' },
  },
];

const metricSets = {
  Boxing: [
    ['hpPrediction', 'Head punches', 'HP'],
    ['bpPrediction', 'Body punches', 'BP'],
    ['tpPrediction', 'Total punches', 'TP'],
  ],
  MMA: [
    ['stPrediction', 'Strikes', 'ST'],
    ['kiPrediction', 'Kicks', 'KI'],
    ['knPrediction', 'Knockdowns', 'KN'],
    ['elPrediction', 'Elbows', 'EL'],
  ],
};

const flowSteps = [
  { number: 1, label: 'Pick fight card' },
  { number: 2, label: 'Make predictions' },
  { number: 3, label: 'View scores' },
  { number: 4, label: 'Leaderboard' },
];

export default function MockGamePage() {
  const [selectedFightId, setSelectedFightId] = useState(fightCards[0].id);
  const [rounds, setRounds] = useState(createInitialRounds);
  const [hasEntered, setHasEntered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultView, setResultView] = useState('scores');
  const [buttonText, setButtonText] = useState('Submit predictions');

  const selectedFight = useMemo(
    () => fightCards.find((fight) => fight.id === selectedFightId) || fightCards[0],
    [selectedFightId],
  );

  const matchCategory = selectedFight.category;
  const metrics = metricSets[matchCategory];

  const totals = useMemo(() => rounds.reduce((sum, round) => {
    const activeMetricTotal = metrics.reduce(
      (metricSum, [prefix]) => metricSum + Number(round[`${prefix}1`] || 0) + Number(round[`${prefix}2`] || 0),
      0,
    );
    return sum + activeMetricTotal
      + Number(round.rwPrediction1 || 0)
      + Number(round.rwPrediction2 || 0)
      + Number(round.koPrediction1 || 0)
      + Number(round.koPrediction2 || 0);
  }, 0), [metrics, rounds]);

  const activeStep = showResults ? (resultView === 'leaderboard' ? 4 : 3) : hasEntered ? 2 : 1;

  const selectFight = (fightId) => {
    setSelectedFightId(fightId);
    setRounds(createInitialRounds());
    setHasEntered(false);
    setShowResults(false);
    setResultView('scores');
    setButtonText('Submit predictions');
  };

  const enterFight = () => {
    setHasEntered(true);
    setShowResults(false);
    setResultView('scores');
    window.setTimeout(() => {
      document.getElementById('mock-predictions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const updateRoundField = (roundIndex, field, value) => {
    setRounds((current) => current.map((round, index) => (
      index === roundIndex ? { ...round, [field]: value } : round
    )));
  };

  const handleButtonClick = (roundIndex, buttonType) => {
    setRounds((current) => current.map((round, index) => {
      if (index !== roundIndex) return round;
      const updated = { ...round };

      if (buttonType === 'rw') {
        if (updated.rwPrediction1 === 100) {
          updated.rwPrediction1 = 25;
          updated.rwPrediction2 = 100;
        } else {
          updated.rwPrediction1 = 100;
          updated.rwPrediction2 = 25;
        }
      }

      if (buttonType === 'ko') {
        if (updated.koPrediction1 === 500) {
          updated.koPrediction1 = 25;
          updated.koPrediction2 = 500;
        } else {
          updated.koPrediction1 = 500;
          updated.koPrediction2 = 25;
        }
      }

      return updated;
    }));
  };

  const handleFinish = () => {
    setButtonText('Scoring card…');
    setShowResults(true);
    setResultView('scores');

    window.setTimeout(() => {
      setButtonText('Predictions submitted');
      document.getElementById('mock-score-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  return (
    <>
      <Head>
        <title>Mock Prediction Game | Fantasy MMAdness</title>
        <meta
          name="description"
          content="Choose a simulated fight card, enter the bout, make round-by-round predictions, review mock scores, and compare the leaderboard without any backend API calls."
        />
      </Head>

      <div className="experience-page practice-arena-page mock-game-experience-page mock-real-flow-page">
        <ExperienceHero
          eyebrow="No-token fight-night simulator"
          title="Pick the card."
          accent="Enter the arena."
          description="A realistic front-end practice flow: select a fight card, enter the bout, submit round predictions, reveal your score, and compare the mock leaderboard. It remains fully local and does not call an API."
          backgroundImage="/images/fmm-pages/premium-arena-banner.webp"
          actions={[
            { href: '#mock-fight-cards', label: 'Choose a fight', icon: FaTicketAlt },
            { href: '/leaderboard', label: 'Global leaderboard', variant: 'secondary', icon: FaTrophy },
          ]}
          stats={[
            { value: '0', label: 'Tokens required', icon: FaLock },
            { value: selectedFight.category, label: 'Selected rules', icon: FaFistRaised },
            { value: '3', label: 'Practice rounds', icon: FaBolt },
          ]}
          className="mock-real-flow-hero"
        >
          <div className="mock-event-ticket">
            <div className="mock-event-ticket-top">
              <span><FaFlagCheckered /> Selected simulation</span>
              <strong>Free entry</strong>
            </div>
            <div className="mock-event-ticket-fighters">
              <figure>
                <img src={selectedFight.fighterOne.image} alt={selectedFight.fighterOne.name} />
                <figcaption>{selectedFight.fighterOne.shortName}</figcaption>
              </figure>
              <div><small>{selectedFight.promotion}</small><b>VS</b><em>{selectedFight.category}</em></div>
              <figure>
                <img src={selectedFight.fighterTwo.image} alt={selectedFight.fighterTwo.name} />
                <figcaption>{selectedFight.fighterTwo.shortName}</figcaption>
              </figure>
            </div>
            <div className="mock-event-ticket-meta">
              <span><FaCalendarAlt /> {selectedFight.date}</span>
              <span><FaMapMarkerAlt /> {selectedFight.venue}</span>
            </div>
          </div>
        </ExperienceHero>

        <nav className="mock-flow-rail" aria-label="Mock fight flow">
          <div className="theme-container mock-flow-rail-inner">
            {flowSteps.map((step, index) => (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  className={`${activeStep === step.number ? 'is-active' : ''} ${activeStep > step.number ? 'is-complete' : ''}`}
                  onClick={() => {
                    if (step.number === 1) document.getElementById('mock-fight-cards')?.scrollIntoView({ behavior: 'smooth' });
                    if (step.number === 2 && hasEntered) document.getElementById('mock-predictions')?.scrollIntoView({ behavior: 'smooth' });
                    if (step.number === 3 && showResults) { setResultView('scores'); document.getElementById('mock-score-results')?.scrollIntoView({ behavior: 'smooth' }); }
                    if (step.number === 4 && showResults) { setResultView('leaderboard'); document.getElementById('mock-score-results')?.scrollIntoView({ behavior: 'smooth' }); }
                  }}
                  disabled={(step.number === 2 && !hasEntered) || (step.number >= 3 && !showResults)}
                >
                  <span>{activeStep > step.number ? <FaCheck /> : step.number}</span>
                  <strong>{step.label}</strong>
                </button>
                {index < flowSteps.length - 1 && <FaChevronRight className="mock-flow-chevron" />}
              </React.Fragment>
            ))}
          </div>
        </nav>

        <main className="xp-page-main mock-real-flow-main">
          <div className="theme-container">
            <section className="xp-page-section" id="mock-fight-cards">
              <ExperienceSectionHeading
                eyebrow="Step 1 · Fight card selection"
                title="Choose the bout you want to enter"
                description="These are front-end simulation cards only. Selecting a card changes the fighters, rule set, scorecard labels, and mock event presentation without contacting the server."
              />

              <div className="mock-fight-card-grid">
                {fightCards.map((fight, index) => {
                  const isSelected = fight.id === selectedFightId;
                  return (
                    <article key={fight.id} className={`mock-selectable-fight-card ${isSelected ? 'is-selected' : ''}`}>
                      <div className="mock-selectable-card-status">
                        <span>Card {String(index + 1).padStart(2, '0')}</span>
                        <strong>{isSelected ? <><FaCheck /> Selected</> : 'Simulation'}</strong>
                      </div>
                      <div className="mock-selectable-fighters">
                        <figure><img src={fight.fighterOne.image} alt={fight.fighterOne.name} /><figcaption><strong>{fight.fighterOne.shortName}</strong><small>{fight.fighterOne.record}</small></figcaption></figure>
                        <div><span>{fight.category}</span><b>VS</b><small>{fight.bout}</small></div>
                        <figure><img src={fight.fighterTwo.image} alt={fight.fighterTwo.name} /><figcaption><strong>{fight.fighterTwo.shortName}</strong><small>{fight.fighterTwo.record}</small></figcaption></figure>
                      </div>
                      <div className="mock-selectable-card-copy">
                        <p>{fight.promotion}</p>
                        <h3>{fight.fighterOne.name} <span>vs</span> {fight.fighterTwo.name}</h3>
                        <div><span><FaCalendarAlt /> {fight.date}</span><span><FaUsers /> {fight.crowd}</span></div>
                      </div>
                      <button type="button" onClick={() => selectFight(fight.id)}>
                        {isSelected ? 'Fight card selected' : 'Select fight card'} <FaArrowRight />
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="mock-entry-desk">
                <div className="mock-entry-desk-copy">
                  <p className="xp-eyebrow"><FaTicketAlt /> Entry confirmation</p>
                  <h2>{selectedFight.promotion}</h2>
                  <p>{selectedFight.fighterOne.name} vs {selectedFight.fighterTwo.name}. Enter this local simulation to unlock the round-by-round prediction desk.</p>
                  <div>
                    <span><FaLock /><strong>0 tokens</strong><small>Practice entry</small></span>
                    <span><FaFistRaised /><strong>3 rounds</strong><small>{selectedFight.category} rules</small></span>
                    <span><FaTrophy /><strong>Mock rank</strong><small>Instant leaderboard</small></span>
                  </div>
                </div>
                <button type="button" className="theme-btn theme-btn-primary mock-enter-fight" onClick={enterFight}>
                  {hasEntered ? 'Fight entered' : 'Enter mock fight'} {hasEntered ? <FaCheck /> : <FaPlay />}
                </button>
              </div>
            </section>

            {hasEntered && (
              <section className="practice-builder-section mock-builder-section mock-real-prediction-section" id="mock-predictions">
                <div className="practice-builder-heading mock-real-builder-heading">
                  <div>
                    <p className="xp-eyebrow">Step 2 · Prediction desk</p>
                    <h2>{selectedFight.fighterOne.shortName} <span>vs</span> {selectedFight.fighterTwo.shortName}</h2>
                    <p>Enter your predicted round metrics, choose the round winner, and choose the finish side. Every value stays in local component state.</p>
                  </div>
                  <div className="practice-faceoff mock-faceoff mock-real-faceoff">
                    <img src={selectedFight.fighterOne.image} alt={selectedFight.fighterOne.name} />
                    <FaFistRaised />
                    <img src={selectedFight.fighterTwo.image} alt={selectedFight.fighterTwo.name} />
                  </div>
                </div>

                <div className="practice-prediction-form mock-prediction-shell mock-real-prediction-shell">
                  <aside className="practice-outcome-panel mock-outcome-panel mock-real-outcome-panel">
                    <span>Fight entry</span>
                    <div className="mock-entry-mini-card">
                      <strong>{selectedFight.promotion}</strong>
                      <small>{selectedFight.category} · 3 rounds</small>
                      <em>{selectedFight.fighterOne.shortName} vs {selectedFight.fighterTwo.shortName}</em>
                    </div>
                    <div className="practice-integrity-note"><FaShieldAlt /><span><strong>Local simulation</strong><small>No backend request, wallet transaction, or production leaderboard update.</small></span></div>
                    <div className="mock-input-total"><span>Current input total</span><strong>{totals.toLocaleString()}</strong></div>
                    <button className="theme-btn theme-btn-primary practice-submit" type="button" onClick={handleFinish}>{buttonText} <FaArrowRight /></button>
                  </aside>

                  <div className="practice-round-list mock-round-list mock-real-round-list">
                    {rounds.map((round, roundIndex) => {
                      const winnerA = round.rwPrediction1 === 100;
                      const winnerB = round.rwPrediction2 === 100;
                      const finishA = round.koPrediction1 === 500;
                      const finishB = round.koPrediction2 === 500;
                      const winnerLabel = winnerA ? selectedFight.fighterOne.shortName : winnerB ? selectedFight.fighterTwo.shortName : 'Choose winner';
                      const finishLabel = finishA ? `${selectedFight.fighterOne.shortName} KO` : finishB ? `${selectedFight.fighterTwo.shortName} KO` : 'Choose finish';
                      return (
                        <article className="practice-round-card mock-round-card mock-real-round-card" key={round.round}>
                          <header>
                            <div><span>Round</span><strong>{round.round}</strong></div>
                            <button type="button" className={`mock-toggle-button ${winnerA ? 'is-side-a' : winnerB ? 'is-side-b' : 'is-unset'}`} onClick={() => handleButtonClick(roundIndex, 'rw')}>
                              <small>Round winner</small><strong>{winnerLabel}</strong>
                            </button>
                            <button type="button" className={`mock-toggle-button ${finishA ? 'is-side-a' : finishB ? 'is-side-b' : 'is-unset'}`} onClick={() => handleButtonClick(roundIndex, 'ko')}>
                              <small>Finish call</small><strong>{finishLabel}</strong>
                            </button>
                          </header>
                          <div className="practice-round-fighters mock-round-fighters mock-real-round-fighters">
                            {[[1, selectedFight.fighterOne], [2, selectedFight.fighterTwo]].map(([side, fighter]) => (
                              <section key={side} className="mock-fighter-card mock-real-fighter-card">
                                <div className="mock-fighter-card-heading">
                                  <img src={fighter.image} alt="" aria-hidden="true" />
                                  <span><small>Fighter {side === 1 ? 'A' : 'B'}</small><h3>{fighter.shortName}</h3></span>
                                </div>
                                {metrics.map(([fieldPrefix, label, code]) => (
                                  <label key={`${fieldPrefix}${side}`}>
                                    <span><strong>{label}</strong><em>{code}</em></span>
                                    <input
                                      type="number"
                                      min="0"
                                      inputMode="numeric"
                                      value={round[`${fieldPrefix}${side}`]}
                                      onChange={(event) => updateRoundField(roundIndex, `${fieldPrefix}${side}`, event.target.value)}
                                      aria-label={`${fighter.name} ${label} round ${round.round}`}
                                    />
                                  </label>
                                ))}
                              </section>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {showResults && (
              <section className="mock-real-results-section" id="mock-score-results">
                <header className="mock-real-results-header">
                  <div>
                    <p className="xp-eyebrow">Steps 3 and 4 · Fight-night reveal</p>
                    <h2>Scores and standings</h2>
                    <p>Review the local scorecard first, then switch to the simulated leaderboard.</p>
                  </div>
                  <div className="mock-result-tabs" role="tablist" aria-label="Mock result views">
                    <button type="button" className={resultView === 'scores' ? 'is-active' : ''} onClick={() => setResultView('scores')}>View scores</button>
                    <button type="button" className={resultView === 'leaderboard' ? 'is-active' : ''} onClick={() => setResultView('leaderboard')}>Leaderboard</button>
                  </div>
                </header>

                <RoundByRoundMockScores
                  predictions={rounds}
                  matchCategory={matchCategory}
                  fight={selectedFight}
                  activeView={resultView}
                />
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
