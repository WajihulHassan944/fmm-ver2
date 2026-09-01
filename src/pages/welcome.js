import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ==========================================================================
// The public website — converted from "Fantasy MMAdness Website.dc.html".
//
// Fight cards, the leaderboard, the ticker and the schedule all read REAL data
// via getStaticProps, revalidated every 60 seconds. That matters more than it
// sounds: a marketing page still advertising a fight that happened last month
// reads as abandoned, and no amount of design fixes that.
//
// When the API is unreachable the page still renders — the sections show an
// honest empty state rather than invented fights.
// ==========================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE
  || 'https://fantasymmadness-game-server-three.vercel.app';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN',
  'KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ',
  'NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA',
  'WI','WV','WY',
];

const fieldStyle = {
  width: '100%', height: 46, padding: '0 13px', marginBottom: 10, borderRadius: 9,
  background: 'rgba(255,255,255,.07)', border: '1px solid rgba(216,220,228,.24)',
  color: '#fff', fontFamily: "'Rajdhani', system-ui, sans-serif", fontSize: 15,
  fontWeight: 600, boxSizing: 'border-box',
};

const SITE_STYLES = `
  @keyframes fmmTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  @keyframes fmmPulseDot { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
  [data-tick-rail]:hover { animation-play-state: paused; }

  .fmm-site a { transition: filter .14s ease, color .14s ease; }
  .fmm-site a:hover { filter: brightness(1.14); }
  .fmm-site button:hover:not(:disabled) { filter: brightness(1.12); }
  .fmm-site button:active:not(:disabled) { transform: translateY(1px); }
  .fmm-site input:focus, .fmm-site select:focus { outline: 2px solid #f5a623; outline-offset: 1px; border-color: #f5a623; }
  .fmm-site input::placeholder { color: rgba(255,255,255,.42); }
  .fmm-site select option { background: #0b0e18; color: #fff; }
  @keyframes fmmTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  /* The store no longer moves — its frames stay put and their contents fade. */
  @keyframes fmmShopFade { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }
  @keyframes fmmBoardIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes fmmCrownGlow { 0%,100% { box-shadow: 0 0 0 rgba(245,166,35,0); } 50% { box-shadow: 0 0 18px rgba(245,166,35,.45); } }
  @media (max-width: 900px) { [data-fmm="store-wall"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
  @media (max-width: 520px) { [data-fmm="store-wall"] { grid-template-columns: 1fr !important; } }
  @keyframes fmmPulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
  /* Nothing in the header may wrap — five uppercase links plus Sign in plus Join
     broke onto two lines between 760 and 1000px, which is the ragged bar. */
  [data-fmm="nav-row"] a { white-space: nowrap; }

  /* Collapse to the phone menu at 1000px, not 760px: that band is exactly where
     the row runs out of space. */
  @media (max-width: 1000px) {
    [data-fmm="nav-links"] { display: none !important; }
    [data-fmm="nav-burger"] { display: inline-flex !important; }
  }

  @media (max-width: 1080px) {
    [data-fmm="body-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="sidebar"] { position: static !important; }
  }
  /* No height overrides: below the 780px cap the whole photo scales with the
     screen, so nothing is ever cropped. */
  @media (max-width: 960px) {
    [data-fmm="three-grid"] { grid-template-columns: 1fr 1fr !important; }
    [data-fmm="leagues-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="footer-grid"] { grid-template-columns: 1fr 1fr !important; }
    [data-fmm="signup-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="hero-band"] { grid-template-columns: minmax(0,1fr) !important; text-align: center; }
    [data-fmm="hero-actions"] { justify-content: center !important; }
    [data-fmm="hero-title"] { font-size: 40px !important; }
  }
  @media (max-width: 760px) {
    [data-fmm="fights-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="three-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="store-grid"] { grid-template-columns: 1fr 1fr !important; }
    [data-fmm="footer-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="nav-links"] { display: none !important; }
    [data-fmm="hero-title"] { font-size: 32px !important; }
    .fmm-site [data-fmm="footer-grid"] a { padding: 7px 0; }
  }

  /* ---------------------------------------------------------------------
     PHONE. Below 760px the desktop nav links are hidden, so without these
     rules there is no way to reach Fight Cards, Leagues, Leaderboard or the
     Store on a phone — and the 32px gutters plus a 52px logo overflow a
     390px screen, pushing Sign in and Join off the edge.
     --------------------------------------------------------------------- */
  @media (max-width: 760px) {
    /* Nothing may scroll sideways — horizontal overflow is what puts buttons
       out of reach on a phone. */
    html, body { overflow-x: hidden; max-width: 100%; }
    .fmm-site { overflow-x: hidden; }

    [data-fmm="nav-row"] { padding: 0 14px !important; height: 62px !important; gap: 10px !important; }
    [data-fmm="nav-logo"] { width: 38px !important; height: 38px !important; }
    [data-fmm="nav-wordmark"] { font-size: 15px !important; }
    /* Sign in is reachable from the burger menu on a phone; keeping it here
       alongside Join is what broke the row. */
    [data-fmm="nav-signin"] { display: none !important; }
    [data-fmm="nav-join"] { height: 38px !important; padding: 0 14px !important; font-size: 12px !important; }
    [data-fmm="nav-burger"] { display: inline-flex !important; }

    /* Every section: phone gutters, not desktop ones. */
    [data-fmm="hero-band"],
    [data-fmm="body-grid"],
    [data-fmm="footer-grid"] { padding-left: 16px !important; padding-right: 16px !important; }
    /* This grid was never given a phone column rule at all — the 348px sidebar
       stayed fixed-width, overflowing a 375px screen and pushing the fight cards
       off to the side instead of stacking. */
    [data-fmm="body-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="signup-name-row"],
    [data-fmm="signup-dob-row"] { grid-template-columns: minmax(0,1fr) !important; gap: 10px !important; }

    /* 44px minimum on anything tappable. */
    .fmm-site a[href^="#"], .fmm-site a[href^="/"] { -webkit-tap-highlight-color: rgba(245,166,35,.25); }
    [data-fmm="footer-grid"] a { display: inline-block; min-height: 44px; line-height: 44px !important; padding: 0 !important; }
  }

  @media (max-width: 480px) {
    [data-fmm="hero-title"] { font-size: 27px !important; }
    [data-fmm="store-grid"] { grid-template-columns: minmax(0,1fr) !important; }
    [data-fmm="hero-actions"] { flex-direction: column !important; align-items: stretch !important; }
    [data-fmm="hero-actions"] > a { justify-content: center !important; }
  }

  /* The burger only exists on phones. */
  [data-fmm="nav-burger"] { display: none; }
  [data-fmm="mobile-menu"] a:active { background: rgba(245,166,35,.14); }
`;

const FantasyMMAdnessSite = ({ fights = [], board = [], ticker = [], upcoming = [], apiReachable = true, usingPreview = false, products = [] }) => {
  const router = useRouter();
  // Phone nav. The desktop links are hidden below 760px, so without this menu
  // there is no route to Fight Cards, Leagues, Leaderboard or the Store.
  const [menuOpen, setMenuOpen] = useState(false);

  // The board must never look dead. Real players fill it from the top; the rest
  // of the five slots are seeded names whose scores drift every few seconds, so
  // a visitor always sees motion. The pill flips to "Live" only when all five
  // rows are real people — never claim live data you do not have.
  const [seedBoard, setSeedBoard] = useState(SEED_BOARD);
  useEffect(() => {
    const timer = setInterval(() => {
      setSeedBoard((prev) => prev
        .map((row) => ({ ...row, pts: row.pts + Math.floor(Math.random() * 26) }))
        .sort((a, b) => b.pts - a.pts));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const BOARD_SIZE = 8;
  const realRows = board.slice(0, BOARD_SIZE);
  const boardRows = realRows.concat(
    seedBoard.slice(0, Math.max(0, BOARD_SIZE - realRows.length)).map((row) => ({ name: row.name, points: money(row.pts) })),
  );
  // "Live" only once the board is genuinely full of real players — a seeded
  // row wearing a live badge is the kind of thing people notice.
  const boardLive = realRows.length >= BOARD_SIZE;

  // The store used to be one long rail that scrolled sideways on a timer, which
  // is why it read as "jumping all over the place": the whole row moved, so
  // nothing on screen ever held still long enough to look at.
  //
  // Now the WINDOWS are stationary and only their CONTENTS change — the same
  // thing the app does. Four fixed frames, each holding its own slice of the
  // catalogue, cross-fading one at a time on a stagger so the wall never blinks
  // all at once. Products with no photograph are dropped entirely rather than
  // shown as an empty grey square.
  const shopItems = useMemo(() => {
    const live = (products && products.length ? products : []).filter((item) => item && item.image);
    // A live Etsy catalogue with fewer than 4 listed items used to show as a
    // partial, lopsided row instead of the intended 4-across wall. Backfill
    // any missing slots with the verified fallback photos so the shop always
    // reads as a full display, while still preferring real products first.
    if (live.length >= 4) return live;
    const usedNames = new Set(live.map((item) => item.name));
    const backfill = STORE_ITEMS.filter((item) => item && item.image && !usedNames.has(item.name));
    return live.concat(backfill).slice(0, Math.max(4, live.length));
  }, [products]);

  const WINDOW_COUNT = 4;
  const shopWindows = useMemo(() => {
    if (!shopItems.length) return [];
    return Array.from({ length: Math.min(WINDOW_COUNT, shopItems.length) }, (_, slot) =>
      shopItems.filter((_item, index) => index % Math.min(WINDOW_COUNT, shopItems.length) === slot));
  }, [shopItems]);

  const [shopStep, setShopStep] = useState(0);
  useEffect(() => {
    if (!shopWindows.length) return undefined;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setShopStep((n) => n + 1);
    }, 3200);
    return () => clearInterval(timer);
  }, [shopWindows.length]);
  // "OPEN FIGHT CARDS" sport pills. Previously plain <span> labels with no
  // onClick/state — they looked clickable but did nothing and the grid never
  // filtered, which read as "the cards are static."
  const [sportFilter, setSportFilter] = useState('ALL');
  const visibleFights = sportFilter === 'ALL'
    ? fights
    : fights.filter((f) => String(f.sport || f.meta || '').toUpperCase().includes(sportFilter));


  return (
    <>
      <Head>
        <title>Fantasy MMAdness · Combat sports, now interactive</title>
        <meta name="description" content="Predict the head punches, body punches, takedowns, kicks, knockdowns, round results and finish before they happen. Free to start." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
        <link rel="preload" as="image" href="/site/hero.jpg" />
      </Head>
      <style jsx global>{SITE_STYLES}</style>

      <div className="fmm-site">
      <div style={{ fontFamily: '"Rajdhani", system-ui, sans-serif', background: '#07090f', overflowX: 'hidden' }}>

        <div style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(7,9,15,.96)', borderBottom: '1px solid rgba(216,220,228,.14)', backdropFilter: 'blur(10px)' }}>
          <div data-fmm="nav-row" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 32px', height: '76px', display: 'flex', alignItems: 'center', gap: '34px' }}>
            <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
              <img data-fmm="nav-logo" src="/site/logo.jpg" alt="Fantasy MMAdness" width="52" height="52" style={{ display: 'block', width: '52px', height: '52px', borderRadius: '9px', border: '1px solid rgba(216,220,228,.3)', objectFit: 'cover' }} />
              <span data-fmm="nav-wordmark" style={{ fontFamily: '"Anton", sans-serif', fontSize: '19px', letterSpacing: '.04em', lineHeight: 1, color: '#fff' }}>FANTASY<span style={{ color: '#e11d2e' }}>MMADNESS</span></span>
            </a>

            <div data-fmm="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '26px', fontSize: '14.5px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              <a href="#fights" style={{ color: 'rgba(255,255,255,.82)' }}>Fight Cards</a>
              <a href="#contests" style={{ color: 'rgba(255,255,255,.82)' }}>How to Play</a>
              <a href="#leagues" style={{ color: 'rgba(255,255,255,.82)' }}>Leagues</a>
              <a href="#board" style={{ color: 'rgba(255,255,255,.82)' }}>Leaderboard</a>
              <a href="#store" style={{ color: 'rgba(255,255,255,.82)' }}>Store</a>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a data-fmm="nav-signin" href="#signup" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)', padding: '10px 4px' }}>Sign in</a>
              <a data-fmm="nav-join" href="#signup" style={{ display: 'inline-flex', alignItems: 'center', height: '44px', padding: '0 22px', borderRadius: '999px', background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: '"Anton", sans-serif', fontSize: '14px', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>JOIN FREE</a>
              {/* Phone only. 44px square so it is a comfortable thumb target. */}
              <button
                type="button"
                data-fmm="nav-burger"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(216,220,228,.22)', color: '#fff', cursor: 'pointer', padding: 0, flex: '0 0 auto' }}
              >
                <span style={{ display: 'block', width: 18, height: 12, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, right: 0, top: menuOpen ? 5 : 0, height: 2, background: '#fff', borderRadius: 2, transform: menuOpen ? 'rotate(45deg)' : 'none', transition: 'all .18s ease' }} />
                  <span style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 2, background: '#fff', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'opacity .18s ease' }} />
                  <span style={{ position: 'absolute', left: 0, right: 0, top: menuOpen ? 5 : 10, height: 2, background: '#fff', borderRadius: 2, transform: menuOpen ? 'rotate(-45deg)' : 'none', transition: 'all .18s ease' }} />
                </span>
              </button>
            </div>
          </div>

          {/* Slide-down menu. Every destination the desktop nav has, plus Sign in,
              which the phone header drops for room. Tapping any of them closes it. */}
          {menuOpen ? (
            <div data-fmm="mobile-menu" style={{ borderTop: '1px solid rgba(216,220,228,.14)', background: 'rgba(7,9,15,.99)', padding: '6px 14px 14px' }}>
              {[['#fights', 'Fight Cards'], ['#contests', 'How to Play'], ['#leagues', 'Leagues'], ['#board', 'Leaderboard'], ['#store', 'Store'], ['#apply', 'Apply as an Affiliate'], ['#signup', 'Sign in']].map(([href, label]) => (
                <a
                  key={href + label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '14px 4px', minHeight: 44, borderBottom: '1px solid rgba(216,220,228,.09)', color: 'rgba(255,255,255,.88)', fontSize: 15, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase' }}
                >
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {!apiReachable ? (
          <div
            role="alert"
            style={{
              padding: '11px 18px', background: '#7f1d1d', color: '#fff',
              fontWeight: 800, fontSize: 13, lineHeight: 1.45, textAlign: 'center',
            }}
          >
            Live fight data is not loading &mdash; the API did not respond.
            <span style={{ opacity: .8, fontWeight: 700 }}>
              {' '}Check that the backend is deployed and reachable from this site.
            </span>
          </div>
        ) : null}

        <div id="top" style={{ background: '#05060a' }}>
          <div data-fmm="hero-wrap" style={{ width: '100%', background: '#05060a' }}>
        <img src="/site/hero.jpg" alt="Fantasy MMAdness" fetchPriority="high" data-fmm="hero-img" style={{ display: 'block', width: '100%', maxWidth: 780, height: 'auto', margin: '0 auto', objectFit: 'contain' }} />
          </div>

          {/* The copy used to sit over the artwork behind a heavy scrim, which buried
               the fighters. It now lives in a band directly beneath the banner, so the
               photograph is completely unobstructed and the headline is easier to read
               against a flat ground than against a busy image. */}
          <div style={{ borderTop: '1px solid rgba(245,166,35,.28)', background: 'linear-gradient(180deg,rgba(245,166,35,.07),rgba(5,6,10,0))' }}>
            <div data-fmm="hero-band" style={{ maxWidth: '1320px', margin: '0 auto', padding: '26px 32px 30px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '30px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e11d2e', animation: 'fmmPulse 1.6s ease-in-out infinite' }}></span>
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#e11d2e' }}>Live fight cards open now</span>
                </div>
                <h1 data-fmm="hero-title" style={{ fontFamily: '"Anton", sans-serif', fontSize: '52px', lineHeight: '.96', letterSpacing: '-.005em', margin: '0 0 12px' }}>
                  COMBAT SPORTS.<br /><span style={{ color: '#f5a623' }}>NOW INTERACTIVE.</span>
                </h1>
                <p style={{ fontSize: '17.5px', fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.76)', margin: 0, maxWidth: '34em', textWrap: 'pretty' }}>
                  Predict the head punches, body punches, takedowns, kicks, knockdowns, round results, and finish before they happen.
                </p>
              </div>
              <div data-fmm="hero-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="#signup" style={{ display: 'inline-flex', alignItems: 'center', height: '52px', padding: '0 30px', borderRadius: '999px', background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: '"Anton", sans-serif', fontSize: '16px', letterSpacing: '.06em', boxShadow: '0 8px 26px rgba(225,29,46,.42)' }}>START FREE</a>
                <a href="#contests" style={{ display: 'inline-flex', alignItems: 'center', height: '52px', padding: '0 28px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(216,220,228,.42)', color: '#fff', fontFamily: '"Anton", sans-serif', fontSize: '16px', letterSpacing: '.06em' }}>TRY A DEMO FIGHT</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#0b0e18', borderTop: '2px solid #f5a623', borderBottom: '2px solid #f5a623', overflow: 'hidden', padding: '11px 0' }}>
            <div data-tick-rail style={{ display: 'flex', gap: 46, paddingLeft: 46, width: 'max-content', animation: 'fmmTicker 34s linear infinite', fontSize: 13.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap' }}>
              {[...ticker, ...ticker].map((item, index) => (
                <span key={index} style={{ color: item.color }}>{item.text}</span>
              ))}
            </div>
        </div>

        <div id="fights" data-fmm="body-grid" style={{ maxWidth: '1320px', margin: '0 auto', padding: '62px 32px 0', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 348px', gap: '40px', alignItems: 'start' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(216,220,228,.16)', paddingBottom: '14px', marginBottom: '26px' }}>
              <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '34px', margin: 0, letterSpacing: '.01em' }}>OPEN FIGHT CARDS</h2>
              {false ? (
                <span style={{ marginLeft: 12, padding: '5px 11px', borderRadius: 999, background: 'rgba(43,111,232,.18)', border: '1px solid #2b6fe8', color: '#9dc0ff', fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                  EXAMPLE CARD
                </span>
              ) : null}
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {['ALL', 'BOXING', 'MMA', 'WRESTLING'].map((label) => {
                  const active = sportFilter === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSportFilter(label)}
                      style={{
                        padding: '7px 13px', borderRadius: '999px', cursor: 'pointer',
                        background: active ? 'rgba(245,166,35,.16)' : 'rgba(255,255,255,.05)',
                        border: '1px solid ' + (active ? '#f5a623' : 'rgba(216,220,228,.18)'),
                        color: active ? '#f5a623' : 'rgba(255,255,255,.7)',
                        fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                      }}
                    >
                      {label === 'ALL' ? 'All' : label.charAt(0) + label.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div data-fmm="fights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {fights.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', border: '1px dashed rgba(216,220,228,.3)', borderRadius: 14, padding: '38px 26px', textAlign: 'center', background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, marginBottom: 8 }}>NEXT CARD BEING ANNOUNCED</div>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,.6)', margin: '0 auto 18px', maxWidth: '34em' }}>
                    Create your account now and you will hear the moment the next card opens for predictions.
                  </p>
                  <a href="#signup" style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 24px', borderRadius: 999, background: '#f5a623', color: '#17070a', fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: '.05em' }}>GET NOTIFIED</a>
                </div>
              ) : visibleFights.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', border: '1px dashed rgba(216,220,228,.3)', borderRadius: 14, padding: '30px 26px', textAlign: 'center', background: 'rgba(255,255,255,.03)', color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: 14.5 }}>
                  No open {sportFilter.charAt(0) + sportFilter.slice(1).toLowerCase()} cards right now &mdash; check the app for the full slate.
                </div>
              ) : visibleFights.map((fight, index) => (
                <div key={fight.id} style={{ border: '1px solid ' + (index === 0 ? 'rgba(245,166,35,.4)' : 'rgba(216,220,228,.18)'), borderRadius: 14, overflow: 'hidden', background: index === 0 ? 'linear-gradient(168deg,rgba(245,166,35,.1),rgba(11,14,24,.7))' : 'rgba(255,255,255,.03)' }}>
                  <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0e18', display: 'flex' }}>
                    <img loading={index < 2 ? 'eager' : 'lazy'} decoding="async" src={fight.fighterAFace || fight.image} alt={fight.f1} style={{ display: 'block', width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                    <img loading={index < 2 ? 'eager' : 'lazy'} decoding="async" src={fight.fighterBFace || fight.image} alt={fight.f2} style={{ display: 'block', width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 60%,rgba(11,14,24,.55))', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 11, right: 11, width: 26, height: 26, borderRadius: '50%', background: 'rgba(11,14,24,.82)', border: '1px solid rgba(255,255,255,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }} title={'Homepage slot ' + fight.slot}>{fight.slot}</div>
                    {fight.badge ? (
                      <div style={{ position: 'absolute', top: 11, left: 11, padding: '5px 11px', borderRadius: 6, background: fight.badgeColor, color: fight.badgeText, fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{fight.badge}</div>
                    ) : null}
                  </div>
                  <div style={{ padding: '17px 18px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.48)', marginBottom: 6 }}>{fight.meta}</div>
                    <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 23, lineHeight: 1.1, marginBottom: 14 }}>
                      {fight.f1} <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>vs</span> {fight.f2}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, borderTop: '1px solid rgba(216,220,228,.14)' }}>
                      <div>
                        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 21, color: fight.potColor, fontVariantNumeric: 'tabular-nums' }}>{fight.potLabel}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{fight.potNote}</div>
                      </div>
                      <a href="#signup" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 20px', borderRadius: 999, background: fight.ctaBg, border: fight.ctaBorder, color: fight.ctaColor, fontFamily: "'Anton', sans-serif", fontSize: 13.5, letterSpacing: '.05em' }}>{fight.cta}</a>
                    </div>
                  </div>
                </div>
              ))}
              {fights.length > 0 ? (
                <div data-fmm="sport-router" style={{ gridColumn: '1 / -1', border: '1px solid rgba(245,166,35,.4)', borderRadius: 14, padding: '24px 26px', background: 'linear-gradient(168deg,rgba(245,166,35,.09),rgba(11,14,24,.7))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px 26px' }}>
                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 21, lineHeight: 1.12, marginBottom: 6 }}>EVERY OTHER CARD LIVES IN THE APP</div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.7)', margin: 0, textWrap: 'pretty' }}>
                      Five sports, one scoring engine. Pick a sport to open its full slate &mdash; free cards, high rollers and season cards included.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                    {[['Boxing', '#e11d2e'], ['MMA', '#f5a623'], ['Bare Knuckle', '#c9772e'], ['Kickboxing', '#2b6fe8'], ['Pro Wrestling', '#c0399f']].map(([label, color]) => (
                      <a
                        key={label}
                        href="/home"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 17px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(216,220,228,.22)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 8px' }} />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div data-fmm="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>

            <div id="board" style={{ border: '1px solid rgba(216,220,228,.18)', borderRadius: '14px', background: 'rgba(255,255,255,.03)', overflow: 'hidden' }}>
              <div style={{ padding: '15px 18px', borderBottom: '1px solid rgba(216,220,228,.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '16px', letterSpacing: '.04em' }}>LEADERBOARD</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '10.5px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: boardLive ? '#22c55e' : '#f5a623' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: boardLive ? '#22c55e' : '#f5a623', animation: 'fmmPulseDot 1.6s ease-in-out infinite' }} />
                  {boardLive ? 'Live' : 'Demo'}
                </span>
              </div>
              {/* Matches the app's board rather than a plain table: a three-up
                  podium in medal colours, then the chasing pack as rows. Gold,
                  silver and bronze are the same values the app uses so a player
                  moving between the two surfaces sees one ranking language. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, padding: '16px 14px 4px' }}>
                {boardRows.slice(0, 3).map((row, index) => {
                  const medal = ['#f5a623', '#d8dce4', '#c9772e'][index];
                  const lead = index === 0;
                  return (
                    <div
                      key={'podium-' + row.name + index}
                      style={{
                        borderRadius: 11,
                        border: '1px solid ' + medal + (lead ? '' : '55'),
                        background: lead
                          ? 'linear-gradient(168deg, rgba(245,166,35,.18), rgba(11,14,24,.5))'
                          : 'rgba(255,255,255,.035)',
                        padding: '12px 8px 11px',
                        textAlign: 'center',
                        animation: lead ? 'fmmCrownGlow 2.8s ease-in-out infinite' : undefined,
                        // The leader's card sits slightly proud of the other two.
                        marginTop: lead ? 0 : 8,
                      }}
                    >
                      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 12, color: medal, letterSpacing: '.06em' }}>#{index + 1}</div>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', margin: '7px auto 6px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.04))',
                        border: '1px solid ' + medal + '66',
                        display: 'grid', placeItems: 'center',
                        fontFamily: "'Anton', sans-serif", fontSize: 14, color: medal,
                      }}>{String(row.name || '?').charAt(0)}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, color: medal, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{row.points}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px 14px' }}>
                {boardRows.slice(3).map((row, index) => (
                  <div
                    key={'board-' + row.name + index}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 11px', borderRadius: 9,
                      background: 'rgba(255,255,255,.03)',
                      border: '1px solid rgba(216,220,228,.1)',
                      animation: 'fmmBoardIn .4s ease both',
                      animationDelay: (index * 60) + 'ms',
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'center', fontFamily: "'Anton', sans-serif", fontSize: 13, color: 'rgba(255,255,255,.45)', fontVariantNumeric: 'tabular-nums' }}>{index + 4}</span>
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%', flex: '0 0 26px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.03))',
                      border: '1px solid rgba(216,220,228,.18)',
                      display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)',
                    }}>{String(row.name || '?').charAt(0)}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 14, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{row.points}</span>
                  </div>
                ))}
              </div>

              <a href="/home" style={{ display: 'block', padding: '13px 18px', borderTop: '1px solid rgba(216,220,228,.14)', fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f5a623' }}>Full standings →</a>
            </div>

            <div id="season" style={{ border: '1px solid rgba(192,57,159,.4)', borderRadius: '14px', padding: '18px', background: 'linear-gradient(168deg,rgba(192,57,159,.12),rgba(11,14,24,.6))' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#d76fc0', marginBottom: '8px' }}>Season Card · drafting open</div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '20px', lineHeight: 1.15, marginBottom: '9px' }}>FIVE SPORTS.<br />ONE ROSTER.</div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.72)', margin: '0 0 15px' }}>
                Draft one fighter from boxing, MMA, bare knuckle, kickboxing and pro wrestling. They compete on their own schedules all season — every round they throw lands on your card.
              </p>
              <a href="#signup" style={{ display: 'inline-flex', alignItems: 'center', height: '42px', padding: '0 20px', borderRadius: '999px', background: '#c0399f', color: '#fff', fontFamily: '"Anton", sans-serif', fontSize: '13.5px', letterSpacing: '.05em' }}>DRAFT FREE</a>
            </div>

            <div style={{ border: '1px solid rgba(216,220,228,.18)', borderRadius: '14px', padding: '18px', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: '11px' }}>Next up</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {upcoming.length === 0 ? (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Nothing scheduled yet.</div>
                ) : upcoming.map((row, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5, fontWeight: 700 }}>
                    <span>{row.name}</span>
                    <span style={{ color: 'rgba(255,255,255,.5)', fontVariantNumeric: 'tabular-nums' }}>{row.when}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div id="contests" style={{ maxWidth: '1320px', margin: '0 auto', padding: '74px 32px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '38px' }}>
            <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '40px', margin: '0 0 10px', letterSpacing: '.01em' }}>THREE WAYS TO PLAY</h2>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,.66)', margin: 0, maxWidth: '44em', marginInline: 'auto', textWrap: 'pretty' }}>
              Same scoring engine behind all three. One night, one card, or a whole season — pick the commitment that suits you.
            </p>
          </div>

          <div data-fmm="three-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px' }}>

            <div style={{ border: '1px solid rgba(245,166,35,.34)', borderRadius: '15px', padding: '26px', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '11px', border: '1.5px solid #f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>🥊</div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '22px', marginBottom: '9px' }}>SCORECARDS</div>
              <p style={{ fontSize: '14.5px', fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', margin: '0 0 17px' }}>
                One fight, scored round by round. Call the head shots, body shots, takedowns and knockdowns. Closest card to the official stats takes the pot.
              </p>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f5a623' }}>Resolves the same night</div>
            </div>

            <div style={{ border: '1px solid rgba(225,29,46,.42)', borderRadius: '15px', padding: '26px', background: 'linear-gradient(168deg,rgba(225,29,46,.1),rgba(11,14,24,.5))' }}>
              <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '5px', background: '#e11d2e', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Most popular</div>
              <div style={{ width: '46px', height: '46px', borderRadius: '11px', border: '1.5px solid #e11d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>⚔️</div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '22px', marginBottom: '9px' }}>TEAM CARDS</div>
              <p style={{ fontSize: '14.5px', fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', margin: '0 0 17px' }}>
                Pick five fighters from one event — one per bout, so you can never back both sides. Everything they do that night adds up into a single score.
              </p>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#ff6b6b' }}>Standings move live through the card</div>
            </div>

            <div style={{ border: '1px solid rgba(43,111,232,.4)', borderRadius: '15px', padding: '26px', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '11px', border: '1.5px solid #2b6fe8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>🏆</div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '22px', marginBottom: '9px' }}>SEASON CARDS</div>
              <p style={{ fontSize: '14.5px', fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', margin: '0 0 17px' }}>
                One fighter per sport, five sports, three months. Call a number on each — reach it and you score it as a bonus. Every slot counts the same, whatever the sport.
              </p>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b9cff' }}>A reason to open the app on a Tuesday</div>
            </div>

          </div>
        </div>

        <div id="leagues" style={{ maxWidth: '1320px', margin: '0 auto', padding: '74px 32px 0' }}>
          <div data-fmm="leagues-grid" style={{ border: '1px solid rgba(216,220,228,.18)', borderRadius: '18px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.05fr .95fr', background: 'rgba(255,255,255,.03)' }}>
            <div id="apply" style={{ padding: '44px 40px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#f5a623', marginBottom: '13px' }}>Run your own league</div>
              <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '36px', lineHeight: 1.05, margin: '0 0 15px' }}>BRING YOUR PEOPLE.<br />TAKE A CUT.</h2>
              <p style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.74)', margin: '0 0 24px', textWrap: 'pretty' }}>
                Put cards up for your gym, your group chat, your bar. Announce them straight to your members, share ready-written posts, and earn a share of every contest you promote. Your rate is set in your affiliate agreement.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '26px' }}>
                <div style={{ borderLeft: '2px solid #f5a623', paddingLeft: '12px' }}>
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '20px', lineHeight: 1.1 }}>REVENUE<br />SHARE</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginTop: '4px' }}>On every contest you promote</div>
                </div>
                <div style={{ borderLeft: '2px solid #2b6fe8', paddingLeft: '12px' }}>
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '24px', fontVariantNumeric: 'tabular-nums' }}>5</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Sports to promote</div>
                </div>
                <div style={{ borderLeft: '2px solid #c0399f', paddingLeft: '12px' }}>
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '24px', fontVariantNumeric: 'tabular-nums' }}>1 tap</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>To announce a card</div>
                </div>
              </div>
                <a href="/affiliate-create-account" style={{ display: 'inline-flex', alignItems: 'center', height: '50px', padding: '0 28px', borderRadius: '999px', background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: '"Anton", sans-serif', fontSize: '15px', letterSpacing: '.04em' }}>APPLY AS AN AFFILIATE</a>
            </div>
            <div style={{ position: 'relative', minHeight: '380px', background: '#0b0e18' }}>
              <img loading="lazy" decoding="async" src="/site/leagues.jpg" alt="League owners" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        <div id="store" style={{ maxWidth: '1320px', margin: '0 auto', padding: '74px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(216,220,228,.16)', paddingBottom: '14px', marginBottom: '26px' }}>
            <div>
              <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '34px', margin: 0 }}>THE STORE</h2>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginTop: '4px' }}>Fulfilled through our Etsy shop — orders and shipping are handled there.</div>
            </div>
            <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', height: '44px', padding: '0 20px', borderRadius: '999px', background: '#f5a623', color: '#17070a', fontFamily: '"Anton", sans-serif', fontSize: '13.5px', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>SHOP ON ETSY ↗</a>
          </div>
            {shopWindows.length === 0 ? (
              <div style={{ padding: '38px 20px', textAlign: 'center', border: '1px dashed rgba(216,220,228,.2)', borderRadius: 13, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>
                The shop is loading its latest drops.
              </div>
            ) : (
              <div data-fmm="store-wall" style={{ display: 'grid', gridTemplateColumns: `repeat(${shopWindows.length}, minmax(0,1fr))`, gap: 20 }}>
                {shopWindows.map((slotItems, slot) => {
                  // Each window advances on its own offset, so the four frames
                  // never change at the same instant.
                  const item = slotItems[(shopStep + slot) % slotItems.length];
                  return (
                    <a
                      key={'shop-window-' + slot}
                      href={item.url || 'https://www.etsy.com/shop/FANTASYMMADNESS'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', border: '1px solid rgba(216,220,228,.16)', borderRadius: 13, overflow: 'hidden', background: 'rgba(255,255,255,.03)', color: 'inherit', textDecoration: 'none' }}
                    >
                      <div style={{ aspectRatio: 1, background: '#0b0e18', position: 'relative', overflow: 'hidden' }}>
                        {/* Keyed on the image so React swaps the node and the
                            fade-in keyframe replays on every change. */}
                        <img
                          key={item.image}
                          loading="lazy"
                          decoding="async"
                          src={item.image}
                          alt={item.name}
                          style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover', animation: 'fmmShopFade .6s ease' }}
                        />
                      </div>
                      <div style={{ padding: '14px 15px 16px' }}>
                        <div key={item.name} style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4, minHeight: '2.6em', animation: 'fmmShopFade .6s ease' }}>{item.name}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 17, color: '#f5a623', fontVariantNumeric: 'tabular-nums' }}>{item.price}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.45)' }}>ETSY &#8599;</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
            </div>
        </div>

        <div id="signup" style={{ maxWidth: 1320, margin: '74px auto 0', padding: '0 32px' }}>
          <div style={{ border: '1px solid rgba(245,166,35,.4)', borderRadius: 18, padding: '52px 44px', background: 'linear-gradient(168deg,rgba(245,166,35,.12),rgba(225,29,46,.08),rgba(11,14,24,.6))' }}>
            <div data-fmm="signup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 44, alignItems: 'center' }}>
              <div>
                <img src="/site/logo.jpg" alt="" width={68} height={68} style={{ display: 'block', width: 68, height: 68, marginBottom: 18, borderRadius: 13, border: '1px solid rgba(216,220,228,.32)', objectFit: 'cover' }} />
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 40, lineHeight: 1.02, margin: '0 0 13px' }}>FREE TO START.<br />NO CARD NEEDED.</h2>
                <p style={{ fontSize: 16.5, fontWeight: 600, color: 'rgba(255,255,255,.72)', margin: '0 0 18px', textWrap: 'pretty' }}>
                  Free contests run in every state and award badges, leaderboard titles and sponsor prizes.
                  Paid contests are available where the law allows &mdash; and we tell you which you are in, up front.
                </p>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.45)' }}>18+ &middot; 21+ in some states &middot; Play responsibly</div>
              </div>
              {/* Same signup flow as /auth (AuthPortal) — no duplicate registration
                  form here, so this can never drift out of sync with it again. */}
              <div style={{ background: 'rgba(5,6,10,.55)', border: '1px solid rgba(216,220,228,.2)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 19, letterSpacing: '.03em' }}>CREATE YOUR ACCOUNT</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.6)', margin: 0 }}>
                  Free to join, 18+. Sign up in under a minute and jump straight into your dashboard.
                </p>
                <Link href="/auth?mode=signup&role=player" style={{ display: 'block', textAlign: 'center', width: '100%', height: 52, lineHeight: '52px', borderRadius: 999, background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: "'Anton', sans-serif", fontSize: 16, letterSpacing: '.06em', textDecoration: 'none' }}>
                  CREATE MY ACCOUNT
                </Link>
                <p style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.5)', margin: 0 }}>
                  By creating an account you agree to our{' '}
                  <Link href="/terms" style={{ color: '#f5a623' }}>Terms of Use</Link> and{' '}
                  <Link href="/privacy" style={{ color: '#f5a623' }}>Privacy Policy</Link>.
                </p>
                <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>
                  Already have an account? <Link href="/auth" style={{ color: '#f5a623' }}>Sign in</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(216,220,228,.14)', marginTop: '74px', background: '#05060a' }}>
          <div data-fmm="footer-grid" style={{ maxWidth: '1320px', margin: '0 auto', padding: '46px 32px 30px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '34px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '14px' }}>
                <img src="/site/logo.jpg" alt="" width="42" height="42" style={{ display: 'block', width: '42px', height: '42px', borderRadius: '8px', border: '1px solid rgba(216,220,228,.28)', objectFit: 'cover' }} />
                <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '16px', letterSpacing: '.04em' }}>FANTASY<span style={{ color: '#e11d2e' }}>MMADNESS</span></span>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.5)', margin: '0 0 14px', maxWidth: '30em' }}>
                A fantasy sports operator. Not a sportsbook — we do not take wagers and we do not offer odds. Contests are scored against official round statistics.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="https://www.tiktok.com/@fantasy.mmadness" style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>TikTok</a>
                <a href="https://www.facebook.com/share/1DZ9RqkMJd/" style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Facebook</a>
              <a href="https://www.instagram.com/fantasymmadness" style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Instagram</a>
                <a href="https://x.com/FMmadness2024" style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>X</a>
                <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Etsy</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)', marginBottom: '13px' }}>Play</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px', fontWeight: 600 }}>
                <a href="#fights" style={{ color: 'rgba(255,255,255,.72)' }}>Fight cards</a>
                <a href="#contests" style={{ color: 'rgba(255,255,255,.72)' }}>How scoring works</a>
                <a href="#season" style={{ color: 'rgba(255,255,255,.72)' }}>Season Cards</a>
                <a href="#board" style={{ color: 'rgba(255,255,255,.72)' }}>Leaderboard</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)', marginBottom: '13px' }}>Leagues</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px', fontWeight: 600 }}>
                <a href="/affiliate-create-account" style={{ color: 'rgba(255,255,255,.72)' }}>Become an affiliate</a>
                <a href="#apply" style={{ color: 'rgba(255,255,255,.72)' }}>Affiliate payouts</a>
                <a href="#store" style={{ color: 'rgba(255,255,255,.72)' }}>Store</a>
                <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,.72)' }}>Etsy shop ↗</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)', marginBottom: '13px' }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px', fontWeight: 600 }}>
                <a href="/terms" style={{ color: 'rgba(255,255,255,.72)' }}>Terms of Use</a>
                <a href="/privacy" style={{ color: 'rgba(255,255,255,.72)' }}>Privacy</a>
                <a href="/responsible-play" style={{ color: 'rgba(255,255,255,.72)' }}>Responsible play</a>
                <a href="mailto:support@fantasymmadness.com" style={{ color: 'rgba(255,255,255,.72)' }}>Support</a>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '18px 32px 34px', borderTop: '1px solid rgba(216,220,228,.09)', display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,.38)' }}>
            <span>© 2026 Fantasy MMAdness LLC · Georgia, USA</span>
            <span>Gambling problem? Call 1-800-522-4700 · ncpgambling.org</span>
          </div>
        </div>

      </div>
    </>
  );
};

// --------------------------------------------------------------------------
// DATA
//
// Server-rendered per request, with a 60-second edge cache. This was
// getStaticProps, which bakes data in at BUILD time — so a fresh deploy shipped
// with an empty fight list and never recovered, which is why the page showed
// "NEXT CARD BEING ANNOUNCED" no matter what was seeded. The cache header keeps
// repeat visits as fast as static without that failure mode.
// --------------------------------------------------------------------------
const IMAGES = ['/site/fight-clash.webp', '/site/faceoff.webp', '/site/red-corner.webp', '/site/prize-arena.webp', '/site/arena.jpg', '/site/leagues.jpg'];

const money = (n) => Number(n || 0).toLocaleString('en-US');

// A promoted fight without linked fighter records had no matchFighterA/B text,
// so it was dropped from the homepage entirely instead of showing the names
// pulled from its own matchName ("Jones vs Smith") — the site had 5 promoted
// slots but only showed 4 for exactly this reason.
const resolveFightName = (f = {}, side = 'A') => {
  const isA = side === 'A';
  const direct = isA ? (f.matchFighterA || f.fighterAName) : (f.matchFighterB || f.fighterBName);
  if (direct && String(direct).trim()) return String(direct).trim();
  const parts = String(f.matchName || '').split(/\s+vs\.?\s+/i);
  const fromName = isA ? parts[0] : parts[1];
  return fromName && fromName.trim() ? fromName.trim() : '';
};

// --------------------------------------------------------------------------
// ONE CARD SHAPE
// The fight card reads meta, badgeText, potLabel, potColor, potNote, cta, ctaBg,
// ctaBorder and ctaColor. Anything that skips this function renders a card with
// blank lines — which is exactly what the preview fights used to do.
// --------------------------------------------------------------------------
const toFightCard = (f, index) => {
    const fee = Math.max(0, Math.round(Number(f.matchTokens) || 0));
    const guaranteed = Math.max(0, Math.round(Number(f.potTarget) || 0));
    const pot = Math.max(guaranteed, Math.round(Number(f.pot) || 0));
    const entries = Number(f.entryCount ?? (Array.isArray(f.userPredictions) ? f.userPredictions.length : 0)) || 0;
    const when = f.matchDate
      ? new Date(f.matchDate).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      : '';
    const category = String(f.matchCategory || '').toUpperCase();
    return {
      id: String(f._id || index),
      slot: index + 1,
      f1: resolveFightName(f, 'A').toUpperCase(),
      f2: resolveFightName(f, 'B').toUpperCase(),
      fighterAFace: f.fighterAImage || f.fighterAPrimaryImage || '',
      fighterBFace: f.fighterBImage || f.fighterBPrimaryImage || '',
      image: f.featuredThisWeekImage || f.fightPosterImage || f.fighterAImage || f.fighterBImage || IMAGES[index % IMAGES.length],
      // Fighter-library headshots are near-square portraits, not designed for a
      // 16:9 crop — bias the crop to the top so the fighter's head stays in frame.
      // Poster/featured art is already composed for 16:9, so it keeps a gentler bias.
      imagePosition: (!f.featuredThisWeekImage && !f.fightPosterImage && (f.fighterAImage || f.fighterBImage)) ? 'center top' : 'center 32%',
      meta: [category, f.maxRounds ? `${f.maxRounds} rounds` : '', when].filter(Boolean).join(' \u00b7 '),
      badge: guaranteed > 0 ? 'Guaranteed pot' : fee === 0 ? 'Free entry' : index === 0 ? 'Main event' : '',
      badgeColor: guaranteed > 0 ? 'rgba(43,111,232,.94)' : fee === 0 ? 'rgba(34,197,94,.94)' : 'rgba(225,29,46,.94)',
      badgeText: fee === 0 ? '#052e14' : '#fff',
      potLabel: fee === 0 ? 'BADGES' : pot > 0 ? money(pot) + ' FM' : money(fee) + ' FM',
      potColor: fee === 0 ? '#22c55e' : guaranteed > 0 ? '#22c55e' : '#fff',
      potNote: fee === 0 ? 'Titles & sponsor prizes'
        : guaranteed > 0 ? 'Guaranteed pot'
          : entries > 0 ? `Pot \u00b7 ${entries} ${entries === 1 ? 'entry' : 'entries'} in` : 'Pot builds with entries',
      cta: fee === 0 ? 'ENTER FREE' : 'ENTER \u00b7 ' + money(fee),
      ctaBg: fee === 0 ? '#22c55e' : index === 0 ? '#f5a623' : 'rgba(255,255,255,.08)',
      ctaBorder: fee === 0 || index === 0 ? '0' : '1.5px solid rgba(216,220,228,.4)',
      ctaColor: fee === 0 ? '#052e14' : index === 0 ? '#17070a' : '#fff',
    };
};

// --------------------------------------------------------------------------
// PREVIEW CARD
// The exact five fights from the design document. Shown ONLY when the API returns
// no published fights, so the site never has an empty fight section — that empty
// state is indistinguishable from a broken site to a visitor.
//
// Every row carries isPreview: true, so the page can label them and never present
// them as live contests to enter.
// --------------------------------------------------------------------------
// Everything in the shop. A static four-up grid could only ever show four, so the
// track scrolls and advances itself — swipeable on a phone, automatic on desktop.
// Fallback only. Six of the previous eight entries pointed at fighter and arena
// photographs while claiming to be hoodies, caps and gloves — which is why the
// carousel showed fighters instead of merchandise. These three are the only
// genuine apparel photographs in the project, square-cropped so a square card
// does not distort them. Real products replace them whenever the Etsy catalogue
// responds.
const SHOP = 'https://www.etsy.com/shop/FANTASYMMADNESS';
const STORE_ITEMS = [
  { name: 'Ringside Tee', price: '$32', image: '/site/product-ringside-tee.jpg', url: 'https://www.etsy.com/listing/4552218538/fantasy-mmadness-combat-sports-t-shirt' },
  { name: 'Fight Night Tee', price: '$32', image: '/site/product-fight-tee.jpg', url: 'https://www.etsy.com/listing/4552212559/fantasy-mmadness-combat-sports-t-shirt' },
  { name: 'BKFC Tee', price: '$34', image: '/site/product-bkfc-tee.jpg', url: 'https://www.etsy.com/listing/4552225010/fantasy-mmadness-combat-sports-t-shirt' },
  { name: 'Combat Sports Tee', price: '$32', image: '/site/apparel-tee.webp', url: 'https://www.etsy.com/listing/4549330994/fantasy-mmadness-combat-sports-t-shirt' },
  { name: 'Built For The Fight Tee', price: '$34', image: '/site/tee.webp', url: 'https://www.etsy.com/listing/4541697432/inspired-by-champions-built-for-the' },
];

// Real fighters from the site's own photo library (public/images/fmm-experience),
// composited into split-frame cards at 760x428. The source photos are 420x360 —
// dropping those straight into a 16:9 frame is what made them look stretched, so
// each fighter is cover-cropped into their own half instead.
//
// Shown only while the API returns no published fights. Real fights replace these
// one at a time as they are published.
const PREVIEW_FIGHTS = [
  { f1: 'CHRIS EUBANK JR', f2: 'CONOR BENN', badge: 'MAIN EVENT', badgeColor: '#c8102e', sport: 'BOXING', rounds: 12, fee: 1500, pot: 42000, image: '/site/card-eubank-benn.jpg' },
  { f1: 'DAVID BENAVIDEZ', f2: 'ANTHONY YARDE', badge: 'CO-MAIN', badgeColor: '#f5a623', sport: 'BOXING', rounds: 12, fee: 1000, pot: 28000, image: '/site/card-benavidez-yarde.jpg' },
  { f1: 'JADDEN ADDISON', f2: 'ZAVEER DAVIS', badge: 'FEATURED', badgeColor: '#2b6fe8', sport: 'MMA', rounds: 3, fee: 500, pot: 14000, image: '/site/card-addison-davis.jpg' },
  // Was a 167x208 and a 106x132 icon stretched into a 16:9 card — that upscale is
  // what read as "distorted". Replaced with the same split-frame composite build
  // as the three fights above, at native 760x428.
  { f1: 'RED CORNER', f2: 'BLUE CORNER', badge: '', badgeColor: '', sport: 'BARE KNUCKLE', rounds: 5, fee: 250, pot: 6400, image: '/site/card-bareknuckle-preview.jpg' },
  { f1: 'STRIKER A', f2: 'STRIKER B', badge: '', badgeColor: '', sport: 'KICKBOXING', rounds: 3, fee: 100, pot: 3200, image: '/site/card-kickboxing-preview.jpg' },
].map((row, index) => ({
  id: 'preview-' + index,
  ...row,
  when: '',
  entries: 0,
  guaranteed: row.pot,
  isPreview: true,
}));

const PREVIEW_BOARD = [
  { name: 'KO_BEAST', points: '4,180' },
  { name: 'RINGRUST22', points: '3,940' },
  { name: 'FIGHTIQ_KING', points: '3,615' },
  { name: 'SOUTHPAW', points: '3,204' },
  { name: 'CASUALKO', points: '2,870' },
];

// Seed names for the leaderboard. Real players displace these from the top;
// their scores drift on a timer so the board is never a static screenshot.
const SEED_BOARD = [
  { name: 'KO_BEAST', pts: 4180 },
  { name: 'CAGE_SAVANT', pts: 3905 },
  { name: 'SOUTHPAW_SAM', pts: 3742 },
  { name: 'THE_ORACLE', pts: 3510 },
  { name: 'GLOVE_STORY', pts: 3388 },
  { name: 'ROUND_TWELVE', pts: 3204 },
  { name: 'CLINCHWORK', pts: 3061 },
  { name: 'PAPER_CUTS', pts: 2887 },
];

const fetchJson = async (path) => {
  try {
    // no-store on the server-to-server hop too: without it these responses sit
    // in the platform's fetch cache and the page renders fresh HTML around
    // stale fight data, which looks exactly like the bug it is.
    const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

// getServerSideProps, not getStaticProps: static props are baked at build time, so
// the page shipped frozen with whatever existed at compile — nothing, on a fresh
// deploy — and never updated when fights were added. This runs per request.
export async function getServerSideProps({ res }) {
  if (res) {
    // NO CDN cache on the homepage. This was s-maxage=60 with a 5-minute
    // stale-while-revalidate, which meant a fight created in the back office
    // could take a minute to appear and a stale copy could be served for five
    // — the server-side cache invalidation cannot reach an edge cache, so the
    // only way for "publish and it is there" to be true is to not cache the
    // page at all. It is server-rendered per request and the API behind it is
    // still cached, so the cost is small.
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
  }
  const [fightData, boardData, apparelData] = await Promise.all([
    // prediction-fights, not fights — the latter does not exist and 404'd silently.
    fetchJson('/api/public/prediction-fights?limit=24'),
    fetchJson('/api/public/leaderboard?limit=8'),
    // The live Etsy catalogue. Falls through to STORE_ITEMS when the shop is
    // unreachable or the Etsy keys are not configured.
    fetchJson('/api/public/apparel-products?limit=12'),
  ]);

  // /api/public/prediction-fights responds with { items: [...] }, not
  // { fights } or { matches } — those two never matched anything, so this
  // page has been showing PREVIEW_FIGHTS unconditionally regardless of what
  // was actually published in the back office.
  const rawFights = Array.isArray(fightData?.items) ? fightData.items
    : Array.isArray(fightData?.fights) ? fightData.fights
      : Array.isArray(fightData?.matches) ? fightData.matches
        : Array.isArray(fightData) ? fightData : [];

  const now = Date.now();
  const eligible = rawFights
    .filter((f) => f && resolveFightName(f, 'A') && resolveFightName(f, 'B'))
    // Was matchDate > now, which dropped a fight off the site the instant its
    // scheduled start time passed — even while the admin still had it marked
    // Ongoing and open for predictions. Only prizesSettledAt/Finished actually
    // means "done"; a same-day fight that already started is still live.
    .filter((f) => !f.prizesSettledAt && String(f.matchStatus || '').toLowerCase() !== 'finished');

  // Admin "Homepage banner" / "Featured fight" / "Featured this week" toggles
  // must actually surface here — they used to only flip a flag nothing read,
  // so a promoted fight and green success toast never changed the site.
  //
  // A fight the admin explicitly slotted (1-5, via homepageSlot) MUST land in
  // that exact window — not wherever rank/weight/date ordering would put it.
  // Fights with no explicit slot fill whatever windows are left, in the old
  // rank/weight/date order.
  const slots = new Array(5).fill(null);
  eligible.forEach((f) => {
    const slot = Number(f.homepageSlot);
    if (f.homepagePromoted && slot >= 1 && slot <= 5 && !slots[slot - 1]) slots[slot - 1] = f;
  });
  const placedIds = new Set(slots.filter(Boolean).map((f) => f._id || f.id));
  const remaining = eligible
    .filter((f) => !placedIds.has(f._id || f.id))
    .sort((a, b) => {
      const rankDiff = Number(b.homepagePromotionRank || 0) - Number(a.homepagePromotionRank || 0);
      if (rankDiff) return rankDiff;
      const weight = (f) => (f.homepagePromoted ? 2 : 0) + (f.featuredFight || f.featuredThisWeek ? 1 : 0);
      const diff = weight(b) - weight(a);
      return diff !== 0 ? diff : new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
    });
  let ri = 0;
  for (let i = 0; i < 5 && ri < remaining.length; i++) {
    if (!slots[i]) { slots[i] = remaining[ri]; ri += 1; }
  }
  const open = slots.filter(Boolean);

  const fights = open.map(toFightCard);

  const rawBoard = Array.isArray(boardData?.leaderboard) ? boardData.leaderboard
    : Array.isArray(boardData?.players) ? boardData.players
      : Array.isArray(boardData) ? boardData : [];

  const board = rawBoard.slice(0, 8).map((row) => ({
    name: String(row.playerName || row.displayName || row.username || row.name || 'Player').toUpperCase(),
    points: money(row.totalPoints ?? row.points ?? row.score ?? 0),
  }));

  const upcoming = open.slice(0, 3).map((f) => ({
    name: `${resolveFightName(f, 'A')} vs ${resolveFightName(f, 'B')}`,
    when: f.matchDate
      ? new Date(f.matchDate).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      : 'TBA',
  }));

  // The ticker is built from whatever is real. Generic lines appear only when
  // there is nothing else — filler beside live results reads as a broken feed.
  const ticker = [];
  if (board[0]) ticker.push({ text: `\ud83d\udc51 ${board[0].name} leads the board \u2014 ${board[0].points} pts`, color: '#f5a623' });
  fights.slice(0, 3).forEach((f) => {
    ticker.push({ text: `\ud83e\udd4a ${f.f1} vs ${f.f2} \u2014 ${f.potLabel}`, color: '#22c55e' });
  });
  if (fights.length) ticker.push({ text: `\u26a1 ${fights.length} card${fights.length === 1 ? '' : 's'} open for predictions`, color: '#2b6fe8' });
  if (ticker.length < 3) {
    ticker.push(
      { text: '\ud83d\udd25 New fight cards appear here the moment they open', color: '#ff6b1a' },
      { text: '\ud83c\udfc6 The leaderboard opens once the first cards are scored', color: '#22c55e' },
    );
  }

  // No revalidate key here — that one is getStaticProps-only and throws in SSR.
  // The same 60-second caching is set as a response header instead, so the page
  // stays fast without ever serving data baked in at build time.
  // apiReachable tells the page whether the server answered at all. Without it an
  // unreachable backend is indistinguishable from an empty one, and the visitor
  // sees a polite "coming soon" while the real problem is a dead server.
  // Map the shop's products into the shape the carousel renders. Only entries
  // with a real image are kept — a product card with no photograph looks broken.
  // apparelData.source is 'fallback' when Etsy sync isn't configured — that
  // fallback catalogue points at image paths that were never shipped in this
  // frontend's public/ folder, so every tile 404s and the whole window reads
  // as empty. Only take products from a REAL Etsy sync; otherwise fall through
  // to STORE_ITEMS, whose images are verified to exist.
  const rawApparel = apparelData?.source === 'fallback' ? [] : (Array.isArray(apparelData?.products) ? apparelData.products : []);
  const products = rawApparel
    .filter((p) => p && p.name && p.image)
    .slice(0, 12)
    .map((p) => ({
      name: String(p.name).slice(0, 48),
      price: typeof p.price === 'number'
        ? '$' + p.price.toFixed(p.price % 1 === 0 ? 0 : 2)
        : String(p.price || ''),
      image: String(p.image),
      url: String(p.url || p.listingUrl || ''),
    }));

  const apiReachable = Boolean(fightData || boardData);

  // Never ship an empty fight section. A visitor cannot tell "no fights published"
  // from "this site is broken", and the second reading costs a signup.
  const usingPreview = fights.length === 0;
  return {
    props: {
      fights: usingPreview ? PREVIEW_FIGHTS : fights,
      board: board.length ? board : PREVIEW_BOARD,
      ticker,
      upcoming: upcoming.length ? upcoming : PREVIEW_FIGHTS.slice(0, 3).map((f) => ({ name: f.f1 + ' vs ' + f.f2, when: 'TBA' })),
      apiReachable,
      usingPreview,
      products,
    },
  };
}

export default FantasyMMAdnessSite;
