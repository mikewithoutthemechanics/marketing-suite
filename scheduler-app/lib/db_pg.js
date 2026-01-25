const { Pool } = require('pg');
const crypto = require('./crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || null
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creds TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      platforms TEXT NOT NULL,
      title TEXT,
      text TEXT,
      caption TEXT,
      scheduledAt TEXT,
      status TEXT,
      createdAt TEXT,
      sentAt TEXT,
      results TEXT
    );
    CREATE TABLE IF NOT EXISTS providers (
      name TEXT PRIMARY KEY,
      config TEXT NOT NULL
    );
  `);
}

async function addClient({ id, name, creds }) {
  await pool.query('INSERT INTO clients(id,name,creds) VALUES($1,$2,$3)', [id, name, creds]);
}

async function listClientsSafe() {
  const r = await pool.query('SELECT id,name FROM clients');
  return r.rows;
}

async function getClient(id) {
  const r = await pool.query('SELECT * FROM clients WHERE id=$1', [id]);
  return r.rows[0];
}

async function addPost(post) {
  await pool.query('INSERT INTO posts(id,clientId,platforms,title,text,caption,scheduledAt,status,createdAt) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [post.id, post.clientId, JSON.stringify(post.platforms), post.title || null, post.text || null, post.caption || null, post.scheduledAt || null, post.status || 'queued', post.createdAt || new Date().toISOString()]);
}

async function listPosts() {
  const r = await pool.query('SELECT * FROM posts');
  return r.rows.map(r => ({ ...r, platforms: JSON.parse(r.platforms) }));
}

async function updatePostStatus(id, status, results) {
  await pool.query('UPDATE posts SET status=$1, sentAt=$2, results=$3 WHERE id=$4', [status, new Date().toISOString(), JSON.stringify(results), id]);
}

async function setProviderConfig(name, configObj) {
  const blob = crypto.encrypt(JSON.stringify(configObj));
  await pool.query('INSERT INTO providers(name,config) VALUES($1,$2) ON CONFLICT (name) DO UPDATE SET config = EXCLUDED.config', [name, blob]);
}

async function getProviderConfig(name) {
  const r = await pool.query('SELECT * FROM providers WHERE name=$1', [name]);
  if (!r.rows[0]) return null;
  try { return JSON.parse(crypto.decrypt(r.rows[0].config)); } catch (e) { return null; }
}

async function attachProviderToken(clientId, provider, tokenObj) {
  const r = await pool.query('SELECT * FROM clients WHERE id=$1', [clientId]);
  if (!r.rows[0]) throw new Error('client not found');
  let creds = {};
  try { creds = JSON.parse(crypto.decrypt(r.rows[0].creds)); } catch (e) { creds = {}; }
  creds[provider] = tokenObj;
  const enc = crypto.encrypt(JSON.stringify(creds));
  await pool.query('UPDATE clients SET creds=$1 WHERE id=$2', [enc, clientId]);
}

module.exports = { init, addClient, listClientsSafe, getClient, addPost, listPosts, updatePostStatus, setProviderConfig, getProviderConfig, attachProviderToken };
