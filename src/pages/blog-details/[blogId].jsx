import { useRouter } from 'next/router';
import React from 'react';

const index = ({ blog }) => {
  const router = useRouter();

  if (!blog) return <div className="blogsWrapper">No blog found.</div>;

  return (
    <div className="blogsWrapper" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="blogDetailsCard">
          <div className="blogDetailsCardHeader">
            {new Date(blog.createdAt).toLocaleString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
              timeZone: 'America/New_York',
            })}
          </div>

          <div className="blogDetailsCardMain">
            <h1>{blog.header}</h1>
            {blog.metaDescription && <p>{blog.metaDescription}</p>}
            <p>brought to you by</p>
            <p className="network">Fantasy MMA Madness</p>
          </div>

          {blog.blogHeaderImage && (
            <img
              src={blog.blogHeaderImage}
              alt="Blog Header"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}

          <div className="blogDetailsCardBoutLabel">Table of Contents</div>

          <div className="blogDetailsCardFights">
            {blog.sections.map((section) => (
              <p key={section._id}>{section.title.toUpperCase()}</p>
            ))}
          </div>
        </div>

        {/* Optional Full Breakdown Below Bout Card */}
        {blog.sections.map((section) => (
          <div key={section._id} className="blogDetailsCard" style={{ marginTop: '30px' }}>
            <div className="blogDetailsCardBoutLabel">{section.title}</div>

            <div className="blogDetailsCardMain">
              <p>{section.content}</p>

              {section.image && (
                <img
                  src={section.image}
                  alt="Section"
                  style={{ maxWidth: '100%', height: 'auto', marginTop: '10px' }}
                />
              )}

              {section.headings.map((heading) => (
                <div key={heading._id} style={{ marginTop: '20px' }}>
                  <strong>{heading.title}</strong>
                  <p>{heading.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export async function getServerSideProps(context) {
  const { blogId } = context.params;

  try {
    const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/blogs/${blogId}`);
    if (!res.ok) throw new Error('Blog not found');
    const data = await res.json();

    return {
      props: {
        blog: data,
      },
    };
  } catch (err) {
    console.error('Error fetching blog details:', err);
    return {
      props: {
        blog: null,
      },
    };
  }
}

export default index;
