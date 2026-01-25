const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const scheduler = require('../scheduler');
const db = require('./db');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Queue scheduler to handle retries/delayed jobs
const queueScheduler = new QueueScheduler('posts', { connection });
const postQueue = new Queue('posts', { connection });

// Worker to process post jobs with attempts/backoff
const worker = new Worker('posts', async job => {
  const { post } = job.data;
  return scheduler.dispatch(post);
}, {
  connection,
  // Configure automatic retries and backoff behavior
  settings: { backoffStrategies: {} },
  // Default attempts and backoff can also be set per-job when adding
});

// On failure, record to DB dead-letter table for inspection
worker.on('failed', async (job, err) => {
  try {
    const entry = {
      jobId: job.id,
      name: job.name,
      failedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade || 0,
      data: JSON.stringify(job.data || {}),
      error: String(err?.message || err)
    };
    if (db && db.addFailedJob) await db.addFailedJob(entry);
  } catch (e) {
    console.error('Failed to write DLQ entry', e);
  }
});

module.exports = { postQueue, worker, queueScheduler };
