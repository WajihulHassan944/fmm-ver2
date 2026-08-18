import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const BlogDetails = () => {
  const router = useRouter();
  const { blogId } = router.query;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!blogId) return;

    const fetchBlogDetails = async () => {
      try {
        const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/blogs/${blogId}`);
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error('Error fetching blog details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [blogId]);

  if (loading) return <div className="adminBlogDetails-loading">Loading...</div>;
  if (!blog) return <div className="adminBlogDetails-empty">No blog found.</div>;

  return (
    <div className="adminBlogDetails addNewMatch">
      <h1 className="adminBlogDetails-title">Details of Blog: {blog.metaTitle}</h1>
      <p className="adminBlogDetails-description">{blog.metaDescription}</p>

      <div className="adminBlogDetails-header">
        <h2 className="adminBlogDetails-headerText">{blog.header}</h2>
        <img
          src={blog.blogHeaderImage}
          alt="Blog Header"
          className="adminBlogDetails-headerImage"
        />
      </div>

      {blog.sections.map((section, sectionIdx) => (
        <div key={section._id} className="adminBlogDetails-section">
          <h3 className="adminBlogDetails-sectionTitle">Section {sectionIdx + 1}: {section.title}</h3>
          <p className="adminBlogDetails-sectionContent">{section.content}</p>
          <img
            src={section.image}
            alt={`Section ${sectionIdx + 1}`}
            className="adminBlogDetails-sectionImage"
          />

          {section.headings.map((heading) => (
            <div key={heading._id} className="adminBlogDetails-heading">
              <h4 className="adminBlogDetails-headingTitle">{heading.title}</h4>
              <p className="adminBlogDetails-headingContent">{heading.content}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BlogDetails;
