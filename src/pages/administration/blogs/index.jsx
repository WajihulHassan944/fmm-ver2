import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const index = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/blogs');
        const data = await res.json();
        setBlogs(data);
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const deleteBlog = async (id) => {
    try {
      await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/blogs/${id}`, {
        method: 'DELETE',
      });
      setBlogs((prev) => prev.filter((blog) => blog._id !== id));
    } catch (err) {
      console.error('Failed to delete blog:', err);
    }
  };

  const deleteAllBlogs = async () => {
    try {
      await fetch('https://fantasymmadness-game-server-three.vercel.app/api/delete/blogs', {
        method: 'DELETE',
      });
      setBlogs([]);
    } catch (err) {
      console.error('Failed to delete all blogs:', err);
    }
  };

  return (
    <div className="blogsContainerAdmin addNewMatch">
      <div className='blogsContentActual'>
      <div className="blogsHeaderAdmin">
        <h2 className="blogsTitleAdmin">All Blogs</h2>
        <button onClick={deleteAllBlogs} className="deleteAllBtn">
          Delete All Blogs
        </button>
      </div>

      {loading ? (
        <p className="blogsLoading">Loading...</p>
      ) : blogs.length === 0 ? (
        <p className="blogsEmpty">No blogs available.</p>
      ) : (
        <div className="blogsListAdmin">
          {blogs.map((blog, index) => (
            <div key={blog._id} className="blogItem">
              <div className="blogLeft" onClick={() => router.push(`/administration/blogs/blog-details-admin/${blog._id}`)}>
                <span className="blogIndex">{index + 1}.</span>
                <span className="blogTitle">{blog.metaTitle}</span>
              </div>
              <button className="deleteBtn" onClick={() => deleteBlog(blog._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
};

export default index;
