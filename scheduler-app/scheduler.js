const { postToPlatform } = require('./connectors');
const db = require('./lib/db');
const { decrypt } = require('./lib/crypto');
const USE_QUEUE = process.env.USE_QUEUE === 'true';
let postQueue = null;
if (USE_QUEUE) {
  try { postQueue = require('./lib/queue').postQueue; } catch (e) { console.warn('queue not available', e); }
}
async function dispatch(post) {
  const clientRow = db.getClient(post.clientId);
  if (!clientRow) throw new Error('client not found');
  const client = { id: clientRow.id, name: clientRow.name, creds: {} };
  // decrypt per-platform creds
  try {
    const raw = JSON.parse(decrypt(clientRow.creds));
    client.creds = raw;
  } catch (e) { client.creds = {}; }
  const results = [];
  for (const p of post.platforms) {
    try {
      // include default page id if meta posting
      const payload = { text: post.text, title: post.title, caption: post.caption };
      if ((p === 'instagram' || p === 'meta' || p === 'facebook') && client.creds[p] && client.creds[p].defaultPageId) {
        payload.pageId = client.creds[p].defaultPageId;
      }
      const res = await postToPlatform(p, client.creds[p] || {}, payload);
      results.push({ platform: p, ok: true, res });
    } catch (err) {
      results.push({ platform: p, ok: false, error: String(err) });
    }
  }

  // mark as sent
  // update post status in DB
  try { db.updatePostStatus(post.id, 'sent', results); } catch (e) { console.error('db update error', e); }

  return results;
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const dbRows = db.listPosts();
    const now = new Date();
    const due = dbRows.filter(p => p.status === 'scheduled' && new Date(p.scheduledAt) <= now);
    for (const post of due) {
      try {
        console.log('Dispatching post', post.id);
        if (postQueue) {
          await postQueue.add('post', { post });
        } else {
          await dispatch(post);
        }
      } catch (err) {
        console.error('Dispatch error', err);
      }
    }
  } finally {
    running = false;
  }
}

function startPolling(intervalMs = 30 * 1000) {
  // run immediately then every interval
  tick();
  return setInterval(tick, intervalMs);
}

module.exports = { startPolling, dispatch };
