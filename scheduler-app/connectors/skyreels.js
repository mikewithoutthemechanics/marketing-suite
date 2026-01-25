const axios = require('axios');

// SkyReels v2 connector
// Supports creating/hosting short videos via SkyReels API v2.
// Expects creds to contain an `api_key` (or provider config stored elsewhere).

const SKYREELS_API = process.env.SKYREELS_API_URL || 'https://api.skyreels.com/v2';

async function post(creds = {}, payload = {}) {
  try {
    const apiKey = creds.api_key || creds.apiKey || process.env.SKYREELS_API_KEY;
    if (!apiKey) {
      console.log('SkyReels: no api key, simulated post', { title: payload.title });
      return { ok: true, platformId: 'sky_stub_' + Date.now() };
    }

    // If prompt present, request SkyReels to synthesize or render a short
    if (payload.prompt) {
      const body = {
        prompt: payload.prompt,
        title: payload.title || 'Untitled',
        duration: payload.duration || 15,
        style: payload.style || 'social',
        metadata: payload.metadata || {}
      };
      const res = await axios.post(`${SKYREELS_API}/render`, body, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 120000 });
      return { ok: true, platformId: res.data && res.data.id, raw: res.data };
    }

    // If mediaUrl provided, instruct SkyReels to host/ingest
    if (payload.mediaUrl) {
      const body = { source: payload.mediaUrl, title: payload.title || 'Uploaded via scheduler', metadata: payload.metadata || {} };
      const res = await axios.post(`${SKYREELS_API}/ingest`, body, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 60000 });
      return { ok: true, platformId: res.data && res.data.id, raw: res.data };
    }

    // Fallback: return minimal success with metadata
    return { ok: true, platformId: 'sky_meta_' + Date.now(), metadata: { title: payload.title } };
  } catch (err) {
    console.error('skyreels.post error', err?.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { post };
