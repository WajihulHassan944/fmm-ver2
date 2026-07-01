
import Head from 'next/head';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { FaChevronDown, FaQuestionCircle, FaSearch, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { ExperienceHero } from '@/Components/Theme/ExperiencePrimitives';

const fallbackFaqs = [
  { title: 'What is Fantasy MMAdness?', description: 'Fantasy MMAdness is a combat-sports prediction platform for boxing, MMA, kickboxing, and bare-knuckle events. Players predict round and fight outcomes, compete on leaderboards, and earn platform rewards.' },
  { title: 'How do live fight predictions work?', description: 'Members predict live fight metrics such as round winners, methods of victory, punch counts, and other configured fight statistics before the contest starts.' },
  { title: 'Can I play for free?', description: 'Yes. Fantasy MMAdness includes free-to-play experiences so players can learn the prediction flow before entering paid token contests.' },
  { title: 'What are tokens?', description: 'Tokens are the platform currency used for paid fight entries. Existing backend wallet and refund behavior remains unchanged.' },
  { title: 'What rewards can I earn?', description: 'Players can win cash prizes, tokens, leaderboard recognition, and public profile achievements by performing well in prediction contests.' },
];

const normalizeFaq = (item, index) => {
  const fallback = fallbackFaqs[index % fallbackFaqs.length];
  const title = item?.title || item?.question || item?.name || fallback?.title;
  const description = item?.description || item?.answer || item?.content || item?.acceptedAnswer?.text || fallback?.description;
  return { ...item, title, description };
};

export default function FAQsPage({ faqs = [] }) {
  const rows = useMemo(() => (Array.isArray(faqs) && faqs.length ? faqs : fallbackFaqs).map(normalizeFaq).filter((item) => item.title && item.description), [faqs]);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(rows[0]?._id || rows[0]?.id || 'default-0');

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((faq) => `${faq.title} ${faq.description}`.toLowerCase().includes(normalized));
  }, [rows, search]);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: rows.map((faq) => ({
      '@type': 'Question',
      name: faq.title,
      acceptedAnswer: { '@type': 'Answer', text: faq.description },
    })),
  }), [rows]);

  return (
    <>
      <Head>
        <title>FAQs – Fantasy Boxing Game & League | Fantasy-MMadness</title>
        <meta name="description" content="Answers about Fantasy MMAdness accounts, scoring, fight predictions, tokens, rewards, leagues, and support." />
        <meta name="keywords" content="fantasy boxing, fantasy boxing game, fantasy boxing league, fantasy sports FAQ, Fantasy-MMadness questions" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <div className="experience-page faq-experience-page">
        <ExperienceHero
          eyebrow="Support center"
          title="Answers before"
          accent="the bell."
          description="A premium support library for account access, prediction scoring, wallet tokens, league activity, fight entries, and platform rules. The FAQ feed still uses the existing production endpoint."
          backgroundImage="/images/fmm-pages/premium-arena-banner.webp"
          className="premium-faq-phase-two-hero"
          actions={[
            { href: '#faq-board', label: 'Search answers' },
            { href: '/contact', label: 'Contact support', variant: 'secondary' },
          ]}
          stats={[
            { value: rows.length, label: 'Answers', icon: FaQuestionCircle },
            { value: 'Live', label: 'FAQ endpoint', icon: FaShieldAlt },
            { value: '24/7', label: 'Player guidance', icon: FaTrophy },
          ]}
        >
          <div className="xp-faq-hero-card">
            <span>Most searched</span>
            {rows.slice(0, 3).map((faq, index) => (
              <button type="button" key={faq._id || faq.id || index} onClick={() => setActiveId(faq._id || faq.id || `default-${index}`)}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <p>{faq.title}</p>
              </button>
            ))}
          </div>
        </ExperienceHero>

        <main className="xp-page-main" id="faq-board">
          <div className="theme-container">
            <section className="xp-faq-page">
              <div className="xp-faq-intro">
                <span><FaQuestionCircle /> Fight support</span>
                <h2>Everything you need before the bell.</h2>
                <p>Search practical answers about predictions, scoring, wallets, leagues, accounts, and platform operations.</p>
                <label className="xp-faq-search">
                  <FaSearch aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or topics" aria-label="Search FAQs" />
                </label>
              </div>

              <div className="xp-faq-layout">
                <aside className="xp-faq-aside">
                  <FaQuestionCircle aria-hidden="true" />
                  <strong>Quick guidance</strong>
                  <p>Scoring and contest results are calculated by the backend. This page changes the visual presentation only.</p>
                  <Link href="/guides">Open player guide</Link>
                  <Link href="/upcomingfights">Explore fight cards</Link>
                </aside>

                <div className="xp-faq-list">
                  {filtered.length ? filtered.map((faq, index) => {
                    const id = faq._id || faq.id || `default-${index}`;
                    const open = activeId === id;
                    return (
                      <article className={`xp-faq-item ${open ? 'is-open' : ''}`} key={id}>
                        <button type="button" onClick={() => setActiveId(open ? '' : id)} aria-expanded={open}>
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <strong>{faq.title}</strong>
                          <FaChevronDown aria-hidden="true" />
                        </button>
                        {open && <div><p>{faq.description}</p></div>}
                      </article>
                    );
                  }) : (
                    <div className="xp-editorial-empty"><FaSearch /><h3>No matching answers</h3><p>Try a broader search term.</p></div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = async () => {
  try {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/faqs');
    if (!response.ok) throw new Error('Failed to fetch FAQs');
    const data = await response.json();
    return { props: { faqs: JSON.parse(JSON.stringify(data?.data || data || [])) } };
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return { props: { faqs: [] } };
  }
};
