const extractOutputText = (payload) => {
  if (typeof payload?.output_text === 'string') return payload.output_text.trim();
  return (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((item) => item?.type === 'output_text' && typeof item?.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
};

export const generateText = async ({ instructions, input, maxOutputTokens = 1200 }) => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_JARVIS_MODEL || process.env.OPENAI_MODEL || 'gpt-5',
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    }),
    signal: AbortSignal.timeout(45000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed (${response.status}).`);
  const text = extractOutputText(payload);
  if (!text) throw new Error('OpenAI returned no text.');
  return text;
};
