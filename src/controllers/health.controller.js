const db = require('../config/db');
const redis = require('../config/redis');

const getHealthStatus = async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'UNKNOWN',
      redis: 'UNKNOWN',
    },
  };

  try {
    // 1. Verify PostgreSQL connection
    await db.query('SELECT 1');
    healthCheck.checks.database = 'UP';
  } catch (err) {
    healthCheck.checks.database = 'DOWN';
    healthCheck.status = 'DEGRADED';
  }

  try {
    // 2. Verify Redis connection
    const redisPing = await redis.ping();
    healthCheck.checks.redis = redisPing === 'PONG' ? 'UP' : 'DOWN';
  } catch (err) {
    healthCheck.checks.redis = 'DOWN';
    healthCheck.status = 'DEGRADED';
  }

  const statusCode = healthCheck.status === 'UP' ? 200 : 530;
  res.status(statusCode).json(healthCheck);
};

const getLiveness = (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
};

module.exports = { getHealthStatus, getLiveness };
