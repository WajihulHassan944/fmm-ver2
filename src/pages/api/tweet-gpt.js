// pages/api/tweet-gpt.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a Twitter caption assistant.

When given a product, news update, event, or any topic, generate a short, engaging, and creative tweet (up to 280 characters). Include emojis and hashtags if relevant, and use a conversational tone.`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    const tweet = data.choices?.[0]?.message?.content?.trim();

    if (!tweet) {
      return res.status(500).json({ message: 'Failed to generate tweet.' });
    }

    return res.status(200).json({ tweet });
  } catch (err) {
    console.error('Error generating tweet:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
}
