const express = require('express');
const multer = require('multer');

const SearchController = require('../controllers/SearchController');
const BookingController = require('../controllers/BookingController');
const ListingManagementController = require('../controllers/ListingManagementController');

const ImageProcessingService = require('../services/ImageProcessingService');
const BookingTransactionManager = require('../services/BookingTransactionManager');

/**
 * buildRouter
 * -----------------------------------------------------------------------
 * Wires the Controller & API Gateway layer to the Core Business Logic &
 * Service layer. Dependency instantiation lives here so services can be
 * swapped (e.g. injected persistence-backed gateways) without touching
 * controller code.
 * -----------------------------------------------------------------------
 */
function buildRouter() {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // --- Service layer instances -------------------------------------------------
  const imageProcessingService = new ImageProcessingService();
  const bookingTransactionManager = new BookingTransactionManager();

  // --- Controller instances -----------------------------------------------------
  const searchController = new SearchController();
  const bookingController = new BookingController({ bookingTransactionManager });
  const listingManagementController = new ListingManagementController({
    imageProcessingService,
  });

  // --- A. SearchController ------------------------------------------------------
  router.get('/listings/search', searchController.handleSearch);

  // --- B. BookingController -------------------------------------------------------
  router.post('/bookings', bookingController.handleCreateBooking);

  // --- C. ListingManagementController ---------------------------------------------
  router.post(
    '/listings',
    upload.array('images'),
    listingManagementController.handleCreateListing
  );

  return router;
}

module.exports = buildRouter;
