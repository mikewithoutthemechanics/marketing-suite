const db = require('./db');
const axios = require('./axiosClient');

async function refreshTwitterTokenForClient(clientId) {
  const clientRow = db.getClient(clientId);
  if (!clientRow) return { clientId, ok: false, reason: 'client not found' };
  const credsBlob = clientRow.creds;
  let creds = {};
  try { creds = JSON.parse(require('./crypto').decrypt(credsBlob)); } catch (e) { return { clientId, ok: false, reason: 'decrypt fail' }; }
  const twitter = creds['twitter'] || creds['x'];
  if (!twitter || !twitter.refresh_token) return { clientId, ok: false, reason: 'no refresh token' };

  const providerCfg = db.getProviderConfig('twitter') || db.getProviderConfig('x');
  if (!providerCfg) return { clientId, ok: false, reason: 'no provider cfg' };

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', twitter.refresh_token);
    params.append('client_id', providerCfg.client_id);
    if (providerCfg.client_secret) params.append('client_secret', providerCfg.client_secret);

    const r = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = r.data;
    // update token fields
    twitter.access_token = data.access_token || twitter.access_token;
    if (data.refresh_token) twitter.refresh_token = data.refresh_token;
    if (data.expires_in) twitter.expires_at = Date.now() + (data.expires_in * 1000);
    // write back
    await db.attachProviderToken(clientId, 'twitter', twitter);
    return { clientId, ok: true };
  } catch (err) {
    return { clientId, ok: false, reason: String(err?.response?.data || err.message || err) };
  }
}

async function refreshAllTwitterTokens() {
  const clients = db.listClientsSafe();
  const results = [];
  for (const c of clients) {
    const r = await refreshTwitterTokenForClient(c.id);
    results.push(r);
  }
  return results;
}

async function refreshMetaTokenForClient(clientId) {
  const clientRow = db.getClient(clientId);
  if (!clientRow) return { clientId, ok: false, reason: 'client not found' };
  const credsBlob = clientRow.creds;
  let creds = {};
  try { creds = JSON.parse(require('./crypto').decrypt(credsBlob)); } catch (e) { return { clientId, ok: false, reason: 'decrypt fail' }; }
  const meta = creds['instagram'] || creds['facebook'] || creds['meta'];
  if (!meta) return { clientId, ok: false, reason: 'no meta token' };

  const providerCfg = db.getProviderConfig('meta') || db.getProviderConfig('facebook') || db.getProviderConfig('instagram');
  if (!providerCfg) return { clientId, ok: false, reason: 'no provider cfg' };

  try {
    // If we have a page access token, try refreshing long-lived user token if possible
    const longToken = meta.access_token || meta.long_token || meta.accessToken;
    if (!longToken) return { clientId, ok: false, reason: 'no long token present' };

    // Exchange again for extended long-lived token (FB allows exchanging again)
    const exchUrl = `https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${providerCfg.client_id}&client_secret=${providerCfg.client_secret}&fb_exchange_token=${longToken}`;
    const r = await axios.get(exchUrl);
    const newLong = r.data?.access_token || longToken;

    // Update stored meta token
    meta.access_token = newLong;
    // Write back
    await db.attachProviderToken(clientId, 'meta', meta);
    return { clientId, ok: true };
  } catch (err) {
    return { clientId, ok: false, reason: String(err?.response?.data || err.message || err) };
  }
}

async function refreshAllMetaTokens() {
  const clients = db.listClientsSafe();
  const results = [];
  for (const c of clients) {
    const r = await refreshMetaTokenForClient(c.id);
    results.push(r);
  }
  return results;
}

module.exports = { refreshTwitterTokenForClient, refreshAllTwitterTokens, refreshMetaTokenForClient, refreshAllMetaTokens };

module.exports = { refreshTwitterTokenForClient, refreshAllTwitterTokens };
