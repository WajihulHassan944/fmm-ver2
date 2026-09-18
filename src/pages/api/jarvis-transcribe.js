import OpenAI, { toFile } from 'openai';

const API_BASE = String(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app').replace(/\/$/, '');
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

const bearer = (req) => {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  const token = bearer(req);
  if (!token) return res.status(401).json({ message: 'Admin authentication is required.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: 'Jarvis voice transcription is not configured.' });

  try {
    const auth = await fetch(`${API_BASE}/dashboard-counts`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!auth.ok) return res.status(auth.status === 401 || auth.status === 403 ? 401 : 503).json({ message: auth.status === 401 || auth.status === 403 ? 'Your admin session is invalid or expired.' : 'The back office could not verify your session.' });

    const encoded = String(req.body?.audio || '');
    const mimeType = String(req.body?.mimeType || 'audio/webm').slice(0, 100);
    if (!encoded) return res.status(400).json({ message: 'No microphone recording was received.' });
    const audio = Buffer.from(encoded, 'base64');
    if (!audio.length || audio.length > MAX_AUDIO_BYTES) return res.status(413).json({ message: 'The voice recording is empty or too long.' });

    const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file: await toFile(audio, `jarvis-voice.${extension}`, { type: mimeType }),
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
      language: 'en',
    });
    const text = String(transcription.text || '').trim();
    if (!text) return res.status(422).json({ message: 'I could not hear a clear command. Please try again.' });
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Jarvis transcription error:', error);
    return res.status(500).json({ message: 'Jarvis could not transcribe the recording.' });
  }
}
