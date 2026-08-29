const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const listingRoutes = require('./listing.routes');
const bookingRoutes = require('./booking.routes');

function buildRouter() {
  const router = express.Router();

  router.use('/health', healthRoutes);
  router.use('/auth', authRoutes);
  router.use('/listings', listingRoutes);
  router.use('/bookings', bookingRoutes);

  return router;
}

module.exports = buildRouter;
