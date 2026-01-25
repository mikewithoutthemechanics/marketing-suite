require('dotenv').config();
const { dispatch } = require('./scheduler');
const db = require('./lib/db');

async function deployAllScheduled() {
  const queued = db.listPosts().filter(p => p.status === 'scheduled' || p.status === 'queued');
  for (const p of queued) {
    console.log('Deploying', p.id);
    try {
      await dispatch(p);
    } catch (err) {
      console.error('Deploy error', err);
    }
  }
}

deployAllScheduled().then(() => console.log('Deploy run complete'));
