import React from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBolt, FaCalendarAlt, FaChartLine, FaCheckCircle, FaClock, FaFire, FaNewspaper, FaSearch, FaShieldAlt, FaStar, FaTrophy, FaUsers } from 'react-icons/fa';

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

export const SeoStatBar = ({ stats = [] }) => (
  <div className="phase4-statbar">
    {stats.map((stat) => (
      <div key={stat.label}>
        <strong>{stat.value}</strong>
        <span>{stat.label}</span>
      </div>
    ))}
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
    <main className={`phase4-page phase4-page-${config.accent || 'red'}`}>
      <SeoHead title={config.title} description={config.description} keywords={config.keywords} image={`${SITE_URL}${config.heroImage}`} schemas={[schema]} />

      <section className="phase4-hero">
        <div className="phase4-hero-glow" />
        <div className="phase4-hero-copy">
          <p className="phase4-eyebrow"><FaFire /> {config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
          <div className="phase4-hero-actions">
            <Link href="/upcomingfights">Find active fights <FaArrowRight /></Link>
            <Link href="/guides/how-to-play-fantasy-mma" className="phase4-secondary-link">How it works</Link>
          </div>
        </div>
        <div className="phase4-hero-card">
          <img src={config.heroImage} alt={`${config.sport} fantasy fight experience`} loading="eager" decoding="async" />
          <div>
            <span>{config.sport}</span>
            <strong>Fresh fight opportunities</strong>
            <small>Premium prediction contests, content, and campaign pages.</small>
          </div>
        </div>
      </section>

      <SeoStatBar stats={[
        { value: config.sport, label: 'Sport focus' },
        { value: visibleFights.length || 'Live', label: 'Fight opportunities' },
        { value: visibleBlogs.length || 'SEO', label: 'Content paths' },
      ]} />

      <section className="phase4-split-section">
        <div>
          <p className="phase4-eyebrow"><FaBolt /> Why this page exists</p>
          <h2>Dedicated traffic doorway for {config.sport}</h2>
          <p>Instead of sending every search visitor to one generic page, this destination gives {config.sport} fans a clear sport-specific path into fights, guides, blogs, and signup actions.</p>
        </div>
        <div className="phase4-check-grid">
          {config.bullets.map((item) => <span key={item}><FaCheckCircle /> {item}</span>)}
        </div>
      </section>

      <section className="phase4-section-head">
        <p className="phase4-eyebrow"><FaCalendarAlt /> Active cards</p>
        <h2>Latest {config.sport} fight opportunities</h2>
        <p>Cards are pulled from the live fight system when matching sport data exists.</p>
      </section>

      <section className="phase4-card-grid phase4-fight-grid">
        {visibleFights.length ? visibleFights.map((fight) => (
          <article className="phase4-fight-card" key={fight._id || fight.id || getMatchTitle(fight)}>
            <img src={getMatchImage(fight)} alt={getMatchTitle(fight)} loading="lazy" decoding="async" />
            <div>
              <span>{getMatchSport(fight)}</span>
              <h3>{getMatchTitle(fight)}</h3>
              <p><FaClock /> {getMatchDateLabel(fight)}</p>
              <Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight page <FaArrowRight /></Link>
            </div>
          </article>
        )) : (
          <div className="phase4-empty-card">
            <FaSearch />
            <h3>No live {config.sport} fights found yet</h3>
            <p>This page still provides search-friendly content and will show matching fights when they are added from admin.</p>
            <Link href="/upcomingfights">View all upcoming fights</Link>
          </div>
        )}
      </section>

      <section className="phase4-section-head">
        <p className="phase4-eyebrow"><FaNewspaper /> Editorial path</p>
        <h2>Related fight stories and guides</h2>
      </section>
      <section className="phase4-card-grid">
        {visibleBlogs.length ? visibleBlogs.map((blog) => (
          <article className="phase4-story-card" key={blog._id || blog.id || getBlogTitle(blog)}>
            <h3>{getBlogTitle(blog)}</h3>
            <p>{getBlogDescription(blog) || 'Read the full Fantasy MMAdness story.'}</p>
            <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        )) : ['How to play', 'Fight scoring', 'Fantasy strategy'].map((title) => (
          <article className="phase4-story-card" key={title}>
            <h3>{title}</h3>
            <p>Use Fantasy MMAdness guides to understand scoring, picks, and fight-night strategy.</p>
            <Link href="/guides">Open guides <FaArrowRight /></Link>
          </article>
        ))}
      </section>

      <section className="phase4-faq-section">
        <p className="phase4-eyebrow"><FaShieldAlt /> Helpful answers</p>
        <h2>{config.sport} fantasy FAQs</h2>
        <div className="phase4-faq-grid">
          {config.faqs.map(([question, answer]) => (
            <article key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export const FightSeoDetail = ({ fight = {}, relatedBlogs = [] }) => {
  const title = getMatchTitle(fight);
  const description = `${title} fantasy prediction page with schedule, sport context, related fight stories, and calls to play on Fantasy MMAdness.`;
  const path = `/fight/${fight?._id || fight?.id || fight?.matchId || ''}`;
  return (
    <main className="phase4-page phase4-detail-page">
      <SeoHead title={`${title} | Fantasy Fight Prediction Page`} description={description} image={getMatchImage(fight).startsWith('http') ? getMatchImage(fight) : `${SITE_URL}${getMatchImage(fight)}`} schemas={[buildSportsEventSchema(fight, path)]} />
      <section className="phase4-detail-hero">
        <div>
          <p className="phase4-eyebrow"><FaTrophy /> Fight detail</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="phase4-pill-row">
            <span>{getMatchSport(fight)}</span>
            <span>{getMatchDateLabel(fight)}</span>
            <span>{fight.matchStatus || fight.status || 'Status pending'}</span>
          </div>
          <div className="phase4-hero-actions">
            <Link href="/upcomingfights">View active fights <FaArrowRight /></Link>
            <Link href="/playforfree" className="phase4-secondary-link">Play free</Link>
          </div>
        </div>
        <img src={getMatchImage(fight)} alt={title} loading="eager" decoding="async" />
      </section>

      <section className="phase4-matchup-panel">
        <article><span>Corner A</span><h2>{fight.matchFighterA || fight.fighterAName || 'Fighter A'}</h2></article>
        <strong>VS</strong>
        <article><span>Corner B</span><h2>{fight.matchFighterB || fight.fighterBName || 'Fighter B'}</h2></article>
      </section>

      <section className="phase4-section-head">
        <p className="phase4-eyebrow"><FaNewspaper /> Related content</p>
        <h2>Build context before making picks</h2>
      </section>
      <section className="phase4-card-grid">
        {safeArray(relatedBlogs).slice(0, 3).map((blog) => (
          <article className="phase4-story-card" key={blog._id || blog.id || getBlogTitle(blog)}>
            <h3>{getBlogTitle(blog)}</h3>
            <p>{getBlogDescription(blog)}</p>
            <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        ))}
        <article className="phase4-story-card"><h3>How scoring works</h3><p>Review scoring rules before submitting picks.</p><Link href="/guides/how-to-play-fantasy-mma">Open guide <FaArrowRight /></Link></article>
      </section>
    </main>
  );
};

export const FighterProfileSeo = ({ fighter = {}, fights = [], blogs = [], entityType = 'fighter' }) => {
  const name = getEntityName(fighter);
  const title = `${name} ${entityType === 'wrestler' ? 'Wrestler' : 'Fighter'} Profile | Fantasy MMAdness`;
  const path = entityType === 'wrestler' ? `/wrestlers/${fighter._id || fighter.id || name}` : `/fighters/${fighter._id || fighter.id || name}`;
  return (
    <main className="phase4-page phase4-profile-page">
      <SeoHead title={title} description={`${name} profile, fight opportunities, related stories, and fantasy prediction context on Fantasy MMAdness.`} image={getEntityImage(fighter).startsWith('http') ? getEntityImage(fighter) : `${SITE_URL}${getEntityImage(fighter)}`} schemas={[buildPersonSchema(fighter, path)]} />
      <section className="phase4-profile-hero">
        <img src={getEntityImage(fighter)} alt={name} loading="eager" decoding="async" />
        <div>
          <p className="phase4-eyebrow"><FaUsers /> {entityType === 'wrestler' ? 'Wrestler profile' : 'Fighter profile'}</p>
          <h1>{name}</h1>
          <p>{truncate(fighter.description || fighter.bio || `${name} is part of the Fantasy MMAdness combat-sports ecosystem.`, 260)}</p>
          <div className="phase4-pill-row"><span>{fighter.category || fighter.sport || fighter.weightClass || 'Combat sports'}</span><span>{safeArray(fights).length} related fights</span></div>
        </div>
      </section>

      <section className="phase4-section-head"><p className="phase4-eyebrow"><FaCalendarAlt /> Related opportunities</p><h2>Fights and stories connected to {name}</h2></section>
      <section className="phase4-card-grid">
        {safeArray(fights).slice(0, 4).map((fight) => (
          <article className="phase4-story-card" key={fight._id || fight.id || getMatchTitle(fight)}>
            <h3>{getMatchTitle(fight)}</h3>
            <p>{getMatchSport(fight)} · {getMatchDateLabel(fight)}</p>
            <Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight <FaArrowRight /></Link>
          </article>
        ))}
        {safeArray(blogs).slice(0, 2).map((blog) => (
          <article className="phase4-story-card" key={blog._id || blog.id || getBlogTitle(blog)}>
            <h3>{getBlogTitle(blog)}</h3>
            <p>{getBlogDescription(blog)}</p>
            <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        ))}
      </section>
    </main>
  );
};

export const BlogCategorySeoPage = ({ category = 'mma', blogs = [], fights = [] }) => {
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const description = `${label} fight stories, fantasy strategy, previews, results, and related opportunities on Fantasy MMAdness.`;
  return (
    <main className="phase4-page phase4-editorial-page">
      <SeoHead title={`${label} Fight Blogs & Fantasy Strategy | Fantasy MMAdness`} description={description} image={`${SITE_URL}/images/fmm-pages/editorial-arena-hd.webp`} schemas={[buildArticleSchema({ title: `${label} blog category`, description }, `/blogs/${category}`)]} />
      <section className="phase4-hero phase4-editorial-hero">
        <div className="phase4-hero-copy"><p className="phase4-eyebrow"><FaNewspaper /> Blog category</p><h1>{label} fight intelligence</h1><p>{description}</p></div>
      </section>
      <section className="phase4-card-grid">
        {safeArray(blogs).length ? safeArray(blogs).map((blog) => (
          <article className="phase4-story-card" key={blog._id || blog.id || getBlogTitle(blog)}>
            <h3>{getBlogTitle(blog)}</h3>
            <p>{getBlogDescription(blog)}</p>
            <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
          </article>
        )) : <div className="phase4-empty-card"><FaSearch /><h3>No {label} posts yet</h3><p>This category page is ready to index new stories when blogs are approved.</p><Link href="/blogs">View all blogs</Link></div>}
      </section>
      <section className="phase4-section-head"><p className="phase4-eyebrow"><FaStar /> Related fight cards</p><h2>Fresh fight opportunities</h2></section>
      <section className="phase4-card-grid">
        {safeArray(fights).slice(0, 3).map((fight) => <article className="phase4-story-card" key={fight._id || getMatchTitle(fight)}><h3>{getMatchTitle(fight)}</h3><p>{getMatchDateLabel(fight)}</p><Link href={`/fight/${fight._id || fight.id || fight.matchId}`}>Open fight <FaArrowRight /></Link></article>)}
      </section>
    </main>
  );
};

export const GuideSeoPage = ({ guide }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: safeArray(guide.faqs).map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };
  return (
    <main className="phase4-page phase4-guide-page">
      <SeoHead title={guide.title} description={guide.description} image={`${SITE_URL}${guide.image}`} schemas={[schema]} />
      <section className="phase4-detail-hero">
        <div><p className="phase4-eyebrow"><FaChartLine /> Fantasy guide</p><h1>{guide.title}</h1><p>{guide.description}</p><div className="phase4-hero-actions"><Link href="/upcomingfights">Find fights <FaArrowRight /></Link><Link href="/playforfree" className="phase4-secondary-link">Start free</Link></div></div>
        <img src={guide.image} alt={guide.title} loading="eager" decoding="async" />
      </section>
      <section className="phase4-guide-steps">
        {safeArray(guide.steps).map((step, index) => <article key={step.title}><strong>{String(index + 1).padStart(2, '0')}</strong><h3>{step.title}</h3><p>{step.copy}</p></article>)}
      </section>
      <section className="phase4-faq-section"><p className="phase4-eyebrow"><FaShieldAlt /> Common questions</p><h2>Guide FAQs</h2><div className="phase4-faq-grid">{safeArray(guide.faqs).map(([q, a]) => <article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
    </main>
  );
};
