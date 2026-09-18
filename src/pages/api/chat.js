import { requireAdmin } from './_adminAuth';
import { generateText } from './_openaiText';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  if (!await requireAdmin(req, res)) return;

  const message = String(req.body?.message || '').trim().slice(0, 4000);

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const reply = await generateText({
      instructions: `You are a professional blog writing assistant.

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

Always use an informative, SEO-optimized, and engaging tone. Even if the topic is vague, follow this format. Highlight features, benefits, use cases, and calls to action when relevant.`,
      input: message,
      maxOutputTokens: 2200,
    });
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ message: 'Error talking to OpenAI', error: err.message });
  }
}
