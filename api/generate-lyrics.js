export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  try {
    const { mood, genre, tempo, level, key, mode } = req.body || {};
    const prompt = `Write original song lyrics using these musical choices: mood ${mood}, genre ${genre}, tempo ${tempo} BPM, guitar level ${level}, key ${key}, mode ${mode}. Make it vivid and singable, with Verse 1, Chorus, Verse 2, Bridge, and Final Chorus. Do not mention the settings, BPM, music theory, guitar lessons, or the writing prompt. Avoid clichés and keep it under 350 words. Return only the lyrics.`;
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: prompt, max_output_tokens: 700 }) });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed' });
    const lyrics = data.output_text || (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('');
    return res.status(200).json({ lyrics });
  } catch (error) { return res.status(500).json({ error: error.message || 'Generation failed' }); }
}
