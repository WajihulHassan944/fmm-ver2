import React from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaNewspaper,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

import SeoHead from '@/Components/SEO/SeoHead';
import {
  buildArticleSchema,
  buildPersonSchema,
  buildSportsEventSchema,
  cleanText,
  getBlogDescription,
  getBlogTitle,
  getEntityImage,
  getEntityName,
  getMatchDateLabel,
  getMatchImage,
  getMatchSport,
  getMatchTitle,
} from '@/Utils/phase4SeoPages';
import { SITE_URL } from '@/Utils/seoConfig';

const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const truncate = (value = '', max = 150) => cleanText(value).slice(0, max);
const entityId = (value = {}) => value._id || value.id || value.matchId || value.slug || getEntityName(value) || getMatchTitle(value);

export const SeoStatBar = ({ stats = [] }) => (
  <div className="phase4-statbar">
    {safeArray(stats).map((stat) => (
      <div key={stat.label}>
        <strong>{stat.value}</strong>
        <span>{stat.label}</span>
      </div>
    ))}
  </div>
);

const PageShell = ({ children, className = '', accent = 'red' }) => (
  <main className={`phase4-page phase4-page-${accent || 'red'} ${className}`}>{children}</main>
);

const PremiumHero = ({ eyebrow, title, description, image, children, accentIcon: Icon = FaFire }) => (
  <section className="phase4-premium-hero">
    <div className="phase4-premium-copy">
      <p className="phase4-eyebrow"><Icon /> {eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
    <div className="phase4-premium-visual" aria-hidden={!image}>
      {image ? <img src={image} alt={title} loading="eager" decoding="async" /> : null}
      <span className="phase4-premium-vs">VS</span>
    </div>
  </section>
);

const EmptyCard = ({ title, copy, href = '/upcomingfights', linkLabel = 'View fights' }) => (
  <div className="phase4-empty-card">
    <FaSearch />
    <h3>{title}</h3>
    <p>{copy}</p>
    <Link href={href}>{linkLabel} <FaArrowRight /></Link>
  </div>
);

export const PremiumSportLanding = ({ config, fights = [], blogs = [] }) => {
  const visibleFights = safeArray(fights).slice(0, 6);
  const visibleBlogs = safeArray(blogs).slice(0, 3);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.title,
    url: `${SITE_URL}/${config.slug}`,
    description: config.description,
    about: config.sport,
  };

  return (
    <PageShell className="phase4-sport-page" accent={config.accent}>
      <SeoHead title={config.title} description={config.description} keywords={config.keywords} image={`${SITE_URL}${config.heroImage}`} schemas={[schema]} />

      <PremiumHero eyebrow={config.eyebrow} title={config.title} description={config.description} image={config.heroImage}>
        <div className="phase4-hero-actions">
          <Link href="/upcomingfights">Find active fights <FaArrowRight /></Link>
          <Link href="/guides/how-to-play-fantasy-mma" className="phase4-secondary-link">How it works</Link>
        </div>
      </PremiumHero>

      <SeoStatBar stats={[
        { value: config.sport, label: 'Sport focus' },
        { value: visibleFights.length || 'Ready', label: 'Fight cards' },
        { value: visibleBlogs.length || 'Live', label: 'Story paths' },
      ]} />

      <section className="phase4-premium-panel phase4-content-brief">
        <div>
          <p className="phase4-eyebrow"><FaBolt /> Why this matters</p>
          <h2>A dedicated destination for {config.sport} fans</h2>
          <p>Each sport page now gives visitors a focused way to discover relevant fights, learn the format, and move into active prediction opportunities without landing on a generic page.</p>
        </div>
        <div className="phase4-check-grid">
          {safeArray(config.bullets).slice(0, 6).map((item) => <span key={item}><FaCheckCircle /> {item}</span>)}
        </div>
      </section>

      <section className="phase4-section-head">
        <p className="phase4-eyebrow"><FaCalendarAlt /> Live opportunities</p>
        <h2>Latest {config.sport} fights</h2>
        <p>Fresh cards from the fight system appear here when they match this sport.</p>
      </section>
      <section className="phase4-card-grid phase4-fight-grid">
        {visibleFights.length ? visibleFights.map((fight) => (
          <article className="phase4-fight-card" key={entityId(fight)}>
            <img src={getMatchImage(fight)} alt={getMatchTitle(fight)} loading="lazy" decoding="async" />
            <div>
              <span>{getMatchSport(fight)}</span>
              <h3>{getMatchTitle(fight)}</h3>
              <p><FaClock /> {getMatchDateLabel(fight)}</p>
              <Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight <FaArrowRight /></Link>
            </div>
          </article>
        )) : <EmptyCard title={`No live ${config.sport} fights found yet`} copy="This page is ready and will populate as matching fight cards are added from admin." />}
      </section>

      <section className="phase4-section-head">
        <p className="phase4-eyebrow"><FaNewspaper /> Learn and play</p>
        <h2>Related stories and guides</h2>
      </section>
      <section className="phase4-card-grid">
        {visibleBlogs.length ? visibleBlogs.map((blog) => (
          <article className="phase4-story-card" key={entityId(blog)}>
            <h3>{getBlogTitle(blog)}</h3>
            <p>{getBlogDescription(blog) || 'Read the latest Fantasy MMAdness story.'}</p>
            <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        )) : ['How to play', 'Scoring basics', 'Fight-night strategy'].map((title) => (
          <article className="phase4-story-card" key={title}>
            <h3>{title}</h3>
            <p>Learn how picks, scoring, and fight opportunities work on Fantasy MMAdness.</p>
            <Link href="/guides">Open guides <FaArrowRight /></Link>
          </article>
        ))}
      </section>

      <section className="phase4-faq-section">
        <p className="phase4-eyebrow"><FaShieldAlt /> Quick answers</p>
        <h2>{config.sport} FAQs</h2>
        <div className="phase4-faq-grid">
          {safeArray(config.faqs).map(([question, answer]) => (
            <article key={question}><h3>{question}</h3><p>{answer}</p></article>
          ))}
        </div>
      </section>
    </PageShell>
  );
};

export const FightSeoDetail = ({ fight = {}, relatedBlogs = [] }) => {
  const title = getMatchTitle(fight);
  const description = `${title} fantasy prediction page with schedule, sport context, related stories, and calls to play on Fantasy MMAdness.`;
  const path = `/fight/${fight?._id || fight?.id || fight?.matchId || ''}`;
  return (
    <PageShell className="phase4-detail-page">
      <SeoHead title={`${title} | Fantasy Fight Prediction Page`} description={description} image={getMatchImage(fight).startsWith('http') ? getMatchImage(fight) : `${SITE_URL}${getMatchImage(fight)}`} schemas={[buildSportsEventSchema(fight, path)]} />
      <PremiumHero eyebrow="Fight detail" title={title} description={description} image={getMatchImage(fight)} accentIcon={FaTrophy}>
        <div className="phase4-pill-row">
          <span>{getMatchSport(fight)}</span>
          <span>{getMatchDateLabel(fight)}</span>
          <span>{fight.matchStatus || fight.status || 'Status pending'}</span>
        </div>
        <div className="phase4-hero-actions">
          <Link href="/upcomingfights">View active fights <FaArrowRight /></Link>
          <Link href="/playforfree" className="phase4-secondary-link">Play free</Link>
        </div>
      </PremiumHero>

      <section className="phase4-matchup-panel">
        <article><span>Corner A</span><h2>{fight.matchFighterA || fight.fighterAName || 'Fighter A'}</h2></article>
        <strong>VS</strong>
        <article><span>Corner B</span><h2>{fight.matchFighterB || fight.fighterBName || 'Fighter B'}</h2></article>
      </section>

      <section className="phase4-section-head"><p className="phase4-eyebrow"><FaNewspaper /> Related content</p><h2>Build context before making picks</h2></section>
      <section className="phase4-card-grid">
        {safeArray(relatedBlogs).slice(0, 3).map((blog) => (
          <article className="phase4-story-card" key={entityId(blog)}>
            <h3>{getBlogTitle(blog)}</h3><p>{getBlogDescription(blog)}</p><Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        ))}
        <article className="phase4-story-card"><h3>How scoring works</h3><p>Review scoring rules before submitting picks.</p><Link href="/guides/how-to-play-fantasy-mma">Open guide <FaArrowRight /></Link></article>
      </section>
    </PageShell>
  );
};

export const FighterProfileSeo = ({ fighter = {}, fights = [], blogs = [], entityType = 'fighter' }) => {
  const name = getEntityName(fighter);
  const title = `${name} ${entityType === 'wrestler' ? 'Wrestler' : 'Fighter'} Profile | Fantasy MMAdness`;
  const path = entityType === 'wrestler' ? `/wrestlers/${fighter._id || fighter.id || name}` : `/fighters/${fighter._id || fighter.id || name}`;
  return (
    <PageShell className="phase4-profile-page" accent={entityType === 'wrestler' ? 'purple' : 'red'}>
      <SeoHead title={title} description={`${name} profile, fight opportunities, related stories, and fantasy prediction context on Fantasy MMAdness.`} image={getEntityImage(fighter).startsWith('http') ? getEntityImage(fighter) : `${SITE_URL}${getEntityImage(fighter)}`} schemas={[buildPersonSchema(fighter, path)]} />
      <PremiumHero eyebrow={entityType === 'wrestler' ? 'Wrestler profile' : 'Fighter profile'} title={name} description={`${name} appears in Fantasy MMAdness fight cards, content, and prediction opportunities.`} image={getEntityImage(fighter)} accentIcon={FaUsers}>
        <div className="phase4-hero-actions"><Link href="/upcomingfights">Find fights <FaArrowRight /></Link><Link href="/fights-news" className="phase4-secondary-link">Fight news</Link></div>
      </PremiumHero>
      <section className="phase4-card-grid">
        {safeArray(fights).slice(0, 3).map((fight) => <article className="phase4-story-card" key={entityId(fight)}><h3>{getMatchTitle(fight)}</h3><p>{getMatchDateLabel(fight)}</p><Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight <FaArrowRight /></Link></article>)}
        {safeArray(blogs).slice(0, 3).map((blog) => <article className="phase4-story-card" key={entityId(blog)}><h3>{getBlogTitle(blog)}</h3><p>{truncate(getBlogDescription(blog), 130)}</p><Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link></article>)}
        {!safeArray(fights).length && !safeArray(blogs).length && <EmptyCard title="Profile content is ready" copy="Related fights and stories will appear here as the platform grows." href="/upcomingfights" />}
      </section>
    </PageShell>
  );
};

export const BlogCategorySeoPage = ({ category = 'fight-news', blogs = [], fights = [] }) => {
  const label = String(category || 'fight news').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const description = `${label} articles, fantasy fight previews, strategy, and platform updates from Fantasy MMAdness.`;
  return (
    <PageShell className="phase4-editorial-page" accent="steel">
      <SeoHead title={`${label} Blogs | Fantasy MMAdness`} description={description} schemas={[buildArticleSchema({ title: `${label} Blog Category`, description }, `/blogs/${category}`)]} />
      <PremiumHero eyebrow="Blog category" title={`${label} intelligence`} description={description} image="/images/fmm-experience/fighter-action-red.jpg" accentIcon={FaNewspaper} />
      <section className="phase4-card-grid">
        {safeArray(blogs).length ? safeArray(blogs).map((blog) => (
          <article className="phase4-story-card" key={entityId(blog)}><h3>{getBlogTitle(blog)}</h3><p>{getBlogDescription(blog)}</p><Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link></article>
        )) : <EmptyCard title={`No ${label} posts yet`} copy="This category is ready for approved stories and future swarm content." href="/blogs" linkLabel="View blogs" />}
      </section>
      <section className="phase4-section-head"><p className="phase4-eyebrow"><FaStar /> Related fight cards</p><h2>Fresh fight opportunities</h2></section>
      <section className="phase4-card-grid">
        {safeArray(fights).slice(0, 3).map((fight) => <article className="phase4-story-card" key={entityId(fight)}><h3>{getMatchTitle(fight)}</h3><p>{getMatchDateLabel(fight)}</p><Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight <FaArrowRight /></Link></article>)}
      </section>
    </PageShell>
  );
};

export const GuideSeoPage = ({ guide }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: safeArray(guide.faqs).map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };
  return (
    <PageShell className="phase4-guide-page" accent="red">
      <SeoHead title={guide.title} description={guide.description} image={`${SITE_URL}${guide.image}`} schemas={[schema]} />
      <PremiumHero eyebrow="Fantasy guide" title={guide.title} description={guide.description} image="/images/fmm-experience/fighter-action-blue.jpg" accentIcon={FaShieldAlt}>
        <div className="phase4-hero-actions"><Link href="/upcomingfights">Find fights <FaArrowRight /></Link><Link href="/playforfree" className="phase4-secondary-link">Start free</Link></div>
      </PremiumHero>
      <section className="phase4-guide-steps">
        {safeArray(guide.steps).map((step, index) => <article key={step.title}><strong>{String(index + 1).padStart(2, '0')}</strong><h3>{step.title}</h3><p>{step.copy}</p></article>)}
      </section>
      <section className="phase4-faq-section"><p className="phase4-eyebrow"><FaShieldAlt /> Common questions</p><h2>Quick guide FAQs</h2><div className="phase4-faq-grid">{safeArray(guide.faqs).map(([q, a]) => <article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
    </PageShell>
  );
};
