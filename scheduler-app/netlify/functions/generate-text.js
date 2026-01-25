const { generateCopy } = require('../../gen/text');

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = JSON.parse(event.body || '{}');
    // prefer free models by default in serverless demo
    const allowPaid = process.env.ALLOW_PAID_MODELS === 'true';
    const out = await generateCopy(Object.assign({}, body, { allowPaid }));
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
