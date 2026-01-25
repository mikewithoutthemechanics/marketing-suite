const axios = require('axios');

// gen adapter for SkyReels v2 - requests video generation via SkyReels API
const SKYREELS_API = process.env.SKYREELS_API_URL || 'https://api.skyreels.com/v2';

async function generateVideo({ prompt, style = 'social', duration = 15, apiKey } = {}) {
  const key = apiKey || process.env.SKYREELS_API_KEY;
  if (!key) {
    // return a plan/shotlist when no API key
    return {
      source: 'plan',
      message: 'No SkyReels API key configured; returning shot plan.',
      duration,
      prompt
    };
  }
  try {
    const res = await axios.post(`${SKYREELS_API}/render`, { prompt, style, duration }, { headers: { Authorization: `Bearer ${key}` }, timeout: 120000 });
    return { source: 'skyreels', raw: res.data };
  } catch (err) {
    return { error: String(err), source: 'skyreels' };
  }
}

module.exports = { generateVideo };
