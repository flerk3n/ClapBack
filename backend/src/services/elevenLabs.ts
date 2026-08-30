import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io';

/**
 * Transcribes an MP3 audio file using the ElevenLabs Speech-to-Text API.
 * Returns the full transcript string.
 */
export async function transcribeAudio(audioPath: string | null): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // Fallback if audioPath missing or mock demo mode
  if (!audioPath || !fs.existsSync(audioPath)) {
    console.warn('[elevenlabs] No valid audio file provided for transcription');
    return '';
  }

  if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY_HERE') {
    console.warn('[elevenlabs] ELEVENLABS_API_KEY not configured — returning simulated transcript for demo');
    return 'Hey guys, today I am reviewing the NovaSkin Vitamin C Serum! It is seriously amazing for your morning routine. Make sure to use my discount code NOVA20 for 20% off at checkout.';
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath), {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg',
  });
  form.append('model_id', 'scribe_v1');

  const response = await fetch(`${ELEVENLABS_BASE}/v1/speech-to-text`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs STT failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { text?: string; transcript?: string };
  const transcript = data.text ?? data.transcript ?? '';

  console.log(`[elevenlabs] Transcript (${transcript.length} chars):`, transcript.slice(0, 200));
  return transcript;
}
