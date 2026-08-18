import React, { useState } from 'react';
import {
  FaBullhorn,
  FaFacebookSquare,
  FaInstagram,
  FaLinkedin,
  FaUpload,
} from 'react-icons/fa';

const MakePost = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideo(file);
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideoPreviewUrl(videoURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      // 1. Send social post (prompt + image)
      const formDataSocial = new FormData();
      formDataSocial.append('prompt', prompt);
      if (image) formDataSocial.append('image', image);

      await fetch('https://hook.us2.make.com/uwitrxu8b07bda6ng5itu3n99xpzlmum', {
        method: 'POST',
        body: formDataSocial,
      });

      // 2. Send YouTube upload (title + video)
     if (video) {
  const formDataYoutube = new FormData();
  formDataYoutube.append('title', youtubeTitle);
  formDataYoutube.append('file', video);

  await fetch('https://hook.us2.make.com/8xqbg348ac3awq9o3oxekjn273sv45aj', {
    method: 'POST',
    body: formDataYoutube,
  });
}

      // 3. Post to Twitter via GPT-generated content (using the same prompt)
      const gptRes = await fetch('/api/tweet-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const gptData = await gptRes.json();
      if (!gptRes.ok || !gptData.tweet) throw new Error('Failed to generate tweet.');

      const tweetRes = await fetch('/api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: gptData.tweet }),
      });

      const tweetData = await tweetRes.json();
      if (!tweetRes.ok) throw new Error(tweetData.message || 'Tweet post failed.');




      // Clear form
      setPrompt('');
      setImage(null);
      setPreviewUrl('');
      setVideo(null);
      setVideoPreviewUrl('');
      setYoutubeTitle('');
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='poster-form-wrapped'>
      <div className="poster-form-container">
        <h2 className="poster-title">
          <FaBullhorn className="icon" />
          AI Social Post Generator for Facebook, LinkedIn, Instagram & X
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Social Post Input */}
          <input
            type="text"
            placeholder="Enter your post idea (e.g., Launch Fantasy MMAadness)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            className="text-input"
          />

          {/* Upload Image */}
          <label htmlFor="file-upload" className="custom-file-upload">
            <FaUpload className="icon" />
            Upload Image
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="image-preview" />
          )}

          {/* YouTube Section */}
          <h2 className="poster-title" style={{ marginTop: '2rem' }}>
            🎥 Upload to YouTube
          </h2>

          {/* YouTube Title */}
          <input
            type="text"
            placeholder="Enter YouTube video title"
            value={youtubeTitle}
            onChange={(e) => setYoutubeTitle(e.target.value)}
            className="text-input"
          />

          {/* Upload Video */}
          <label htmlFor="video-upload" className="custom-file-upload">
            <FaUpload className="icon" />
            Upload Video
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            
          />
          {videoPreviewUrl && (
            <video
              src={videoPreviewUrl}
              controls
              className="image-preview"
              style={{ marginTop: '10px' }}
            />
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Posting...' : 'Generate & Post'}
          </button>
        </form>

        {/* Success Message */}
        {success && (
          <div className="success-message">
            ✅ Post and Video uploaded successfully!
            <div className="links">
              <a
                href="https://www.facebook.com/profile.php?id=61577983351864"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookSquare className="icon" /> View on Facebook
              </a>
              <a
                href="https://www.instagram.com/your_instagram_username"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="icon" /> View on Instagram
              </a>
              <a
                href="https://www.linkedin.com/in/your_linkedin_or_page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin className="icon" /> View on LinkedIn
              </a>
              <a
                href="https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg"
                target="_blank"
                rel="noopener noreferrer"
              >
                📺 View on YouTube
              </a>
                <a
                href="https://x.com/FMmadness2024 "
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Twitter
              </a>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default MakePost;
