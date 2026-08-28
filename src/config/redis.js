const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on('connect', () => console.log(' Connected to Redis'));
redis.on('error', (err) => console.error('Redis connection error:', err));

module.exports = redis;
