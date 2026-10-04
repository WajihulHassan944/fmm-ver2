import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaChartLine, FaFistRaised, FaShieldAlt } from 'react-icons/fa';

export default function FighterPerformanceTracker() {
  return (
    <>
      <Head><title>Fighter Intelligence | FANTASY MMADNESS</title></Head>
      <main className="experience-page fighter-intelligence-page">
        <section className="theme-container player-dynamic-empty" style={{minHeight:'70vh'}}>
          <FaChartLine />
          <p className="xp-eyebrow">FANTASY MMADNESS · FIGHTER INTELLIGENCE</p>
          <h1>Study the fighter. Predict the action.</h1>
          <p>The retired performance tracker used an older scoring model, so it has been removed from the live player experience. Use the current fighter library and fight cards for active records, matchup context, and prediction-ready information.</p>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
            <Link href="/our-fighters" className="theme-btn theme-btn-primary"><FaFistRaised /> Explore fighters <FaArrowRight /></Link>
            <Link href="/upcomingfights" className="theme-btn"><FaShieldAlt /> Open fight cards <FaArrowRight /></Link>
          </div>
        </section>
      </main>
    </>
  );
}
