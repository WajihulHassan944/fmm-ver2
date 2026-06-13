"use client";
import React from 'react';
import Link from 'next/link';

const LOGO_URL = 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp';

const footerGroups = [
  { title: 'Play', links: [['Upcoming Fights', '/upcomingfights'], ['Fantasy Leagues', '/FantasyLeagues'], ['Leaderboard', '/leaderboard'], ['Rewards', '/fights-rewards']] },
  { title: 'Company', links: [['About', '/about'], ['Sponsors', '/Sponsors'], ['Testimonials', '/testimonials'], ['Contact', '/contact']] },
  { title: 'Support', links: [['How to Play', '/guides'], ['FAQs', '/faqs'], ['Terms of service', '/terms-of-service'], ['Privacy policy', '/privacy-policy']] },
];

const socials = [
  ['Facebook', 'https://www.facebook.com/fantasymmadness', 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744520491/home/sdypowaaa41si4blo55j.png'],
  ['Instagram', 'https://www.instagram.com/fantasymmadness', 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744520538/home/f4jdp7xacrjykuamdtrr.png'],
  ['TikTok', 'https://www.tiktok.com/@fantasy.mmadness?_t=ZP-8xmvN5F9kCs&_r=1', 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744520574/home/eywwmlypt3qlh0btknoc.png'],
  ['X', 'https://x.com/FMmadness2024', '/Assets/twitter_logo.png'],
  ['YouTube', 'https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg', 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'],
];

const Footer = () => {
  return (
    <footer className="theme-footer footerDistributed">
      <div className="theme-footer-grid">
        <div className="theme-footer-brand">
          <Link href="/home" className="theme-footer-logo">
            <img src={LOGO_URL} alt="Fantasy MMAdness" loading="lazy" />
            <span>Fantasy <strong>MMAdness</strong></span>
          </Link>
          <p>Fantasy MMAdness is a fantasy combat sports platform for MMA, boxing, kickboxing, wrestling, and bare-knuckle fight fans.</p>
          <p className="theme-footer-address">2350 Beaver Ruin Rd, Norcross Georgia 30071</p>
          <p className="theme-footer-copy">Fantasy Mmadness © 2025</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className="theme-footer-links">
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        ))}
        <div className="theme-footer-socials">
          <h3>Community</h3>
          <p>Join the discussion, follow fight updates, and stay connected with the Fantasy MMAdness community.</p>
          <Link href="/community-forum" className="theme-link-red">Open community forum</Link>
          <div className="footerIcons">
            {socials.map(([label, href, icon]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <img src={icon} alt={label} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
