
import Head from 'next/head';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { FaChevronDown, FaQuestionCircle, FaSearch, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { ExperienceHero } from '@/Components/Theme/ExperiencePrimitives';


const SCORING_SOURCE_TRUTH_COPY = 'A knockout, TKO, or submission is a Finish — and correctly calling the round it happens in pays a 500-point Finish Bonus on top of your round-winner points. If you pick the right fighter to win the finish round, you earn 100 (Round Winner) + 25 (auto-paired) + 500 (Finish Bonus) = 625 points for that round alone. If you miss the finish round pick, that round scores 0. Every other round pays a flat 25-point Survival Bonus regardless of accuracy, plus your round-winner points if you called it right.';
const STAT_ACCURACY_SOURCE_TRUTH_COPY = "Your stat predictions (punches, strikes, kicks, and more) work like a floor you are trying to clear. If the fighter's actual number is equal to or higher than your prediction, you score — and you earn points equal to exactly what you predicted. Predict 25 punches and he throws 25 or more? You get 25 points. Predict 100 and he only throws 40? You get 0 — you guessed too high.";
const LEGACY_NO_KO_COPY_RE = new RegExp(`(?:there is )?${'no separate public'}\\s+KO\\s+bonus(?:\\s+is)?\\s+advertised(?: on the site)?\\.?`, 'gi');

const sanitizeFaqCopy = (value = '') => String(value || '')
  .replace(/Fantasy\s*MMADNESS/g, 'Fantasy MMAdness')
  .replace(/Fantasy\s*MMadness/g, 'Fantasy MMAdness')
  .replace(/FantasyMMAdness/g, 'Fantasy MMAdness')
  .replace(/Fantasy-MMadness/g, 'Fantasy MMAdness')
  .replace(/Doesthe/g, 'Does the')
  .replace(/Even if the fight ends in a knockout,?\s+the fight will still be fully scored as if it went the distance\s*\(with no KO\)\.\s*This ensures that the scoring remains consistent,?\s+even if the fight ends quickly,?\s+and prevents the game from feeling too skewed toward those who just happen to pick a knockout\.?/gi, SCORING_SOURCE_TRUTH_COPY)
  .replace(/even if the fight ends in a knockout[^.]+(?:no KO|went the distance)[^.]*\.?/gi, SCORING_SOURCE_TRUTH_COPY)
  .replace(/FAQ feed still uses the existing production endpoint\.?/gi, '')
  .replace(/Scoring and contest results are calculated by the backend\.\s*/gi, '')
  .replace(/This page changes the visual presentation only\.?/gi, '')
  .replace(LEGACY_NO_KO_COPY_RE, SCORING_SOURCE_TRUTH_COPY)
  .replace(/Knockout\s*\/\s*finish bonus\s*(?:=|:)?\s*500\s*(?:pts?|points?)?/gi, '+500 Finish Bonus for a correct actual finish-round pick')
  .replace(/Points are awarded based on accurate predictions, such as head punches, body punches, round winners, and knockouts\.\s*Overestimations are not penalized, but only accurate or lower-than-actual predictions earn points\.\s*For example, predicting fewer punches than thrown will still earn points, while predicting more does not\.?/gi, STAT_ACCURACY_SOURCE_TRUTH_COPY)
  .replace(/\s+/g, ' ')
  .trim();

const fallbackFaqs = [
  { title: 'What is Fantasy MMAdness?', description: 'Fantasy MMAdness is a combat-sports prediction platform for boxing, MMA, kickboxing, bare-knuckle, and pro-wrestling experiences. Players predict fight outcomes, compete on leaderboards, and earn platform rewards.' },
  { title: 'How do live fight predictions work?', description: 'Members submit predictions before the lock time on each fight card. The fight page shows the current schedule, prize pool, entry status, and leaderboard access.' },
  { title: 'How does Fantasy MMAdness scoring work?', description: SCORING_SOURCE_TRUTH_COPY },
  { title: 'Can I play for free?', description: 'Yes. Fantasy MMAdness includes free-to-play and demo experiences so players can learn the prediction flow before entering paid token contests.' },
  { title: 'What are tokens?', description: 'Tokens are the platform currency used for paid fight entries. Existing backend wallet and refund behavior remains unchanged.' },
  { title: 'What rewards can I earn?', description: 'Eligible fight cards display their prize pool and entry terms before submission. Players can also earn leaderboard recognition and public profile achievements.' },
];

const normalizeFaq = (item, index) => {
  const fallback = fallbackFaqs[index % fallbackFaqs.length];
  const title = sanitizeFaqCopy(item?.title || item?.question || item?.name || fallback?.title);
  const description = sanitizeFaqCopy(item?.description || item?.answer || item?.content || item?.acceptedAnswer?.text || fallback?.description);
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
        <title>FAQs – Fantasy Boxing Game & League | Fantasy MMAdness</title>
        <meta name="description" content="Answers about Fantasy MMAdness accounts, scoring, fight predictions, tokens, rewards, leagues, and support." />
        <meta name="keywords" content="fantasy boxing, fantasy boxing game, fantasy boxing league, fantasy sports FAQ, Fantasy MMAdness questions" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <div className="experience-page faq-experience-page">
        <ExperienceHero
          eyebrow="Support center"
          title="Answers before"
          accent="the bell."
          description="A premium support library for account access, prediction scoring, wallet tokens, league activity, fight entries, and platform rules."
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
                  <p>Use this guide to understand accounts, predictions, tokens, rewards, leagues, and official scoring before you enter a fight card.</p>
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
