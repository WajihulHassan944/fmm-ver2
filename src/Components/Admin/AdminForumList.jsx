import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
const AdminForumList = () => {
    const [threads, setThreads] = useState([]);
    const router = useRouter();
    useEffect(() => {
      fetch('https://fantasymmadness-game-server-three.vercel.app/threads')
        .then(res => res.json())
        .then(data => setThreads(data))
        .catch(err => console.error(err));
    }, []);

    // Function to handle deleting all threads
    const handleDeleteAllThreads = () => {
        if (window.confirm("Are you sure you want to delete all threads?")) {
            fetch('https://fantasymmadness-game-server-three.vercel.app/threads', {
                method: 'DELETE',
            })
            .then(res => {
                if (res.ok) {
                    setThreads([]); // Clear the local threads list after deletion
                    alert("All threads have been deleted.");
                } else {
                    alert("Failed to delete all threads.");
                }
            })
            .catch(err => console.error("Error deleting all threads:", err));
        }
    };

    // Function to handle deleting a single thread
    const handleDeleteThread = (threadId) => {
        if (window.confirm("Are you sure you want to delete this thread?")) {
            fetch(`https://fantasymmadness-game-server-three.vercel.app/threads/${threadId}`, {
                method: 'DELETE',
            })
            .then(res => {
                if (res.ok) {
                    setThreads(threads.filter(thread => thread._id !== threadId)); // Update the local thread list
                    alert("Thread deleted successfully.");
                } else {
                    alert("Failed to delete the thread.");
                }
            })
            .catch(err => console.error("Error deleting thread:", err));
        }
    };
  
    const handleThreadClick = (threadId) => {
      router.push(`/administration/threads/${threadId}`);
    };
  
    return (
      <div className=" adminSideThreadsContainer">
       <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
        <h1 className="forum-heading">Discussion Forum</h1>
        <button className="create-thread-btn" onClick={handleDeleteAllThreads}>Delete all threads</button>
        {threads.length === 0 ? (
          <p className="no-posts-message">No posts yet.</p>
        ) : (
          threads.map(thread => (
            <div key={thread._id} className="thread-item" onClick={() => handleThreadClick(thread._id)}>
              <h2 className="thread-title">{thread.title}</h2>
              <p className="thread-meta">Posted by {thread.author.username} on {new Date(thread.createdDate).toLocaleString()}</p>
              <p className="thread-body">{thread.body}</p>
              <div className='toFlex'>
                <p className="thread-views">{thread.views} views</p>
                {thread.replies.length > 0 && <p className="thread-replies">{thread.replies.length} replies</p>}
                <p className="thread-likes">Liked by: {thread.replies.map(reply => reply.likes.length).reduce((a, b) => a + b, 0)} users</p>
                <button 
                  style={{ paddingTop: '-30px', marginTop: '-7px', height: '30px', background: '#007bff', color: '#fff', border: 'none', outline: 'none', paddingLeft: '20px', paddingRight: '20px' }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigating to thread details on delete click
                    handleDeleteThread(thread._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

export default AdminForumList;
