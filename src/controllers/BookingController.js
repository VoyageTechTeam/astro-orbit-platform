const { randomUUID } = require('crypto');
const { validateBookingPayload } = require('../dtos/BookingPayload');

/**
 * BookingController
 * -----------------------------------------------------------------------
 * Orchestrates incoming reservation flows initiated by travelers.
 * Endpoint: POST /api/v1/bookings
 * -----------------------------------------------------------------------
 */
class BookingController {
  constructor({ bookingTransactionManager }) {
    if (!bookingTransactionManager) {
      throw new Error('BookingController requires a bookingTransactionManager');
    }
    this._transactionManager = bookingTransactionManager;
  }

  /**
   * Parses incoming reservation parameters (dates, traveler credentials,
   * property identifiers) and hands execution to the transaction manager.
   * @param {object} payload — raw BookingPayload
   * @returns {Promise<object>} committed booking record
   */
  async executeBookingPostRequest(payload) {
    const { valid, errors, payload: bookingPayload } = validateBookingPayload(payload);
    if (!valid) {
      const error = new Error('Invalid booking payload');
      error.details = errors;
      error.statusCode = 422;
      throw error;
    }

    const { propertyId, travelerId, startDate, endDate } = bookingPayload;
    const transactionHandle = await this._transactionManager.openIsolatedTransactionBlock();

    try {
      const hasOverlap = await this._transactionManager.detectDateOverlap(
        propertyId,
        startDate,
        endDate
      );

      if (hasOverlap) {
        await this._transactionManager.rollbackTransaction(
          'Date overlap detected for requested property',
          transactionHandle
        );
        const error = new Error('Requested dates overlap an existing reservation');
        error.statusCode = 409;
        throw error;
      }

      const bookingId = randomUUID();
      const committedBooking = await this._transactionManager.commitTransaction(
        bookingId,
        { propertyId, travelerId, startDate, endDate },
        transactionHandle
      );

      return committedBooking;
    } catch (err) {
      if (!err.statusCode) {
        await this._transactionManager.rollbackTransaction(err.message, transactionHandle);
      }
      throw err;
    }
  }

  /**
   * Express handler for POST /api/v1/bookings
   */
  handleCreateBooking = async (req, res) => {
    try {
      const committedBooking = await this.executeBookingPostRequest(req.body);
      return res.status(201).json(committedBooking);
    } catch (err) {
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        error: err.message,
        details: err.details,
      });
    }
  };
}

module.exports = BookingController;
