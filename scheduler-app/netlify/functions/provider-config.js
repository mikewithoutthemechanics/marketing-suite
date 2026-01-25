const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', '..', '.netlify', 'data');
const STORE = path.join(DATA_DIR, 'providers.json');

function ensureStore() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  if (!fs.existsSync(STORE)) fs.writeFileSync(STORE, JSON.stringify({}));
}

exports.handler = async function(event) {
  ensureStore();
  try {
    if (event.httpMethod === 'GET') {
      const data = JSON.parse(fs.readFileSync(STORE, 'utf8'));
      return { statusCode: 200, body: JSON.stringify(data) };
    }
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { provider, config } = body || {};
      if (!provider || !config) return { statusCode: 400, body: 'provider and config required' };
      const data = JSON.parse(fs.readFileSync(STORE, 'utf8')) || {};
      data[provider] = config;
      fs.writeFileSync(STORE, JSON.stringify(data, null, 2));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
