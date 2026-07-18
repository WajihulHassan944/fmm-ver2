import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaBolt,
  FaChevronDown,
  FaNewspaper,
  FaSearch,
  FaShieldAlt,
} from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const NEWS_API = buildPublicApiUrl('/news');

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchNews = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(NEWS_API);
        if (!response.ok) throw new Error(`News request failed with status ${response.status}`);
        const payload = await response.json();
        if (active) setNews(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        console.error('Error fetching news:', requestError);
        if (active) setError('The latest fight headlines could not be loaded right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNews();
    return () => {
      active = false;
    };
  }, []);

  const visibleNews = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return news;
    return news.filter((article) => `${article?.title || ''} ${article?.description || ''}`.toLowerCase().includes(needle));
  }, [news, query]);

  const toggleNews = (index) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="premium-news-phase-two">
      <div className="premium-news-phase-two-glow" aria-hidden="true" />
      <div className="theme-container premium-news-phase-two-shell">
        <header className="premium-news-phase-two-header">
          <div>
            <p className="xp-eyebrow"><FaBolt /> Arena intelligence</p>
            <h2>Headlines that move the fight card.</h2>
            <p>
              Open every story without leaving the page, search the live feed, and follow the original
              source whenever an external article link is available.
            </p>
          </div>
          <label>
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fight news"
              aria-label="Search fight news"
            />
            <span>{visibleNews.length} stories</span>
          </label>
        </header>

        <div className="premium-news-phase-two-grid">
          <aside className="premium-news-phase-two-feature">
            <div className="premium-news-phase-two-feature-copy">
              <span><FaNewspaper /> Live editorial feed</span>
              <h3>Stay ready before the opening bell.</h3>
              <p>
                Event changes, combat-sports headlines, and platform updates remain connected to the
                existing news endpoint.
              </p>
              <div>
                <strong>{news.length}</strong>
                <small>Current headlines</small>
              </div>
            </div>
          </aside>

          <div className="premium-news-phase-two-list">
            {loading ? (
              <div className="premium-news-phase-two-state"><FaNewspaper /><strong>Loading fight news…</strong></div>
            ) : error ? (
              <div className="premium-news-phase-two-state is-error"><FaShieldAlt /><strong>{error}</strong></div>
            ) : visibleNews.length ? (
              visibleNews.map((article, index) => {
                const isOpen = activeIndex === index;
                return (
                  <article className={isOpen ? 'is-open' : ''} key={article?._id || `${article?.title}-${index}`}>
                    <button type="button" onClick={() => toggleNews(index)} aria-expanded={isOpen}>
                      <span className="premium-news-phase-two-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="premium-news-phase-two-title">
                        <small>{article?.source === 'rss' ? 'External fight report' : 'Fantasy MMAdness update'}</small>
                        <strong>{article?.title || 'Latest fight update'}</strong>
                      </span>
                      <FaChevronDown aria-hidden="true" />
                    </button>
                    <div className="premium-news-phase-two-body">
                      <p>{article?.description || 'Open the full report for the latest fight update.'}</p>
                      {article?.source === 'rss' && article?.link && (
                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                          Read original report <FaArrowRight />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="premium-news-phase-two-state"><FaSearch /><strong>No headlines match this search.</strong></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsFeed;
