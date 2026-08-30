import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io';

export async function transcribeMedia(
  mediaPath: string,
  originalFilename: string,
  mimeType: string,
): Promise<string> {
  const mode = process.env.TRANSCRIPTION_MODE;
  if (mode !== 'mock' && mode !== 'elevenlabs') {
    throw new Error('TRANSCRIPTION_MODE must be explicitly configured as mock or elevenlabs');
  }

  if (mode === 'mock') {
    if (!Object.prototype.hasOwnProperty.call(process.env, 'MOCK_TRANSCRIPT')) {
      throw new Error('MOCK_TRANSCRIPT must be explicitly configured in mock mode');
    }
    return process.env.MOCK_TRANSCRIPT ?? '';
  }

  if (!fs.existsSync(mediaPath)) throw new Error('Local media file is unavailable');
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ELEVENLABS_API_KEY_HERE') {
    throw new Error('ELEVENLABS_API_KEY must be configured in elevenlabs mode');
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(mediaPath), {
    filename: originalFilename,
    contentType: mimeType,
  });
  form.append('model_id', 'scribe_v1');

  const response = await fetch(`${ELEVENLABS_BASE}/v1/speech-to-text`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, ...form.getHeaders() },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs transcription request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { text?: unknown; transcript?: unknown };
  const transcript = typeof data.text === 'string'
    ? data.text
    : typeof data.transcript === 'string' ? data.transcript : '';
  return transcript;
}
