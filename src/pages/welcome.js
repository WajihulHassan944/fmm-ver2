import { useState } from 'react';
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
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
  .fmm-site a { transition: filter .14s ease, color .14s ease; }
  .fmm-site a:hover { filter: brightness(1.14); }
  .fmm-site button:hover:not(:disabled) { filter: brightness(1.12); }
  .fmm-site button:active:not(:disabled) { transform: translateY(1px); }
  .fmm-site input:focus, .fmm-site select:focus { outline: 2px solid #f5a623; outline-offset: 1px; border-color: #f5a623; }
  .fmm-site input::placeholder { color: rgba(255,255,255,.42); }
  .fmm-site select option { background: #0b0e18; color: #fff; }
  @keyframes fmmTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes fmmPulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
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
    [data-fmm="store-grid"] { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }

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

const FantasyMMAdnessSite = ({ fights = [], board = [], ticker = [], upcoming = [] }) => {
  const router = useRouter();
  // Phone nav. The desktop links are hidden below 760px, so without this menu
  // there is no route to Fight Cards, Leagues, Leaderboard or the Store.
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', dateOfBirth: '', residenceState: '',
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const onField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setNotice(null);

    // Checked here as well as on the server, so an under-age visitor gets an
    // answer instead of filling the whole form to be refused.
    const born = new Date(form.dateOfBirth);
    const age = Number.isNaN(born.getTime()) ? 0 : Math.floor((Date.now() - born.getTime()) / 31557600000);
    if (age < 18) {
      setNotice({ ok: false, text: 'You must be at least 18 to create an account.' });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isUSCitizen: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ ok: false, text: payload?.message || 'Could not create that account.' });
        return;
      }
      // Straight into the app if a session came back — asking someone to sign in
      // again immediately after signing up is where signups leak.
      if (payload?.token) {
        try {
          window.localStorage.setItem('authToken', payload.token);
          // The app reads these on boot; without them it starts signed-out and the
          // new player is bounced to a login screen seconds after registering.
          if (payload?.user?.email) window.localStorage.setItem('userEmail', payload.user.email);
          if (payload?.user?._id) window.localStorage.setItem('userId', String(payload.user._id));
        } catch (error) { /* storage unavailable */ }
        // /home is the app. '/' is this website — pushing there dropped the new
        // player back on the signup page they had just completed.
        router.push('/home');
        return;
      }
      setNotice({ ok: true, text: payload?.message || 'Account created. Check your email to verify it, then sign in.' });
    } catch (error) {
      setNotice({ ok: false, text: 'Could not reach the server. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

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
            <div style={{ display: 'flex', gap: 46, width: 'max-content', animation: 'fmmTicker 34s linear infinite', fontSize: 13.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap' }}>
              {[...ticker, ...ticker].map((item, index) => (
                <span key={index} style={{ color: item.color }}>{item.text}</span>
              ))}
            </div>
        </div>

        <div id="fights" data-fmm="body-grid" style={{ maxWidth: '1320px', margin: '0 auto', padding: '62px 32px 0', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 348px', gap: '40px', alignItems: 'start' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(216,220,228,.16)', paddingBottom: '14px', marginBottom: '26px' }}>
              <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: '34px', margin: 0, letterSpacing: '.01em' }}>OPEN FIGHT CARDS</h2>
              <div style={{ display: 'flex', gap: '7px' }}>
                <span style={{ padding: '7px 13px', borderRadius: '999px', background: 'rgba(245,166,35,.16)', border: '1px solid #f5a623', color: '#f5a623', fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>All</span>
                <span style={{ padding: '7px 13px', borderRadius: '999px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(216,220,228,.18)', color: 'rgba(255,255,255,.7)', fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Boxing</span>
                <span style={{ padding: '7px 13px', borderRadius: '999px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(216,220,228,.18)', color: 'rgba(255,255,255,.7)', fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>MMA</span>
                <span style={{ padding: '7px 13px', borderRadius: '999px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(216,220,228,.18)', color: 'rgba(255,255,255,.7)', fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Wrestling</span>
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
              ) : fights.map((fight, index) => (
                <div key={fight.id} style={{ border: '1px solid ' + (index === 0 ? 'rgba(245,166,35,.4)' : 'rgba(216,220,228,.18)'), borderRadius: 14, overflow: 'hidden', background: index === 0 ? 'linear-gradient(168deg,rgba(245,166,35,.1),rgba(11,14,24,.7))' : 'rgba(255,255,255,.03)' }}>
                  <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0e18' }}>
                    <img loading={index < 2 ? 'eager' : 'lazy'} decoding="async" src={fight.image} alt={fight.f1 + ' vs ' + fight.f2} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 32%' }} />
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
                <div style={{ border: '1px dashed rgba(245,166,35,.45)', borderRadius: 14, padding: '26px 22px', background: 'rgba(245,166,35,.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 11 }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, lineHeight: 1.12 }}>ALL FIVE SPORTS,<br />ONE TEAM CARD</div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.7)', margin: 0 }}>
                    Boxing, MMA, bare knuckle, kickboxing and pro wrestling all run on the same scoring engine.
                  </p>
                  <a href="#contests" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 20px', borderRadius: 999, background: '#f5a623', color: '#17070a', fontFamily: "'Anton', sans-serif", fontSize: 13.5, letterSpacing: '.05em' }}>HOW IT WORKS</a>
                </div>
              ) : null}
            </div>
          </div>

          <div data-fmm="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>

            <div id="board" style={{ border: '1px solid rgba(216,220,228,.18)', borderRadius: '14px', background: 'rgba(255,255,255,.03)', overflow: 'hidden' }}>
              <div style={{ padding: '15px 18px', borderBottom: '1px solid rgba(216,220,228,.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '16px', letterSpacing: '.04em' }}>LEADERBOARD</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#22c55e' }}>Live</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  {board.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '16px 18px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>The board opens once the first cards are scored.</td></tr>
                  ) : board.map((row, index) => (
                    <tr key={index} style={{ borderBottom: index === board.length - 1 ? 'none' : '1px solid rgba(216,220,228,.09)' }}>
                      <td style={{ padding: '11px 8px 11px 18px', width: 34, fontFamily: "'Anton', sans-serif", fontSize: 15, color: ['#f5a623', '#d8dce4', '#c9772e'][index] || 'rgba(255,255,255,.4)' }}>{index + 1}</td>
                      <td style={{ padding: '11px 8px', fontSize: 14.5, fontWeight: 700, color: index < 3 ? '#fff' : 'rgba(255,255,255,.8)' }}>{row.name}</td>
                      <td style={{ padding: '11px 18px 11px 8px', textAlign: 'right', fontFamily: "'Anton', sans-serif", fontSize: 15, color: index === 0 ? '#f5a623' : '#fff' }}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a href="#board" style={{ display: 'block', padding: '13px 18px', borderTop: '1px solid rgba(216,220,228,.14)', fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f5a623' }}>Full standings →</a>
            </div>

            <div id="season" style={{ border: '1px solid rgba(192,57,159,.4)', borderRadius: '14px', padding: '18px', background: 'linear-gradient(168deg,rgba(192,57,159,.12),rgba(11,14,24,.6))' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#d76fc0', marginBottom: '8px' }}>Season Card · drafting open</div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: '20px', lineHeight: 1.15, marginBottom: '9px' }}>FIVE SPORTS.<br />ONE ROSTER.</div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.72)', margin: '0 0 15px' }}>
                Draft one fighter from boxing, MMA, bare knuckle, kickboxing and pro wrestling. They compete on their own schedules all season — every round they throw lands on your card.
              </p>
              <a href="#season" style={{ display: 'inline-flex', alignItems: 'center', height: '42px', padding: '0 20px', borderRadius: '999px', background: '#c0399f', color: '#fff', fontFamily: '"Anton", sans-serif', fontSize: '13.5px', letterSpacing: '.05em' }}>DRAFT FREE</a>
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
              <a href="#apply" style={{ display: 'inline-flex', alignItems: 'center', height: '50px', padding: '0 28px', borderRadius: '999px', background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: '"Anton", sans-serif', fontSize: '15px', letterSpacing: '.06em', boxShadow: '0 8px 24px rgba(225,29,46,.36)' }}>APPLY AS AN AFFILIATE</a>
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
            <div data-fmm="store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
              <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid rgba(216,220,228,.16)', borderRadius: '13px', overflow: 'hidden', background: 'rgba(255,255,255,.03)', color: 'inherit', textDecoration: 'none' }}>
                <div style={{ aspectRatio: 1, background: '#0b0e18' }}><img loading="lazy" decoding="async" src="/site/tee.webp" alt="Ringside Tee" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ padding: '14px 15px 16px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '4px' }}>Ringside Tee</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '17px', color: '#f5a623', fontVariantNumeric: 'tabular-nums' }}>$32</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.45)' }}>ETSY \u2197</span>
                  </div>
                </div>
              </a>
              <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid rgba(216,220,228,.16)', borderRadius: '13px', overflow: 'hidden', background: 'rgba(255,255,255,.03)', color: 'inherit', textDecoration: 'none' }}>
                <div style={{ aspectRatio: 1, background: '#0b0e18' }}><img loading="lazy" decoding="async" src="/site/fighter-cutout.webp" alt="Cage Hoodie" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ padding: '14px 15px 16px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '4px' }}>Cage Hoodie</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '17px', color: '#f5a623', fontVariantNumeric: 'tabular-nums' }}>$64</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.45)' }}>ETSY \u2197</span>
                  </div>
                </div>
              </a>
              <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid rgba(216,220,228,.16)', borderRadius: '13px', overflow: 'hidden', background: 'rgba(255,255,255,.03)', color: 'inherit', textDecoration: 'none' }}>
                <div style={{ aspectRatio: 1, background: '#0b0e18' }}><img loading="lazy" decoding="async" src="/site/faceoff.webp" alt="Corner Cap" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ padding: '14px 15px 16px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '4px' }}>Corner Cap</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '17px', color: '#f5a623', fontVariantNumeric: 'tabular-nums' }}>$28</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.45)' }}>ETSY \u2197</span>
                  </div>
                </div>
              </a>
              <a href="https://www.etsy.com/shop/FANTASYMMADNESS" target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid rgba(216,220,228,.16)', borderRadius: '13px', overflow: 'hidden', background: 'rgba(255,255,255,.03)', color: 'inherit', textDecoration: 'none' }}>
                <div style={{ aspectRatio: 1, background: '#0b0e18' }}><img loading="lazy" decoding="async" src="/site/red-corner.webp" alt="Training Gloves" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ padding: '14px 15px 16px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '4px' }}>Training Gloves</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: '"Anton", sans-serif', fontSize: '17px', color: '#f5a623', fontVariantNumeric: 'tabular-nums' }}>$79</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.06em', color: 'rgba(255,255,255,.45)' }}>ETSY \u2197</span>
                  </div>
                </div>
              </a>
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
              <form onSubmit={handleSignup} style={{ background: 'rgba(5,6,10,.55)', border: '1px solid rgba(216,220,228,.2)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 19, marginBottom: 14, letterSpacing: '.03em' }}>CREATE YOUR ACCOUNT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input name="firstName" value={form.firstName} onChange={onField} placeholder="First name" autoComplete="given-name" required style={fieldStyle} />
                  <input name="lastName" value={form.lastName} onChange={onField} placeholder="Last name" autoComplete="family-name" required style={fieldStyle} />
                </div>
                <input name="email" type="email" value={form.email} onChange={onField} placeholder="Email" autoComplete="email" required style={fieldStyle} />
                <input name="password" type="password" value={form.password} onChange={onField} placeholder="Password (8+ characters)" autoComplete="new-password" minLength={8} required style={fieldStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onField} required aria-label="Date of birth" style={fieldStyle} />
                  <select name="residenceState" value={form.residenceState} onChange={onField} required aria-label="State of residence" style={fieldStyle}>
                    <option value="">State</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: 'rgba(255,255,255,.5)', margin: '2px 0 14px' }}>
                  By creating an account you agree to our{' '}
                  <Link href="/terms" style={{ color: '#f5a623' }}>Terms of Use</Link> and{' '}
                  <Link href="/privacy" style={{ color: '#f5a623' }}>Privacy Policy</Link>.
                </p>
                {notice ? (
                  <div role="status" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: notice.ok ? 'rgba(34,197,94,.14)' : 'rgba(225,29,46,.14)', border: '1px solid ' + (notice.ok ? 'rgba(34,197,94,.5)' : 'rgba(225,29,46,.5)'), color: notice.ok ? '#7ee2a4' : '#ff9aa4' }}>{notice.text}</div>
                ) : null}
                <button type="submit" disabled={busy} style={{ width: '100%', height: 52, borderRadius: 999, border: 0, cursor: 'pointer', background: 'linear-gradient(96deg,#f5a623,#e11d2e)', color: '#17070a', fontFamily: "'Anton', sans-serif", fontSize: 16, letterSpacing: '.06em', opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'CREATING...' : 'CREATE MY ACCOUNT'}
                </button>
                <div style={{ marginTop: 13, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>
                  Already have an account? <Link href="/auth?next=/home" style={{ color: '#f5a623' }}>Sign in</Link>
                </div>
              </form>
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
                <a href="#leagues" style={{ color: 'rgba(255,255,255,.72)' }}>Become an affiliate</a>
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
      </div>
    </>
  );
};

// --------------------------------------------------------------------------
// DATA
//
// Static generation with a 60-second revalidate: the page is served from cache
// so it stays fast, and refreshes itself a minute after a fight is published.
// SSR on every request would undo the load-time work; a fully static build would
// go stale.
// --------------------------------------------------------------------------
const IMAGES = ['/site/fight-clash.webp', '/site/faceoff.webp', '/site/red-corner.webp', '/site/prize-arena.webp', '/site/arena.jpg', '/site/leagues.jpg'];

const money = (n) => Number(n || 0).toLocaleString('en-US');

// --------------------------------------------------------------------------
// PREVIEW CARD
// The exact five fights from the design document. Shown ONLY when the API returns
// no published fights, so the site never has an empty fight section — that empty
// state is indistinguishable from a broken site to a visitor.
//
// Every row carries isPreview: true, so the page can label them and never present
// them as live contests to enter.
// --------------------------------------------------------------------------
const PREVIEW_FIGHTS = [
  // Imagery is the app's own discipline artwork, copied into /site — so a boxing
  // card shows boxing and the site matches the app rather than using stock frames.
  { f1: 'IRON JACKSON', f2: 'DEXTER FOLD', badge: 'MAIN EVENT', badgeColor: '#c8102e', sport: 'BOXING', rounds: 12, fee: 1500, pot: 42000, image: '/site/sport-boxing.webp' },
  { f1: 'RAFAEL MENDES', f2: 'COLE BRANNIGAN', badge: 'CO-MAIN', badgeColor: '#f5a623', sport: 'MMA', rounds: 3, fee: 4000, pot: 96000, image: '/site/sport-mma.webp' },
  { f1: 'DUSTY WHEELER', f2: 'MARCUS VANE', badge: 'FEATURED', badgeColor: '#2b6fe8', sport: 'BARE KNUCKLE', rounds: 5, fee: 500, pot: 14000, image: '/site/sport-bareknuckle.webp' },
  { f1: 'SOMCHAI PETCH', f2: 'LARS EIDE', badge: '', badgeColor: '', sport: 'KICKBOXING', rounds: 3, fee: 100, pot: 3200, image: '/site/sport-kickboxing.webp' },
  { f1: 'THE ARCHITECT', f2: 'KID DYNAMO', badge: '', badgeColor: '', sport: 'PRO WRESTLING', rounds: 1, fee: 0, pot: 0, image: '/site/sport-wrestling.webp' },
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

const fetchJson = async (path) => {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export async function getStaticProps() {
  const [fightData, boardData] = await Promise.all([
    fetchJson('/api/public/fights?limit=24'),
    fetchJson('/api/public/leaderboard?limit=5'),
  ]);

  const rawFights = Array.isArray(fightData?.fights) ? fightData.fights
    : Array.isArray(fightData?.matches) ? fightData.matches
      : Array.isArray(fightData) ? fightData : [];

  const now = Date.now();
  const open = rawFights
    .filter((f) => f && f.matchFighterA && f.matchFighterB)
    // Only fights still ahead of us. This is the whole point of wiring real data.
    .filter((f) => !f.prizesSettledAt && (!f.matchDate || new Date(f.matchDate).getTime() > now))
    .sort((a, b) => new Date(a.matchDate || 0) - new Date(b.matchDate || 0))
    .slice(0, 5);

  const fights = open.map((f, index) => {
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
      f1: String(f.matchFighterA).toUpperCase(),
      f2: String(f.matchFighterB).toUpperCase(),
      image: f.featuredThisWeekImage || f.fightPosterImage || IMAGES[index % IMAGES.length],
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
  });

  const rawBoard = Array.isArray(boardData?.leaderboard) ? boardData.leaderboard
    : Array.isArray(boardData?.players) ? boardData.players
      : Array.isArray(boardData) ? boardData : [];

  const board = rawBoard.slice(0, 5).map((row) => ({
    name: String(row.playerName || row.displayName || row.username || row.name || 'Player').toUpperCase(),
    points: money(row.totalPoints ?? row.points ?? row.score ?? 0),
  }));

  const upcoming = open.slice(0, 3).map((f) => ({
    name: `${f.matchFighterA} vs ${f.matchFighterB}`,
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

  return { props: { fights, board, ticker, upcoming }, revalidate: 60 };
}

export default FantasyMMAdnessSite;
