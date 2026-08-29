const express = require('express');
const authRoutes = require('./auth.routes');
const ListingManagementController = require('../controllers/ListingManagementController');[cite: 51]
const BookingController = require('../controllers/BookingController');[cite: 65]
const ImageProcessingService = require('../services/ImageProcessingService');
const BookingTransactionManager = require('../services/BookingTransactionManager');[cite: 63]

function buildRouter() {
  const router = express.Router();

  // Instantiating missing implementations
  const imageProcessingService = new ImageProcessingService();
  const bookingTransactionManager = new BookingTransactionManager();

  const listingController = new ListingManagementController({ imageProcessingService });[cite: 51]
  const bookingController = new BookingController({ bookingTransactionManager });[cite: 65]

  // Auth Routes
  router.use('/auth', authRoutes);

  // Listing Routes
  router.post(
    '/listings',
    listingController.handleCreateListing
  );[cite: 51]

  // Booking Routes
  router.post(
    '/bookings',
    bookingController.handleCreateBooking
  );[cite: 65]

  return router;
}

module.exports = buildRouter;
