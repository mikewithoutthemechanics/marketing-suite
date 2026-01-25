const genText = require('./text');
const genImage = require('./image');
const genVideo = require('./video');

async function generateCampaignAssets({ product, audience, brandVoice }) {
  const headline = await genText.generateCopy({ product, audience, brandVoice, goal: 'awareness', platform: 'x' }).catch(e => ({ error: String(e) }));
  const hero = await genImage.generateImage({ prompt: `Hero image for ${product}`, size: '1024x1024' }).catch(e => ({ error: String(e) }));
  const videoPlan = await genVideo.generateVideoPlan({ product, audience, duration: 15 }).catch(e => ({ error: String(e) }));
  return { headline, hero, videoPlan };
}

module.exports = { generateCampaignAssets };
