const fs = require('fs');
const path = require('path');
const genText = require('../gen/text');
const genImage = require('../gen/image');

async function run() {
  console.log('Running gen variant test...');
  const t = await genText.generateVariants({ product: 'Acme Widget', audience: 'small business owners', brandVoice: 'bold helpful', goal: 'conversion', platform: 'x', count: 4 }).catch(e=>({error:String(e)}));
  const imgs = await genImage.generateVariants({ prompt: 'Hero product shot for Acme Widget', count: 4 }).catch(e=>({error:String(e)}));
  const out = { text: t, images: imgs, ts: new Date().toISOString() };
  const outPath = path.join(__dirname, '..', 'tmp', `gen-test-${Date.now()}.json`);
  try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); fs.writeFileSync(outPath, JSON.stringify(out, null, 2)); console.log('Wrote', outPath); } catch (e) { console.error('write error', e); }
  console.log(JSON.stringify(out, null, 2));
}

if (require.main === module) { run().catch(e=>{ console.error(e); process.exit(1); }); }
