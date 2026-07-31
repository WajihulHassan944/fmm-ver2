import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaCalendarAlt, FaNewspaper, FaSearch } from 'react-icons/fa';

import { fetchPublicBlogs } from '@/Utils/publicApi';
const cleanText = (value = '') => String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const storyTitle = (blog) => blog?.metaTitle || blog?.header || blog?.title || 'Fight story';
const storyDescription = (blog) => cleanText(blog?.metaDescription || blog?.description || blog?.sections?.[0]?.content || '').slice(0, 250);
const storyDate = (blog) => blog?.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Latest publication';
const storyImage = (blog) => blog?.blogHeaderImage || blog?.image || '/images/fmm-pages/editorial-arena-hd.webp';

export default function BlogsPage({ blogs = [], pagination = {} }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = Array.isArray(blogs) ? blogs : [];
    if (!normalized) return rows;
    return rows.filter((blog) => `${storyTitle(blog)} ${storyDescription(blog)}`.toLowerCase().includes(normalized));
  }, [blogs, query]);
  const featured = visible[0];
  const remaining = visible.slice(1);

  return (
    <div className="xp-editorial-shell premium-blogs-phase-two">
      <Head>
        <title>Fight Intelligence | Fantasy MMAdness</title>
        <meta name="description" content="Fight previews, combat-sports analysis, Fantasy MMAdness updates, and prediction strategy." />
      </Head>

      <section className="xp-editorial-toolbar">
        <div>
          <p className="xp-eyebrow"><FaNewspaper /> Editorial desk</p>
          <h2>Latest stories and fight intelligence</h2>
          <p>Previews, platform updates, scoring explainers, and combat-sports analysis in the new fight-night reading experience.</p>
        </div>
        <label><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
      </section>

      {!visible.length ? (
        <div className="xp-editorial-empty"><FaSearch /><h3>No stories match this search</h3><p>Clear the search or return when the next editorial piece is published.</p></div>
      ) : (
        <>
          {featured && (
            <article className="xp-featured-story">
              <div className="xp-featured-story-image"><img src={storyImage(featured)} alt={storyTitle(featured)} loading="eager" decoding="async" /></div>
              <div>
                <span>Featured story</span>
                <h2>{storyTitle(featured)}</h2>
                <p>{storyDescription(featured) || 'Open the full story for fight analysis and platform perspective.'}</p>
                <small><FaCalendarAlt /> {storyDate(featured)}</small>
                <Link href={`/blog-details/${featured._id || featured.id}`}>Read full story <FaArrowRight /></Link>
              </div>
            </article>
          )}

          <section className="xp-story-grid">
            {remaining.map((blog) => (
              <article className="xp-story-card" key={blog._id || blog.id || storyTitle(blog)}>
                <div><img src={storyImage(blog)} alt={storyTitle(blog)} loading="lazy" decoding="async" /></div>
                <span>{storyDate(blog)}</span>
                <h3>{storyTitle(blog)}</h3>
                <p>{storyDescription(blog).slice(0, 150) || 'Read the full Fantasy MMAdness story.'}</p>
                <Link href={`/blog-details/${blog._id || blog.id}`}>Read story <FaArrowRight /></Link>
              </article>
            ))}
          </section>
          {Number(pagination?.pages || 0) > 1 && (
            <div className="xp-editorial-pagination" aria-label="Blog pagination summary">
              Page {pagination.page || 1} of {pagination.pages} · {pagination.total || visible.length} stories indexed
            </div>
          )}
        </>
      )}
    </div>
  );
}

export async function getServerSideProps({ query, res }) {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const page = Number(query?.page || 1);
    const { rows: blogs, pagination } = await fetchPublicBlogs({ page, limit: 24 });
    return { props: { blogs: JSON.parse(JSON.stringify(blogs)), pagination: JSON.parse(JSON.stringify(pagination || {})) } };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return { props: { blogs: [], pagination: {} } };
  }
}
