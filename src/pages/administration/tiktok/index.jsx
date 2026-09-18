'use client';
import React, { useState } from 'react';


const Index = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [notice, setNotice] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setNotice('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePost = () => setNotice(
    videoFile
      ? 'TikTok publishing is not connected yet. Your video is previewed here, but nothing was posted.'
      : 'Choose a video before continuing.'
  );

  return (
    <div className="admin-panel">
      <h1>Fantasy MMAdness Admin Panel</h1>
      <h2>TikTok Video Posting</h2>

      <div
        className="upload-box"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {previewUrl ? (
          <video width="100%" height="240" controls src={previewUrl} />
        ) : (
          <div className="upload-placeholder">
            <span role="img" aria-label="video icon">🎥</span>
            <p>Drag and drop a video file here</p>
          </div>
        )}
      </div>

      <button className="post-btn" onClick={handlePost}>
        Post to TikTok
      </button>

      {notice && <p className="form-result">{notice}</p>}
    </div>
  );
};

export default Index;
