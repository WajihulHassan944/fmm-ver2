import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminForumThreadDetails = () => {
    const { threadId } = useParams(); // Extract threadId from the URL
    const [thread, setThread] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
      // Increment view count when the thread details are fetched
      fetch(`https://fantasymmadness-game-server-three.vercel.app/threads/${threadId}/views`, {
        method: 'PUT'
      }).then(() => {
        return fetch(`https://fantasymmadness-game-server-three.vercel.app/threads/${threadId}`);
      })
      .then(res => res.json())
      .then(data => setThread(data))
      .catch(err => console.error(err));
    }, [threadId]);
  
    const deleteReply = (replyId) => {
        fetch(`https://fantasymmadness-game-server-three.vercel.app/threads/${threadId}/replies/${replyId}`, {
          method: 'DELETE',
        })
          .then(res => {
            if (res.ok) {
              setThread(prevThread => ({
                ...prevThread,
                replies: prevThread.replies.filter(reply => reply._id !== replyId) // Update state by removing the deleted reply
              }));
              alert("Reply deleted successfully.");
            } else {
              alert("Failed to delete reply.");
            }
          })
          .catch(err => console.error("Error deleting reply:", err));
      };
      
    
    return (
      thread ? (
        <div className='threadDetailsContainer '>
         <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => navigate(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
          <h2>{thread.title}</h2>
        <div>  <p>{thread.body}</p>
        <div style={{padding:'0', display:'flex', justifyContent:'space-between', background:'transparent'}}>  <p>Posted by {thread.author.username} on {new Date(thread.createdDate).toLocaleString()}</p>
          <p style={{color:'rgb(255, 193, 7)'}}>{thread.views} views</p> </div></div>
          <h3>Replies</h3>
          {thread.replies && thread.replies.length > 0 ? (
            thread.replies.map(reply => (
              <div key={reply._id}>
                <p className='repliesBody'>{reply.body}</p>
             <div className='toMakeFlexDisplay'>   <p>Reply by {reply.author.username}</p>
                <p style={{color:'rgb(255, 193, 7)'}}>Likes: {reply.likes?.length || 0}</p>
                <button onClick={() => deleteReply(reply._id)} style={{paddingTop:'-30px', marginTop:'-7px', height:'30px'}}>Delete</button>
            </div>   
              </div>
            ))
          ) : (
            <p>No replies yet.</p>
          )}
  
         
        </div>
      ) : <p>Loading...</p>
    );
  };
  

export default AdminForumThreadDetails
