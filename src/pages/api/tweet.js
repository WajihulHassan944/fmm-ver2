// pages/api/tweet.js
import { TwitterApi } from 'twitter-api-v2';
import { requireAdmin } from './_adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  if (!await requireAdmin(req, res)) return;

  const prompt = String(req.body?.prompt || '').trim().slice(0, 280);

  if (!prompt) {
    return res.status(400).json({ message: 'Tweet content is required.' });
  }

  try {
    const requiredKeys = ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'];
    if (requiredKeys.some((key) => !process.env[key])) {
      return res.status(503).json({ message: 'X publishing is not connected. Add all four X API credentials first.' });
    }
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Post text-only tweet
    await twitterClient.v2.tweet(prompt);

    return res.status(200).json({ message: 'Tweet posted successfully!' });
  } catch (err) {
    console.error('Error posting tweet:', err);
    return res.status(500).json({ message: 'Error posting to Twitter', error: err.message });
  }
}
