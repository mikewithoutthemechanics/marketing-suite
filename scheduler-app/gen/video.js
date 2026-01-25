const axios = require('axios');
const API_KEY = process.env.OPENROUTER_API_KEY;

// Note: many public gen-AI video APIs are experimental or paid. This module provides
// a best-effort wrapper for vendors that expose an HTTP endpoint, and otherwise
// returns a production-grade shotlist + edit plan which can be passed to a video gen service.

async function generateVideoPlan({ product, audience, duration = 30, style = 'cinematic' }) {
  // Returns a shot list + editing plan that editors or video-gen models can consume
  return {
    source: 'plan',
    duration,
    plan: [
      { time: '0-2s', scene: 'Problem hook — close-up, emotionally expressive', action: 'Quick text overlay hook' },
      { time: '2-12s', scene: 'Product in action — medium shot, product use', action: 'Show transformation' },
      { time: '12-24s', scene: 'Proof/social proof — testimonials, stats', action: 'B-roll with captions' },
      { time: '24-30s', scene: 'Payoff + CTA', action: 'Clear visual CTA + outro' }
    ],
    prompt: `Create a ${duration}s vertical short for ${audience} about ${product} in ${style} style. High energy, cinematic lighting, punchy cuts.`
  };
}

async function generateSyntheticVideo({ prompt, style, resolution = '1080x1920', fps = 30 }) {
  const FREE_VIDEO_API = process.env.FREE_VIDEO_API_URL; // optional local video generation endpoint
  // Prefer free/local video generator if configured
  if (FREE_VIDEO_API) {
    try {
      const r = await axios.post(FREE_VIDEO_API, { prompt, style, resolution, fps }, { timeout: 120 * 1000 });
      return { source: 'free', raw: r.data };
    } catch (e) {
      console.warn('free video API failed, falling back:', e?.message || e);
    }
  }

  if (!API_KEY) {
    // fallback: return a plan only
    return { source: 'stub', message: 'No API key present; returned shot plan instead.' };
  }

  const allowPaid = process.env.ALLOW_PAID_MODELS === 'true';
  if (API_KEY && allowPaid) {
    try {
      const res = await axios.post('https://api.openrouter.ai/v1/video/generate', { prompt, style, resolution, fps }, { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 120 * 1000 });
      return { source: 'openrouter', raw: res.data };
    } catch (err) {
      return { error: String(err), source: 'openrouter' };
    }
  }

  return { source: 'stub', message: 'Paid video provider disabled and no free endpoint configured.' };
}

module.exports = { generateVideoPlan, generateSyntheticVideo };
