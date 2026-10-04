import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaArrowRight, FaMedal, FaTrophy, FaUsers } from 'react-icons/fa';

export default function ReferralBoard() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('https://fantasymmadness-game-server-three.vercel.app/api/referrals')
      .then((res) => { if (!res.ok) throw new Error('Referral standings unavailable'); return res.json(); })
      .then((data) => { if (active) setReferrals((Array.isArray(data) ? data : []).sort((a,b) => Number(b?.referralsCount||0)-Number(a?.referralsCount||0))); })
      .catch(() => { if (active) setError('Referral standings could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const name = (item) => [item?.referrer?.firstName, item?.referrer?.lastName].filter(Boolean).join(' ') || 'FANTASY MMADNESS member';

  return (
    <>
      <Head><title>Referral Leaderboard | FANTASY MMADNESS</title></Head>
      <main className="experience-page">
        <section className="theme-container player-command-hero" style={{marginTop:'28px'}}>
          <div className="player-command-hero-copy"><p className="xp-eyebrow"><FaTrophy /> COMMUNITY LEADERBOARD</p><h1>Bring the crowd. Climb the board.</h1><p>See which FANTASY MMADNESS members are growing the fight community through referrals.</p><div className="player-command-hero-actions"><Link href="/leaderboard">Player leaderboard <FaArrowRight /></Link><Link href="/upcomingfights" className="is-secondary">Play a fight</Link></div></div>
        </section>
        <section className="theme-container" style={{paddingTop:'32px',paddingBottom:'60px'}}>
          {loading ? <div className="player-dynamic-empty"><FaUsers /><h2>Loading referral standings…</h2></div> : error ? <div className="player-dynamic-empty"><FaUsers /><h2>{error}</h2></div> : referrals.length ? (
            <div className="player-leaderboard-table-wrap"><table className="leaderboard"><thead><tr><th>Rank</th><th>Member</th><th>Referrals</th></tr></thead><tbody>{referrals.map((item,index)=><tr key={item?.referrer?._id || index} className={index===0?'highlighted':''}><td><FaMedal /> #{index+1}</td><td>{name(item)}</td><td>{Number(item?.referralsCount||0).toLocaleString()}</td></tr>)}</tbody></table></div>
          ) : <div className="player-dynamic-empty"><FaUsers /><h2>No referrals yet.</h2><p>The leaderboard will populate as members bring new players into FANTASY MMADNESS.</p></div>}
        </section>
      </main>
    </>
  );
}
