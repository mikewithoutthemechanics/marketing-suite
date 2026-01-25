const axios = require('axios');
const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_IMG = 'https://api.openrouter.ai/v1/images/generations';
const FREE_IMAGE_API = process.env.FREE_IMAGE_API_URL; // e.g. http://localhost:7860/sdapi/v1/txt2img

async function generateImage({ prompt, negative = '', aspect = '4:5', size = '1024x1280', style = 'photorealistic' }) {
  // 1) Prefer local/free image API if configured
  if (FREE_IMAGE_API) {
    try {
      const payload = { prompt: `${prompt} -- style: ${style}`, negative_prompt: negative, size, aspect };
      const r = await axios.post(FREE_IMAGE_API, payload, { timeout: 60 * 1000 });
      return { source: 'free', raw: r.data };
    } catch (e) {
      console.warn('free image API failed, falling back:', e?.message || e);
    }
  }

  // 2) Use paid provider only when allowed
  const allowPaid = process.env.ALLOW_PAID_MODELS === 'true';
  if (API_KEY && allowPaid) {
    try {
      const payload = { prompt: `${prompt} -- style: ${style}`, negative_prompt: negative, size, aspect };
      const res = await axios.post(OPENROUTER_IMG, payload, { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 60 * 1000 });
      return { source: 'openrouter', raw: res.data };
    } catch (err) {
      return { error: String(err), source: 'openrouter' };
    }
  }

  // 3) Stub fallback
  return { source: 'stub', url: 'https://via.placeholder.com/1024x1024.png?text=Image+Stub', prompt };
}

module.exports = { generateImage };

// Generate multiple image variants across aspect ratios and sizes
async function generateVariants({ prompt, negative = '', style = 'photorealistic', count = 4 } = {}) {
  const aspects = ['1:1', '4:5', '9:16', '16:9'];
  const sizes = ['1024x1024', '1024x1280', '720x1280', '1280x720'];
  const items = [];
  for (let i = 0; i < count; i++) {
    const aspect = aspects[i % aspects.length];
    const size = sizes[i % sizes.length];
    try {
      const out = await generateImage({ prompt: `${prompt} variant ${i}`, negative, aspect, size, style });
      items.push({ idx: i, aspect, size, out });
    } catch (e) {
      items.push({ idx: i, error: String(e) });
    }
  }
  return { source: 'variants', variants: items };
}

module.exports.generateVariants = generateVariants;
