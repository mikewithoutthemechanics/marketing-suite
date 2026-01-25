const axios = require('axios');

const OPENROUTER_URL = 'https://api.openrouter.ai/v1';
const API_KEY = process.env.OPENROUTER_API_KEY;
const FREE_MODEL_URL = process.env.FREE_MODEL_URL; // e.g. http://localhost:7860/api/generate

function buildPlatformPrompt({ product, audience, brandVoice, goal, platform }) {
  return `You are a senior conversion copywriter. Create 3 variants (direct, story, aspirational) of social copy tailored for ${platform} to drive ${goal} for ${product} aimed at ${audience}. Include: 1) a 3-8 word scroll-stopping hook, 2) 1-2 line value, 3) 1-line proof, 4) one-line micro-CTA. Also provide 3 hashtag groups (core, niche, trending) and suggested thumbnail text (3-6 words). Tone: ${brandVoice}. Output as JSON with keys: variants, hashtags, thumbnail.`;
}

async function generateCopy(opts) {
  const model = opts.model || 'gpt-4o-mini';
  const prompt = buildPlatformPrompt(opts);

  // 1) Prefer free/local model endpoint if configured
  if (FREE_MODEL_URL) {
    try {
      const r = await axios.post(FREE_MODEL_URL, { prompt, model: process.env.FREE_MODEL_NAME || model }, { timeout: 30 * 1000 });
      const text = r.data?.text || r.data?.output || JSON.stringify(r.data);
      try { return { source: 'free', raw: text, parsed: JSON.parse(text) }; } catch { return { source: 'free', raw: text }; }
    } catch (e) {
      // Continue to paid provider if free endpoint fails
      console.warn('free model endpoint failed, falling back:', e?.message || e);
    }
  }

  // 2) Use paid provider only if API key present and allowed
  const allowPaid = process.env.ALLOW_PAID_MODELS === 'true' || opts.allowPaid;
  if (API_KEY && allowPaid) {
    try {
      const res = await axios.post(`${OPENROUTER_URL}/completions`, { model, prompt, max_tokens: 750 }, { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 30 * 1000 });
      const text = res.data?.choices?.[0]?.text || res.data?.output || JSON.stringify(res.data);
      try { return { source: 'openrouter', raw: text, parsed: JSON.parse(text) }; } catch { return { source: 'openrouter', raw: text }; }
    } catch (err) {
      return { error: String(err), source: 'openrouter' };
    }
  }

  // 3) Deterministic fallback stub
  return {
    source: 'stub',
    variants: [
      { style: 'direct', text: `${opts.product}: Instant ${opts.goal}. Try now.` },
      { style: 'story', text: `I tried ${opts.product} and cut ${opts.goal} in half — here's how.` },
      { style: 'aspirational', text: `Imagine ${opts.audience} achieving ${opts.goal} with ${opts.product}.` }
    ],
    hashtags: { core: ['#YourBrand'], niche: ['#NicheTag'], trending: ['#Viral'] },
    thumbnail: 'Big Benefit Now'
  };
}

module.exports = { generateCopy };

// Generate multiple creative text variants across lengths and tones
async function generateVariants(opts = {}) {
  const count = opts.count || 6;
  const results = [];
  for (let i = 0; i < count; i++) {
    const variantOpts = Object.assign({}, opts, { model: opts.model, allowPaid: opts.allowPaid });
    // vary brandVoice slightly
    if (i % 3 === 0) variantOpts.brandVoice = (opts.brandVoice || 'friendly expert') + ' (direct)';
    if (i % 3 === 1) variantOpts.brandVoice = (opts.brandVoice || 'friendly expert') + ' (story)';
    if (i % 3 === 2) variantOpts.brandVoice = (opts.brandVoice || 'friendly expert') + ' (aspirational)';
    try {
      const out = await generateCopy(variantOpts);
      results.push({ idx: i, out });
    } catch (e) {
      results.push({ idx: i, error: String(e) });
    }
  }
  return { source: 'variants', variants: results };
}

module.exports.generateVariants = generateVariants;
