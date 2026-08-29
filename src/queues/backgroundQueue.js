// src/queues/backgroundQueue.js
const { Queue, Worker } = require('bullmq');

const connectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null // <-- ADD THIS LINE
};

// Pass it to your Worker / Queue instance
const backgroundWorker = new Worker('myQueue', async job => {
  // job handler
}, { connection: connectionOptions });
