const express = require('express');
const cors = require('cors');[cite: 49]
const buildRouter = require('./routes/index');[cite: 53, 69]
const { handleStripeWebhook } = require('./controllers/webhook.controller');
const errorHandler = require('./middleware/errorHandler');[cite: 60, 69]
const { initGarbageCollector } = require('./jobs/garbageCollector.cron');[cite: 59]

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));[cite: 61]

// Stripe webhook raw payload parsing route (must be before express.json())
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Standard parsers[cite: 69]
app.use(express.json());[cite: 69]
app.use(express.urlencoded({ extended: true }));[cite: 69]

// Health Check Probe[cite: 69]
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));[cite: 69]

// API V1 Core Router[cite: 53, 69]
app.use('/api/v1', buildRouter());[cite: 69]

// Central Error Handler[cite: 60, 69]
app.use(errorHandler);[cite: 69]

// Initialize cron background tasks[cite: 59]
initGarbageCollector();[cite: 59]

const PORT = process.env.PORT || 5000;[cite: 61]
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Astro Orbit Core Backend running on port ${PORT}`);
  });
}

module.exports = app;
