const genSkyreels = require('../../gen/skyreels');

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = JSON.parse(event.body || '{}');
    const apiKey = process.env.SKYREELS_API_KEY || body.apiKey;
    const out = await genSkyreels.generateVideo(Object.assign({}, body, { apiKey }));
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
