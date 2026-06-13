import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from "./CreateThread.module.css";
import { useRouter } from 'next/router';
const CreateThread = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const user = useSelector((state) => state.user); // Access user details from Redux store
  const router = useRouter();
  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('https://fantasymmadness-game-server-three.vercel.app/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        profileUrl:user.profileUrl,
        author: {
          userId: user._id,
          username: user.firstName + ' ' + user.lastName
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        setTitle('');
        setBody('');
        alert('Thread created!');
        router.push('/community-forum');
        
      })
      .catch(err => console.error(err));
  };

  return (
    <div className={styles.createThreadContainer}>
      <h1>Create a New Post</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
       <center> <button type="submit">Submit</button></center>
      </form>
    </div>
  );
};

export default CreateThread;
