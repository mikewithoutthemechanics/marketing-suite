const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'app.db');

const db = new Database(DB_PATH);
const { encrypt, decrypt } = require('./crypto');

// Initialize schema
db.exec(`
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
  CREATE TABLE IF NOT EXISTS failed_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId TEXT,
    name TEXT,
    failedAt TEXT,
    attemptsMade INTEGER,
    data TEXT,
    error TEXT
  );
`);

const insertClientStmt = db.prepare('INSERT INTO clients (id, name, creds) VALUES (@id, @name, @creds)');
const selectClientsStmt = db.prepare('SELECT id, name FROM clients');
const getClientStmt = db.prepare('SELECT * FROM clients WHERE id = ?');
const updateClientCredsStmt = db.prepare('UPDATE clients SET creds=@creds WHERE id=@id');

const insertPostStmt = db.prepare('INSERT INTO posts (id, clientId, platforms, title, text, caption, scheduledAt, status, createdAt) VALUES (@id, @clientId, @platforms, @title, @text, @caption, @scheduledAt, @status, @createdAt)');
const selectPostsStmt = db.prepare('SELECT * FROM posts');
const updatePostStmt = db.prepare('UPDATE posts SET status=@status, sentAt=@sentAt, results=@results WHERE id=@id');

const insertProviderStmt = db.prepare('INSERT OR REPLACE INTO providers (name, config) VALUES (@name, @config)');
const getProviderStmt = db.prepare('SELECT * FROM providers WHERE name = ?');

const insertFailedJobStmt = db.prepare('INSERT INTO failed_jobs (jobId, name, failedAt, attemptsMade, data, error) VALUES (@jobId, @name, @failedAt, @attemptsMade, @data, @error)');

function addClient({ id, name, creds }) {
  insertClientStmt.run({ id, name, creds });
}

function listClientsSafe() {
  return selectClientsStmt.all();
}

function getClient(id) {
  return getClientStmt.get(id);
}

function addPost(post) {
  insertPostStmt.run({
    id: post.id,
    clientId: post.clientId,
    platforms: JSON.stringify(post.platforms),
    title: post.title || null,
    text: post.text || null,
    caption: post.caption || null,
    scheduledAt: post.scheduledAt || null,
    status: post.status || 'queued',
    createdAt: post.createdAt || new Date().toISOString()
  });
}

function listPosts() {
  return selectPostsStmt.all().map(r => ({ ...r, platforms: JSON.parse(r.platforms) }));
}

function updatePostStatus(id, status, results) {
  updatePostStmt.run({ id, status, sentAt: new Date().toISOString(), results: JSON.stringify(results) });
}

function setProviderConfig(name, configObj) {
  const blob = encrypt(JSON.stringify(configObj));
  insertProviderStmt.run({ name, config: blob });
}

function getProviderConfig(name) {
  const row = getProviderStmt.get(name);
  if (!row) return null;
  try { return JSON.parse(decrypt(row.config)); } catch (e) { return null; }
}

function attachProviderToken(clientId, provider, tokenObj) {
  const row = getClientStmt.get(clientId);
  if (!row) throw new Error('client not found');
  let creds = {};
  try { creds = JSON.parse(decrypt(row.creds)); } catch (e) { creds = {}; }
  creds[provider] = tokenObj;
  const enc = encrypt(JSON.stringify(creds));
  updateClientCredsStmt.run({ id: clientId, creds: enc });
}

function addFailedJob(entry) {
  insertFailedJobStmt.run({ jobId: entry.jobId, name: entry.name, failedAt: entry.failedAt, attemptsMade: entry.attemptsMade || 0, data: entry.data || null, error: entry.error || null });
}

module.exports = { addClient, listClientsSafe, getClient, addPost, listPosts, updatePostStatus, setProviderConfig, getProviderConfig, attachProviderToken, addFailedJob };
          results TEXT
