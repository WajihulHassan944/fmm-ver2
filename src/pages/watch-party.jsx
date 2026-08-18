import Head from "next/head";
import Link from "next/link";
import React from "react";
import { FaComments, FaFistRaised, FaSignal, FaTrophy } from "react-icons/fa";

const WatchPartyPage = () => {
  const featureCards = [
    { icon: FaSignal, title: "Live scoring", copy: "Follow fight momentum, round state, and contest updates from one watch view." },
    { icon: FaComments, title: "Crowd reactions", copy: "React with other players while the fight card is active." },
    { icon: FaTrophy, title: "Leaderboard pulse", copy: "Jump to the global leaderboard as official results are posted." },
  ];

  return (
    <>
      <Head>
        <title>Live Watch Party | Fantasy MMAdness</title>
        <meta name="description" content="Join the Fantasy MMAdness live watch party for fight-night scoring, crowd reactions, and prediction links." />
      </Head>
      <main className="fmm-watch-party-page">
        <section className="fmm-watch-hero">
          <span>🔴 LIVE WATCH PARTY</span>
          <h1>Watch together. Score every round.</h1>
          <p>
            This is the fight-night hub for live scoring, crowd reactions, and quick prediction access.
            Use it during active cards, then jump directly into contests or the leaderboard.
          </p>
          <div>
            <Link href="/upcomingfights">Open Fight Contests</Link>
            <Link href="/leaderboard">View Leaderboard</Link>
          </div>
        </section>

        <section className="fmm-watch-grid" aria-label="Watch party features">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <Icon />
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="fmm-watch-live-card">
          <FaFistRaised />
          <div>
            <strong>Ready to make picks?</strong>
            <p>Choose an open fight card and lock your prediction before the contest closes.</p>
          </div>
          <Link href="/upcomingfights">Make Predictions</Link>
        </section>
      </main>
      <style jsx>{`
        .fmm-watch-party-page {
          min-height: 100vh;
          padding: 120px 20px 80px;
          color: #fff;
          background:
            radial-gradient(circle at 18% 12%, rgba(239, 68, 68, .28), transparent 32%),
            radial-gradient(circle at 82% 22%, rgba(77, 141, 255, .24), transparent 35%),
            linear-gradient(180deg, #05070d 0%, #030408 100%);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .fmm-watch-hero,
        .fmm-watch-grid,
        .fmm-watch-live-card {
          width: min(1120px, 100%);
          margin: 0 auto;
        }
        .fmm-watch-hero {
          border: 1px solid rgba(242, 181, 68, .35);
          border-radius: 28px;
          padding: clamp(28px, 6vw, 64px);
          background:
            linear-gradient(135deg, rgba(239, 68, 68, .18), rgba(77, 141, 255, .14)),
            rgba(8, 11, 18, .9);
          box-shadow: 0 28px 80px rgba(0, 0, 0, .42), inset 0 0 44px rgba(242, 181, 68, .08);
        }
        .fmm-watch-hero span,
        .fmm-watch-live-card strong {
          color: #f2b544;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .fmm-watch-hero h1 {
          margin: 14px 0;
          max-width: 760px;
          font-family: Anton, Impact, sans-serif;
          font-size: clamp(42px, 7vw, 84px);
          line-height: .94;
          letter-spacing: .02em;
          text-transform: uppercase;
        }
        .fmm-watch-hero p,
        .fmm-watch-grid p,
        .fmm-watch-live-card p {
          max-width: 740px;
          color: rgba(255, 255, 255, .76);
          line-height: 1.65;
          font-weight: 700;
        }
        .fmm-watch-hero div,
        .fmm-watch-live-card {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
        }
        .fmm-watch-hero a,
        .fmm-watch-live-card a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 24px;
          border-radius: 999px;
          text-decoration: none;
          color: #160b00;
          background: linear-gradient(180deg, #ffe28a, #f2b544);
          font-weight: 1000;
          letter-spacing: .04em;
          text-transform: uppercase;
          box-shadow: 0 0 24px rgba(242, 181, 68, .28);
        }
        .fmm-watch-hero a:nth-child(2) {
          color: #fff;
          background: rgba(255, 255, 255, .08);
          border: 1px solid rgba(255, 255, 255, .18);
        }
        .fmm-watch-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 22px;
        }
        .fmm-watch-grid article,
        .fmm-watch-live-card {
          border: 1px solid rgba(255, 255, 255, .13);
          border-radius: 22px;
          padding: 22px;
          background: rgba(255, 255, 255, .055);
          box-shadow: inset 0 0 32px rgba(255, 255, 255, .03);
        }
        .fmm-watch-grid svg,
        .fmm-watch-live-card svg {
          color: #4d8dff;
          font-size: 26px;
        }
        .fmm-watch-grid h2 {
          margin: 12px 0 8px;
          font-family: Anton, Impact, sans-serif;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .fmm-watch-live-card {
          margin-top: 20px;
          justify-content: space-between;
        }
        .fmm-watch-live-card div {
          flex: 1 1 360px;
        }
        @media (max-width: 760px) {
          .fmm-watch-party-page { padding: 88px 14px 112px; }
          .fmm-watch-grid { grid-template-columns: 1fr; }
          .fmm-watch-live-card a { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default WatchPartyPage;
