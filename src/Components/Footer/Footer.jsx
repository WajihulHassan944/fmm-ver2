"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  FaArrowRight,
  FaEnvelope,
  FaFacebookF,
  FaHandshake,
  FaInstagram,
  FaStar,
  FaTiktok,
  FaTrophy,
  FaTwitter,
  FaUserFriends,
  FaYoutube,
} from 'react-icons/fa';

const LOGO_URL = '/images/fmm-experience/fantasy-mmadness-logo.png';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/fantasymmadness', icon: FaInstagram },
  { label: 'X', href: 'https://x.com/FMmadness2024', icon: FaTwitter },
  { label: 'TikTok', href: 'https://www.tiktok.com/@fantasy.mmadness?_t=ZP-8xmvN5F9kCs&_r=1', icon: FaTiktok },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg', icon: FaYoutube },
  { label: 'Facebook', href: 'https://www.facebook.com/fantasymmadness', icon: FaFacebookF },
];

const quickLinks = [
  ['Fights', '/upcomingfights'],
  ['Fantasy MMA', '/fantasy-mma'],
  ['Fantasy Boxing', '/fantasy-boxing'],
  ['Kickboxing', '/fantasy-kickboxing'],
  ['Bare-Knuckle', '/fantasy-bare-knuckle'],
  ['Pro Wrestling', '/fantasy-pro-wrestling'],
  ['Fight Calendar', '/calendar-of-fights'],
  ['Fight News', '/blogs'],
  ['Fantasy Tips', '/fantasy-tips'],
  ['Contests', '/FantasyLeagues'],
  ['Leaderboard', '/leaderboard'],
  ['How To Play', '/guides'],
  ['Rewards', '/fights-rewards'],
  ['FAQs', '/faqs'],
  ['Contact', '/contact'],
];

const Footer = () => {
  const year = new Date().getFullYear();
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const isAuthenticatedAffiliate = useSelector((state) => Boolean(state.affiliateAuth?.isAuthenticatedAffiliate));
  const [isSponsorAuthenticated, setIsSponsorAuthenticated] = useState(false);

  useEffect(() => {
    setIsSponsorAuthenticated(typeof window !== 'undefined' && localStorage.getItem('isSponsorAuthenticated') === 'true');
  }, []);

  const dashboardHomeHref = isAuthenticatedAffiliate
    ? '/AffiliateDashboard'
    : isSponsorAuthenticated
      ? '/sponsor-dashboard'
      : isAuthenticated
        ? '/UserDashboard'
        : '/home';

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <footer className="theme-footer footerDistributed">
      <div className="fmm-footer-shell">
        <div className="fmm-footer-topline">
          <div>
            <p>Trusted by fans. Backed by partners.</p>
            <div className="fmm-partner-strip" aria-label="Combat sports and media partners">
              <span>UFC</span>
              <span>BKFC</span>
              <span>GLORY</span>
              <span>ESPN</span>
              <span>DAZN</span>
              <span>WRESTLING</span>
            </div>
          </div>
          <Link href="/upcomingfights" className="fmm-footer-top-link">
            View all contests <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="fmm-footer-feature-grid">
          <section className="fmm-footer-feature fmm-footer-affiliate-card">
            <img className="fmm-footer-card-art" src="/images/hero-fight.png" alt="" loading="lazy" aria-hidden="true" />
            <div className="fmm-footer-feature-icon"><FaUserFriends aria-hidden="true" /></div>
            <h3>Affiliates &amp; Creators</h3>
            <p>Earn tokens and cash by referring players. Join our affiliate program today.</p>
            <Link href="/affiliate-create-account" className="fmm-footer-action">
              Learn More <FaArrowRight aria-hidden="true" />
            </Link>
          </section>

          <section className="fmm-footer-feature fmm-footer-sponsor-card">
            <img className="fmm-footer-card-art" src="/images/hero-fight-original.png" alt="" loading="lazy" aria-hidden="true" />
            <div className="fmm-footer-feature-icon"><FaHandshake aria-hidden="true" /></div>
            <h3>Sponsor Your Brand</h3>
            <p>Reach a highly engaged combat sports audience across our platform.</p>
            <Link href="/Sponsors" className="fmm-footer-action">
              Become A Sponsor <FaStar aria-hidden="true" />
            </Link>
          </section>

          <section className="fmm-footer-feature fmm-footer-newsletter-card">
            <div className="fmm-footer-feature-icon"><FaEnvelope aria-hidden="true" /></div>
            <h3>Stay In The Fight</h3>
            <p>Get fight alerts, contest drops, and exclusive offers.</p>
            <form onSubmit={handleNewsletterSubmit} className="fmm-footer-newsletter">
              <input type="email" placeholder="Enter your email" aria-label="Email address" required />
              <button type="submit">Sign Up</button>
            </form>
          </section>

          <section className="fmm-footer-feature fmm-footer-social-card">
            <div className="fmm-footer-feature-icon"><FaTrophy aria-hidden="true" /></div>
            <h3>Follow Us</h3>
            <p>Daily fight drops, fantasy contests, and winner updates.</p>
            <div className="footerIcons fmm-footer-socials">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="fmm-footer-bottom">
          <Link href={dashboardHomeHref} className="fmm-footer-logo" aria-label="Fantasy MMAdness home">
            <img src={LOGO_URL} alt="Fantasy MMAdness" loading="lazy" />
          </Link>
          <nav aria-label="Footer navigation">
            {quickLinks.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <p>© {year} Fantasy MMAdness. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
