const genText = require('../gen/text');
const genImage = require('../gen/image');
const genVideo = require('../gen/video');

// Autonomous Campaign Composer
// Generates campaign plan including copy variants, recommended assets, schedule, and budget split.
// This is a lightweight, synchronous orchestrator that calls existing `gen/*` modules.

async function composeCampaign({ product, audience, brandVoice = 'friendly expert', goals = ['awareness'], channels = ['x','instagram','youtube'], budget = 1000, campaignName }) {
  if (!product || !audience) throw new Error('product and audience required');
  const base = { product, audience, brandVoice, goals, channels, budget, campaignName: campaignName || `${product}-${Date.now()}` };

  // 1) Generate headline & primary copy
  const copyReq = { product, audience, brandVoice, goal: goals[0] || 'awareness', platform: channels[0] };
  const primary = await genText.generateCopy(copyReq).catch(err => ({ error: String(err) }));

  // 2) Generate image variants for social channels
  const imagePrompt = `Hero image for ${product} targeting ${audience}. Brand voice: ${brandVoice}.`; 
  const imageVariants = [];
  for (const ch of channels) {
    try {
      const variant = await genImage.generateImage({ prompt: imagePrompt + ` channel:${ch}`, size: '1024x1024' });
      imageVariants.push({ channel: ch, asset: variant });
    } catch (e) { imageVariants.push({ channel: ch, error: String(e) }); }
  }

  // 3) Short video plan suggestion for channels that support video
  let videoPlan = null;
  if (channels.includes('youtube') || channels.includes('instagram')) {
    try { videoPlan = await genVideo.generateVideoPlan({ product, audience, duration: 15, style: brandVoice }); } catch (e) { videoPlan = { error: String(e) }; }
  }

  // 4) Budget split via optimizer if available
  let budgetSplit = channels.map(ch => ({ channel: ch, amount: Math.round(budget / Math.max(1, channels.length)) }));
  try {
    const optimizer = require('./optimizer');
    budgetSplit = optimizer.allocateBudget(channels, budget, {});
  } catch (e) {
    // keep simple split if optimizer not available
  }

  // 5) Assemble campaign plan
  const campaign = Object.assign({}, base, {
    primaryCopy: primary,
    images: imageVariants,
    videoPlan,
    budgetSplit,
    createdAt: new Date().toISOString()
  });

  return campaign;
}

module.exports = { composeCampaign };
