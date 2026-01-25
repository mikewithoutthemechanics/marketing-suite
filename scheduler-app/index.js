require('dotenv').config();
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { startPolling, dispatch } = require('./scheduler');
const db = require('./lib/db');
require('dotenv').config();
const { Elysia } = require('elysia');
const fs = require('fs');
const path = require('path');
const { startPolling, dispatch } = require('./scheduler');
const db = require('./lib/db');
const { encrypt, decrypt } = require('./lib/crypto');
const { genText, genImage, genVideo, genSkyreels } = require('./connectors');
const models = require('./config/models.json');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');
const refresh = require('./lib/refresh');
const secrets = require('./lib/secrets');
// Initialize logging
const logger = require('../../logging/logger');
process.env.SERVICE_NAME = 'scheduler-app';

const app = new Elysia();
require('../auth')(app);

// simple static index route
app.get('/', async () => {
  logger.info('Serving static index page');
  return fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
});

app.get('/api/clients', async () => {
  logger.info('Fetching clients list');
  try {
    const clients = await db.listClientsSafe();
    logger.debug(`Found ${clients.length} clients`);
    return clients.map(c => ({ id: c.id, name: c.name }));
  } catch (error) {
    logger.error('Failed to fetch clients', { error: error.message });
    throw error;
  }
});

app.post('/api/clients', async ({ body }) => {
  const { name, creds } = body || {};
  if (!name || !creds) return { status: 400, body: { error: 'name and creds required' } };
  const id = 'c_' + Date.now();
  const enc = encrypt(JSON.stringify(creds));
  await db.addClient({ id, name, creds: enc });
  return { id };
});

app.get('/api/posts', async () => {
  const posts = await db.listPosts();
  return posts;
});

app.post('/api/posts', async ({ body }) => {
  const { clientId, platforms, text, title, caption, scheduledAt } = body || {};
  if (!clientId || !platforms || !platforms.length) return { status: 400, body: { error: 'clientId and platforms required' } };
  const id = 'p_' + Date.now();
  await db.addPost({ id, clientId, platforms, text, title, caption, scheduledAt, status: scheduledAt ? 'scheduled' : 'queued', createdAt: new Date().toISOString() });
  return { id };
});

app.post('/api/deploy', async ({ body }) => {
  const { postId } = body || {};
  logger.info('Deploy request received', { postId });
  const posts = await db.listPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) {
    logger.warn('Post not found for deployment', { postId });
    return { status: 404, body: { error: 'post not found' } };
  }
  try {
    logger.info('Starting post deployment', { postId, platforms: post.platforms });
    const results = await dispatch(post);
    logger.info('Post deployed successfully', { postId, results });
    return { ok: true, results };
  } catch (err) {
    logger.error('Post deployment failed', { postId, error: err.message, stack: err.stack });
    return { status: 500, body: { error: String(err) } };
  }
});

app.post('/api/generate/text', async ({ body }) => {
  const { product, audience, brandVoice, goal, platform, model } = body || {};
  if (!product || !audience || !goal || !platform) return { status: 400, body: { error: 'product,audience,goal,platform required' } };
  try {
    const out = await genText.generateCopy({ product, audience, brandVoice: brandVoice || 'friendly expert', goal, platform, model });
    return out;
  } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

app.post('/api/generate/image', async ({ body }) => {
  const { prompt, negative, aspect, size, style } = body || {};
  if (!prompt) return { status: 400, body: { error: 'prompt required' } };
  try {
    const out = await genImage.generateImage({ prompt, negative, aspect, size, style });
    return out;
  } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

app.post('/api/generate/video', async ({ body }) => {
  const { product, audience, duration, style, prompt } = body || {};
  try {
    if (prompt) {
      const out = await genVideo.generateSyntheticVideo({ prompt, style, duration });
      return out;
    }
    const plan = await genVideo.generateVideoPlan({ product, audience, duration, style });
    return plan;
  } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

app.post('/api/generate/skyreels', async ({ body }) => {
  const { prompt, style, duration, apiKey } = body || {};
  if (!prompt) return { status: 400, body: { error: 'prompt required' } };
  try {
    const out = await genSkyreels.generateVideo({ prompt, style, duration, apiKey });
    return out;
  } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

app.get('/api/models', () => models);

app.get('/api/providers', async () => {
  try {
    const connectors = require('./connectors');
    const providers = typeof connectors.listProviders === 'function' ? connectors.listProviders() : [];
    return providers;
  } catch (e) {
    return { error: String(e) };
  }
});

app.post('/api/provider-config', async ({ body }) => {
  const { provider, config } = body || {};
  if (!provider || !config) return { status: 400, body: { error: 'provider and config required' } };
  try {
    await secrets.setProviderConfig(provider, config);
    return { ok: true };
  } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

app.get('/api/provider-config/:provider', async ({ params }) => {
  const cfg = await secrets.getProviderConfig(params.provider);
  if (!cfg) return { status: 404, body: { error: 'not found' } };
  return cfg;
});

// Simple PKCE state store
const oauthStateStore = new Map();
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest(); }
function base64URLEncode(buffer) { return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }

app.get('/auth/:provider/start', async ({ params, query }) => {
  const provider = params.provider;
  const clientId = query.clientId;
  const providerCfg = await secrets.getProviderConfig(provider) || (await db.getProviderConfig(provider));
  if (!providerCfg) return { status: 400, body: 'Provider not configured' };
  if (!clientId) return { status: 400, body: 'clientId required' };
  const redirectUri = (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT||4000}`) + `/auth/${provider}/callback`;
  const state = Buffer.from(JSON.stringify({ clientId, provider })).toString('base64');
  let authUrl = '';
  if (provider === 'twitter' || provider === 'x') {
    const code_verifier = base64URLEncode(crypto.randomBytes(64));
    const code_challenge = base64URLEncode(sha256(code_verifier));
    oauthStateStore.set(state, { code_verifier, createdAt: Date.now() });
    setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
    const scope = encodeURIComponent('tweet.write offline.access');
    authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${providerCfg.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;
  } else if (provider === 'instagram' || provider === 'facebook' || provider === 'meta') {
    const scope = encodeURIComponent('pages_manage_posts,instagram_content_publish,instagram_basic');
    authUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${providerCfg.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
  } else if (provider === 'tiktok') {
    const scope = encodeURIComponent('video.upload');
    authUrl = `https://open.tiktokapis.com/platform/oauth/connect/?client_key=${providerCfg.client_id}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  } else {
    return { status: 400, body: 'Unsupported provider' };
  }
  return { status: 302, headers: { Location: authUrl }, body: '' };
});

app.get('/auth/:provider/callback', async ({ params, query }) => {
  const provider = params.provider;
  const { code, state } = query || {};
  if (!code || !state) return { status: 400, body: 'code and state required' };
  let parsedState;
  try { parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8')); } catch (e) { return { status: 400, body: 'invalid state' }; }
  const clientId = parsedState.clientId;
  const providerCfg = await secrets.getProviderConfig(provider) || (await db.getProviderConfig(provider));
  if (!providerCfg) return { status: 400, body: 'Provider not configured' };
  const redirectUri = (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT||4000}`) + `/auth/${provider}/callback`;
  try {
    let tokenResp = null;
    if (provider === 'twitter' || provider === 'x') {
      const stored = oauthStateStore.get(state);
      const code_verifier = stored && stored.code_verifier;
      const bodyObj = { grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: providerCfg.client_id };
      if (code_verifier) bodyObj.code_verifier = code_verifier;
      if (providerCfg.client_secret) bodyObj.client_secret = providerCfg.client_secret;
      const body = querystring.stringify(bodyObj);
      const r = await axios.post('https://api.twitter.com/2/oauth2/token', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      tokenResp = r.data;
    } else if (provider === 'instagram' || provider === 'facebook' || provider === 'meta') {
      const tokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${providerCfg.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${providerCfg.client_secret}&code=${code}`;
      const r = await axios.get(tokenUrl);
      const shortToken = r.data?.access_token || r.data;
      try {
        const exchUrl = `https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${providerCfg.client_id}&client_secret=${providerCfg.client_secret}&fb_exchange_token=${shortToken}`;
        const exch = await axios.get(exchUrl);
        const longToken = exch.data?.access_token || shortToken;
        const pagesUrl = `https://graph.facebook.com/v16.0/me/accounts?access_token=${longToken}`;
        const pagesRes = await axios.get(pagesUrl);
        const pages = pagesRes.data?.data || [];
        let pageInfo = null;
        if (pages.length > 0) {
          const p = pages[0];
          const pageId = p.id;
          const pageAccessToken = p.access_token || null;
          if (pageAccessToken) {
            try {
              const igRes = await axios.get(`https://graph.facebook.com/v16.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
              const ig = igRes.data?.instagram_business_account || null;
              pageInfo = { pageId, pageAccessToken, instagram_business_account: ig };
            } catch (e) { pageInfo = { pageId, pageAccessToken }; }
          } else { pageInfo = { pageId }; }
        }
        tokenResp = { access_token: longToken, pages, pageInfo };
      } catch (ex) { tokenResp = { access_token: shortToken }; }
    } else if (provider === 'tiktok') {
      const r = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', { client_key: providerCfg.client_id, client_secret: providerCfg.client_secret, code, grant_type: 'authorization_code', redirect_uri: redirectUri });
      tokenResp = r.data;
    }
    await db.attachProviderToken(clientId, provider, tokenResp);
    return { body: 'Account linked successfully. You can close this window.' };
  } catch (err) {
    console.error('oauth error', err?.response?.data || err.message || err);
    return { status: 500, body: 'OAuth exchange failed: ' + String(err?.response?.data || err.message || err) };
  }
});

app.post('/api/refresh/twitter', async () => {
  try { const out = await refresh.refreshAllTwitterTokens(); return { ok: true, details: out }; } catch (err) { return { status: 500, body: { error: String(err) } }; }
});

setInterval(() => { refresh.refreshAllTwitterTokens().catch(err => console.error('scheduled refresh error', err)); }, 10 * 60 * 1000);

setInterval(() => { refresh.refreshAllMetaTokens().catch(err => console.error('scheduled meta refresh error', err)); }, 24 * 60 * 60 * 1000);

app.post('/api/refresh/meta', async () => { try { const out = await refresh.refreshAllMetaTokens(); return { ok: true, details: out }; } catch (err) { return { status: 500, body: { error: String(err) } }; } });

app.post('/webhook/:provider', async ({ params, body, headers }) => {
  console.log(`Webhook received from ${params.provider}`, { headers, body });
  return { ok: true };
});

app.get('/api/client/:id/pages', async ({ params }) => {
  const id = params.id;
  const c = await db.getClient(id);
  if (!c) return { status: 404, body: { error: 'client not found' } };
  let creds = {};
  try { creds = JSON.parse(decrypt(c.creds)); } catch (e) { creds = {}; }
  const meta = creds['meta'] || creds['instagram'] || creds['facebook'];
  if (!meta) return { status: 404, body: { error: 'no meta config' } };
  const pages = meta.pages || (meta.pageInfo ? [meta.pageInfo] : []);
  return pages;
});

app.post('/api/client/:id/select-page', async ({ params, body }) => {
  const id = params.id;
  const { pageId } = body || {};
  if (!pageId) return { status: 400, body: { error: 'pageId required' } };
  const c = await db.getClient(id);
  if (!c) return { status: 404, body: { error: 'client not found' } };
  let creds = {};
  try { creds = JSON.parse(decrypt(c.creds)); } catch (e) { creds = {}; }
  const meta = creds['meta'] || creds['instagram'] || creds['facebook'] || {};
  meta.defaultPageId = pageId;
  await db.attachProviderToken(id, 'meta', meta);
  return { ok: true };
});

app.get('/health/vault', async () => {
  const ok = await secrets.vaultHealthy();
  return { ok };
});

app.listen(process.env.PORT || 4000).then(() => {
  logger.info('Scheduler app starting', {
    port: process.env.PORT || 4000,
    environment: process.env.NODE_ENV || 'development',
    service: 'scheduler-app'
  });
  console.log(`Scheduler app listening on ${process.env.PORT || 4000}`);
  startPolling();
  logger.info('Polling started');
});
    const clientId = parsedState.clientId;
