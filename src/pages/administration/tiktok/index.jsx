'use client';
import React, { useState } from 'react';


const Index = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSuccess(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePost = () => {
    if (videoFile) {
      // Post logic here...
      setSuccess(true);
    }
  };

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

      {success && (
        <p className="success-msg">✅ Video posted to TikTok successfully</p>
      )}
    </div>
  );
};

export default Index;
