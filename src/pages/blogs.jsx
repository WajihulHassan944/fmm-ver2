import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaCalendarAlt, FaNewspaper, FaSearch } from 'react-icons/fa';

import { fetchPublicBlogs } from '@/Utils/publicApi';

const stripUnsafeBlogText = (value = '') => String(value || '')
  .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, ' ')
  .replace(/\b[A-Za-z0-9+/]{180,}={0,2}\b/g, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/Fantasy\s*MMADNESS/g, 'Fantasy MMAdness')
  .replace(/Fantasy\s*MMadness/g, 'Fantasy MMAdness')
  .replace(/FantasyMMAdness/g, 'Fantasy MMAdness')
  .replace(/Fantasy-MMadness/g, 'Fantasy MMAdness')
  .replace(/\s+/g, ' ')
  .trim();

const isSafeBlogImage = (value) => {
  const src = String(value || '').trim();
  if (!src || src.length > 500) return false;
  if (/^data:/i.test(src) || /base64/i.test(src)) return false;
  return /^https?:\/\//i.test(src) || src.startsWith('/');
};

const sanitizeBlogRow = (blog = {}, index = 0) => ({
  ...blog,
  _id: blog?._id || blog?.id || `story-${index}`,
  title: stripUnsafeBlogText(blog?.title || blog?.header || blog?.metaTitle || blog?.name).slice(0, 140),
  header: stripUnsafeBlogText(blog?.header || blog?.title || blog?.metaTitle || blog?.name).slice(0, 140),
  description: stripUnsafeBlogText(blog?.description || blog?.excerpt || blog?.metaDescription || blog?.sections?.[0]?.content || blog?.content || blog?.body).slice(0, 260),
  metaDescription: stripUnsafeBlogText(blog?.metaDescription || blog?.description || blog?.excerpt || blog?.sections?.[0]?.content).slice(0, 260),
  blogHeaderImage: isSafeBlogImage(blog?.blogHeaderImage) ? blog.blogHeaderImage : undefined,
  image: isSafeBlogImage(blog?.image) ? blog.image : undefined,
  imageUrl: isSafeBlogImage(blog?.imageUrl) ? blog.imageUrl : undefined,
  featuredImage: isSafeBlogImage(blog?.featuredImage) ? blog.featuredImage : undefined,
  href: blog?.href,
  createdAt: blog?.createdAt,
});

const cleanText = (value = '') => stripUnsafeBlogText(value);
const storyTitle = (blog) => stripUnsafeBlogText(blog?.metaTitle || blog?.header || blog?.title || 'Fight story') || 'Fight story';
const storyDescription = (blog) => cleanText(blog?.metaDescription || blog?.description || blog?.sections?.[0]?.content || '').slice(0, 250);
const storyDate = (blog) => blog?.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Latest publication';
const storyImage = (blog) => {
  const candidates = [blog?.blogHeaderImage, blog?.image, blog?.imageUrl, blog?.featuredImage];
  return candidates.find(isSafeBlogImage) || '/images/fmm-pages/premium-duel-banner.webp';
};

const storyHref = (blog) => {
  if (blog?.href) return blog.href;
  const id = String(blog?._id || blog?.id || '').trim();
  if (!id || id.startsWith('fallback-')) return '/blogs';
  return `/blog-details/${id}`;
};

const FALLBACK_BLOGS = [
  {
    _id: 'fallback-main-event-preview',
    title: 'Fight IQ Preview: Reading the Main Event',
    metaDescription: 'A practical Fantasy MMAdness preview explaining how to compare styles, timing, activity, and finishing risk before submitting predictions.',
    image: '/images/home-premium/fight-action-clash.webp',
    createdAt: '2026-07-28T00:00:00.000Z',
    href: '/upcomingfights',
  },
  {
    _id: 'fallback-scoring-guide',
    title: 'Fantasy MMAdness Scoring: KO, Round Win, Survival, and Round Loss',
    metaDescription: 'A concise guide to the unified combat scoring rules used across the player guide, FAQ, and homepage scoring preview.',
    image: '/images/fmm-pages/premium-arena-banner.webp',
    createdAt: '2026-07-28T00:00:00.000Z',
    href: '/guides',
  },
  {
    _id: 'fallback-leagues',
    title: 'How Fantasy Leagues Build Fight-Night Communities',
    metaDescription: 'How creator-led leagues, leaderboards, and head-to-head prediction rooms help players compete together across combat sports.',
    image: '/images/fmm-pages/league-arena-hd.webp',
    createdAt: '2026-07-28T00:00:00.000Z',
    href: '/FantasyLeagues',
  },
];

export default function BlogsPage({ blogs = [], pagination = {} }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = Array.isArray(blogs) && blogs.length ? blogs : FALLBACK_BLOGS;
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
        <div className="xp-editorial-empty"><FaSearch /><h3>No stories match this search</h3><p>Clear the search to return to the latest Fantasy MMAdness stories.</p></div>
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
                <Link href={storyHref(featured)}>Read full story <FaArrowRight /></Link>
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
                <Link href={storyHref(blog)}>Read story <FaArrowRight /></Link>
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
    return { props: { blogs: JSON.parse(JSON.stringify((Array.isArray(blogs) ? blogs : []).map((blog, index) => sanitizeBlogRow(blog, index)))), pagination: JSON.parse(JSON.stringify(pagination || {})) } };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return { props: { blogs: [], pagination: {} } };
  }
}
