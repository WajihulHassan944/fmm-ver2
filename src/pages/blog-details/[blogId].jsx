import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaCalendarAlt, FaClock, FaListUl, FaNewspaper } from 'react-icons/fa';

const API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';
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
      <Head><title>{title} | Fantasy MMAdness</title><meta name="description" content={blog.metaDescription || title} /></Head>
      <header className="xp-article-header">
        <p className="xp-eyebrow"><FaNewspaper /> Fantasy MMAdness editorial</p>
        <h2>{title}</h2>
        {blog.metaDescription && <p>{blog.metaDescription}</p>}
        <div><span><FaCalendarAlt /> {published}</span><span><FaClock /> {readTime} min read</span><Link href="/blogs">All stories <FaArrowRight /></Link></div>
      </header>

      {blog.blogHeaderImage && <div className="xp-article-image"><img src={blog.blogHeaderImage} alt={title} /></div>}

      {sections.length > 0 && (
        <aside className="xp-article-toc"><strong><FaListUl /> Table of contents</strong>{sections.map((section, index) => <a href={`#section-${index}`} key={section._id || section.title || index}>{section.title || `Section ${index + 1}`}</a>)}</aside>
      )}

      <div className="xp-article-content">
        {sections.map((section, index) => (
          <section id={`section-${index}`} key={section._id || section.title || index}>
            {section.title && <h3>{section.title}</h3>}
            {section.content && <p>{cleanText(section.content)}</p>}
            {section.image && <img src={section.image} alt={section.title || title} />}
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

export async function getServerSideProps({ params }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${params.blogId}`);
    if (!response.ok) throw new Error('Not found');
    const data = await response.json();
    return { props: { blog: JSON.parse(JSON.stringify(data?.data || data)) } };
  } catch (error) {
    console.error('Error fetching blog:', error);
    return { props: { blog: null } };
  }
}
