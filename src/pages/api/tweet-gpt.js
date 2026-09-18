import { requireAdmin } from './_adminAuth';
import { generateText } from './_openaiText';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  if (!await requireAdmin(req, res)) return;

  const prompt = String(req.body?.prompt || '').trim().slice(0, 2000);

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const tweet = await generateText({
      instructions: 'Write one engaging X post of at most 280 characters. Use a conversational tone and include relevant hashtags sparingly. Return only the post.',
      input: prompt,
      maxOutputTokens: 140,
    });
    return res.status(200).json({ tweet: tweet.slice(0, 280) });
  } catch (err) {
    console.error('Error generating tweet:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
}
