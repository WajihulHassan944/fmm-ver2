import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaCalendarAlt, FaClock, FaListUl, FaNewspaper } from 'react-icons/fa';

import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';
const cleanText = (value = '') => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (blog) => [blog?.metaDescription, ...(blog?.sections || []).flatMap((section) => [section.content, ...(section.headings || []).map((heading) => heading.content)])].filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length;

export default function BlogDetailsPage({ blog }) {
  if (!blog) return <div className="xp-article-not-found"><FaNewspaper /><h2>Story not found</h2><p>This article may have been moved or unpublished.</p><Link href="/blogs">Return to stories <FaArrowRight /></Link></div>;
  const sections = Array.isArray(blog.sections) ? blog.sections : [];
  const title = blog.header || blog.metaTitle || blog.title || 'Fight intelligence';
  const published = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Fantasy MMAdness';
  const readTime = Math.max(1, Math.ceil(words(blog) / 220));

  return (
    <article className="xp-article-shell">
      <Head>
        <title>{title} | Fantasy MMAdness</title>
        <meta name="description" content={blog.metaDescription || title} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${title} | Fantasy MMAdness`} />
        <meta property="og:description" content={blog.metaDescription || title} />
        {blog.blogHeaderImage && <meta property="og:image" content={blog.blogHeaderImage} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: title,
              description: blog.metaDescription || title,
              image: blog.blogHeaderImage ? [blog.blogHeaderImage] : undefined,
              datePublished: blog.createdAt,
              dateModified: blog.updatedAt || blog.createdAt,
              author: { '@type': 'Organization', name: 'Fantasy MMAdness' },
              publisher: {
                '@type': 'Organization',
                name: 'Fantasy MMAdness',
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/fmm-experience/fantasy-mmadness-logo.webp` },
              },
            }),
          }}
        />
      </Head>
      <header className="xp-article-header">
        <p className="xp-eyebrow"><FaNewspaper /> Fantasy MMAdness editorial</p>
        <h2>{title}</h2>
        {blog.metaDescription && <p>{blog.metaDescription}</p>}
        <div><span><FaCalendarAlt /> {published}</span><span><FaClock /> {readTime} min read</span><Link href="/blogs">All stories <FaArrowRight /></Link></div>
      </header>

      {blog.blogHeaderImage && <div className="xp-article-image"><img src={blog.blogHeaderImage} alt={title} loading="eager" decoding="async" /></div>}

      {sections.length > 0 && (
        <aside className="xp-article-toc"><strong><FaListUl /> Table of contents</strong>{sections.map((section, index) => <a href={`#section-${index}`} key={section._id || section.title || index}>{section.title || `Section ${index + 1}`}</a>)}</aside>
      )}

      <div className="xp-article-content">
        {sections.map((section, index) => (
          <section id={`section-${index}`} key={section._id || section.title || index}>
            {section.title && <h3>{section.title}</h3>}
            {section.content && <p>{cleanText(section.content)}</p>}
            {section.image && <img src={section.image} alt={section.title || title} loading="lazy" decoding="async" />}
            {Array.isArray(section.headings) && section.headings.map((heading) => (
              <div className="xp-article-subsection" key={heading._id || heading.title}>
                {heading.title && <h4>{heading.title}</h4>}
                {heading.content && <p>{cleanText(heading.content)}</p>}
              </div>
            ))}
          </section>
        ))}
        {!sections.length && <p>{cleanText(blog.metaDescription) || 'This story does not have published sections yet.'}</p>}
      </div>
    </article>
  );
}

export async function getServerSideProps({ params, res }) {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/public/blogs/${params.blogId}`).catch(() => null);
    const fallbackResponse = !response || !response.ok ? await fetch(`${PUBLIC_API_BASE_URL}/api/blogs/${params.blogId}`) : response;
    const finalResponse = fallbackResponse || response;
    if (!finalResponse.ok) throw new Error('Not found');
    const data = await finalResponse.json();
    return { props: { blog: JSON.parse(JSON.stringify(data?.data || data)) } };
  } catch (error) {
    console.error('Error fetching blog:', error);
    return { props: { blog: null } };
  }
}
