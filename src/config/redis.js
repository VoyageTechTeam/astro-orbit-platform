const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),[cite: 61]
  maxRetriesPerRequest: null, // Required by BullMQ[cite: 66]
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err);
});

module.exports = redisClient;
