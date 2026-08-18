'use client';
import React, { useState } from 'react';

const TweetUploader = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedTweet, setGeneratedTweet] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!prompt) {
      alert('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setGeneratedTweet('');
    setResult('');

    try {
      const gptRes = await fetch('/api/tweet-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const gptData = await gptRes.json();

      if (!gptRes.ok || !gptData.tweet) {
        throw new Error('Failed to generate tweet.');
      }

      setGeneratedTweet(gptData.tweet);
    } catch (err) {
      console.error(err);
      setResult('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!generatedTweet) return;

    setLoading(true);
    setResult('');

    try {
      const tweetRes = await fetch('/api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatedTweet }),
      });

      const tweetData = await tweetRes.json();
      setResult(tweetRes.ok ? '✅ Tweet posted successfully!' : tweetData.message || '❌ Posting failed.');
    } catch (err) {
      console.error(err);
      setResult('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="tweet-form" onSubmit={handleGenerate}>
      <div className="form-group">
        <label className="form-label">Enter Prompt for GPT to Write Tweet:</label>
        <input
          type="text"
          placeholder="e.g. Launching our new hydration product"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Tweet'}
        </button>
      </div>

      {generatedTweet && (
        <div className="tweet-preview">
          <p><strong>Preview Tweet:</strong></p>
          <blockquote>{generatedTweet}</blockquote>
          <button type="button" onClick={handlePost} className="form-button" disabled={loading}>
            {loading ? 'Posting...' : 'Post to Twitter'}
          </button>
        </div>
      )}

      {result && <p className="form-result">{result}</p>}
    </form>
  );
};

export default TweetUploader;
