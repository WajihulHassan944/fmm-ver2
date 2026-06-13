import React from 'react';
import { useRouter } from 'next/router';

const index = ({ blogs }) => {
  const router = useRouter();

  return (
    <div className="blogsWrapper">
      <div className="blogHeader">Our Blogs</div>

      <div className="blogsWrapperActual">
        {blogs.length === 0 ? (
          <p>No blogs available.</p>
        ) : (
          blogs.map((blog) => (
            <div
              key={blog._id}
              className="blogCard"
              onClick={() => router.push(`/blog-details/${blog._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="blogCardHeader">
                <span>{new Date(blog.createdAt).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                  timeZone: 'America/New_York',
                })}</span>
              </div>
              <div className="blogCardBody">
                <div className="blogCardInfo">
                  <h2>{blog.metaTitle}</h2>
                </div>
                <div className="blogCardArrow">›</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/blogs');
    const data = await res.json();

    return {
      props: {
        blogs: data || [],
      },
    };
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return {
      props: {
        blogs: [],
      },
    };
  }
}

export default index;
