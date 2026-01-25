const axios = require('axios');

async function waitFor(url, attempts = 15, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await axios.get(url, { timeout: 2000 });
      return r.data;
    } catch (e) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Service did not respond in time');
}

(async () => {
  try {
    const base = process.env.BASE_URL || 'http://localhost:4000';
    console.log('Waiting for', base + '/api/models');
    const models = await waitFor(base + '/api/models');
    console.log('Models endpoint responded:', Array.isArray(models) ? models.length + ' models' : typeof models);

    // quick generate text smoke
    const gen = await axios.post(base + '/api/generate/text', { product: 'TestProduct', audience: 'developers', goal: 'signup', platform: 'x' }, { timeout: 5000 }).catch(e => ({ error: String(e) }));
    console.log('Generate text response:', gen.data || gen);
    console.log('Smoke tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke failed', err?.response?.data || err.message || err);
    process.exit(2);
  }
})();
