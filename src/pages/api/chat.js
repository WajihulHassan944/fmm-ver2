// pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
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
            content: `You are a professional blog writing assistant.

When the user gives you a topic, generate a detailed blog post in the following format:

Meta Title

Meta Description

Blog Title (H1)

Section 1 Heading (H2)

Section 1 Text

Section 2 Heading (H2)

Section 2 Text

Section 3 Heading (H2)

Section 3 Text

Conclusion Heading (H2)

Conclusion Text

Always use an informative, SEO-optimized, and engaging tone. Even if the topic is vague, follow this format. Take inspiration from product-focused launch blogs—highlight features, benefits, use cases, and calls to action when relevant.`,
          },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();
    return res.status(200).json({ reply: data.choices?.[0]?.message?.content || 'No reply.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error talking to OpenAI', error: err.message });
  }
}
