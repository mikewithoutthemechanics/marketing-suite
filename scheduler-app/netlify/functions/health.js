exports.handler = async function() {
  return { statusCode: 200, body: JSON.stringify({ ok: true, env: { FREE_MODEL_URL: !!process.env.FREE_MODEL_URL, ALLOW_PAID_MODELS: process.env.ALLOW_PAID_MODELS || 'false' } }) };
};
