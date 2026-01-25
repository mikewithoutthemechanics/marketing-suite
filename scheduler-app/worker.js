const { worker } = require('./lib/queue');

console.log('Worker starting...');

worker.on('completed', (job, result) => {
  console.log('Job completed', job.id);
});

worker.on('failed', (job, err) => {
  console.error('Job failed', job.id, err);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

// keep node process alive
setInterval(() => {}, 1e6);
