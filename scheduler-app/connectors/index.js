const platforms = {
  youtube: require('./youtube'),
  x: require('./x'),
  instagram: require('./instagram'),
  skyreels: require('./skyreels'),
  tiktok: require('./tiktok')
};

async function postToPlatform(platform, creds, payload) {
  const impl = platforms[platform];
  if (!impl) throw new Error(`No connector for ${platform}`);
  return impl.post(creds, payload);
}

// Expose gen modules for content generation
const genText = require('../gen/text');
const genImage = require('../gen/image');
const genVideo = require('../gen/video');
const genSkyreels = require('../gen/skyreels');

function listProviders() {
  // basic provider metadata for UI/config
  return [
    { id: 'youtube', name: 'YouTube', configFields: ['client_id','client_secret'] },
    { id: 'x', name: 'X / Twitter', configFields: ['client_id','client_secret'] },
    { id: 'instagram', name: 'Instagram / Meta', configFields: ['client_id','client_secret'] },
    { id: 'tiktok', name: 'TikTok', configFields: ['client_id','client_secret'] },
    { id: 'skyreels', name: 'SkyReels v2', configFields: ['api_key'] }
  ];
}

module.exports = { postToPlatform, genText, genImage, genVideo, genSkyreels, listProviders };
