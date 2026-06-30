import React, { useMemo, useState } from 'react';
import {
  FaBell,
  FaCoins,
  FaComments,
  FaFistRaised,
  FaMedal,
  FaRegCheckCircle,
  FaShieldAlt,
  FaTrophy,
  FaUserCircle,
} from 'react-icons/fa';

const GUIDE_ITEMS = [
  {
    id: 'start',
    icon: FaFistRaised,
    title: 'Start playing fights',
    label: 'Fight cards',
    steps: [
      'Open Upcoming Fights or the dashboard fight opportunities.',
      'Choose the MMA, Boxing, Kickboxing, Bareknuckle, or Pro Wrestling card you want to play.',
      'Review the fight details, rules, lock time, and entry requirement before submitting picks.',
    ],
  },
  {
    id: 'predictions',
    icon: FaTrophy,
    title: 'Submit predictions',
    label: 'Scoring',
    steps: [
      'Open the fight detail page and enter your prediction before the fight locks.',
      'Check each scoring field carefully. Total Punches is its own score and should be treated separately.',
      'Submit once you are comfortable with your final picks.',
    ],
  },
  {
    id: 'wallet',
    icon: FaCoins,
    title: 'Use tokens and wallet',
    label: 'Account',
    steps: [
      'Add tokens from the wallet area when needed.',
      'Use available tokens to enter active fights or contests.',
      'Review wallet activity from your profile/account area.',
    ],
  },
  {
    id: 'dashboard',
    icon: FaBell,
    title: 'Keep up with fresh opportunities',
    label: 'Dashboard',
    steps: [
      'Use your dashboard to find new, live, tonight, and recently updated fight opportunities.',
      'Check upcoming, pending, completed, and trashed fight areas when managing your picks.',
      'Return often because the newest fight cards and campaigns are prioritized.',
    ],
  },
  {
    id: 'community',
    icon: FaComments,
    title: 'Use community and leagues',
    label: 'Community',
    steps: [
      'Join affiliate leagues when available.',
      'Use community/forum features to follow discussions and replies.',
      'Open affiliate profiles to see promoted fight opportunities.',
    ],
  },
  {
    id: 'profile',
    icon: FaUserCircle,
    title: 'Manage your profile',
    label: 'Profile',
    steps: [
      'Update your profile photo and account details from the profile area.',
      'Use reset password from login if you need a new password.',
      'Keep preferred payment and account information updated where applicable.',
    ],
  },
];

const SCORING_ITEMS = [
  ['HP', 'Head Punches'],
  ['BP', 'Body Punches'],
  ['TP', 'Total Punches'],
  ['RW', 'Rounds Won'],
  ['KO', 'Knockout/Stoppage'],
  ['SP', 'Scoring Points'],
  ['ST', 'Strikes'],
  ['KI', 'Kicks'],
];

const Guide = () => {
  const [activeId, setActiveId] = useState(GUIDE_ITEMS[0].id);
  const activeGuide = useMemo(() => GUIDE_ITEMS.find((item) => item.id === activeId) || GUIDE_ITEMS[0], [activeId]);
  const ActiveIcon = activeGuide.icon;

  return (
    <main className="xp-guide-page-shell">
      <section className="xp-guide-shell">
        <section className="xp-guide-intro">
          <div>
            <p className="xp-guide-eyebrow"><FaShieldAlt /> Fantasy MMAdness guide center</p>
            <h2>Play smarter, move faster, and stay ready for fight night.</h2>
            <p>
              This guide is now simplified into short action cards so users can quickly learn how to join fights,
              submit predictions, use tokens, follow fresh opportunities, and manage their account.
            </p>
          </div>
          <div className="xp-guide-principles">
            <span><FaRegCheckCircle /> Quick instructions instead of long screenshots</span>
            <span><FaRegCheckCircle /> Built around active fights and dashboard usage</span>
            <span><FaRegCheckCircle /> Clear scoring reminders for combat sports</span>
          </div>
        </section>

        <section className="xp-guide-workspace">
          <nav className="xp-guide-nav" aria-label="Guide topics">
            {GUIDE_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className={activeId === item.id ? 'is-active' : ''} onClick={() => setActiveId(item.id)}>
                  <Icon />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                </button>
              );
            })}
          </nav>
          <article className="xp-guide-detail">
            <div className="xp-guide-detail-icon"><ActiveIcon /></div>
            <span>{activeGuide.label}</span>
            <h3>{activeGuide.title}</h3>
            <ol>
              {activeGuide.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>
        </section>

        <section className="xp-guide-scoring">
          <div>
            <p className="xp-guide-eyebrow"><FaMedal /> Scoring reminder</p>
            <h2>Know the fields before you submit.</h2>
            <p>
              Different sports can use different scoring fields. When boxing fields are shown, Total Punches is handled
              as its own value and should not be assumed to be Head Punches plus Body Punches.
            </p>
          </div>
          <div className="xp-guide-score-grid">
            {SCORING_ITEMS.map(([code, label]) => <article key={code}><strong>{code}</strong><span>{label}</span></article>)}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Guide;
