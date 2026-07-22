const { randomUUID } = require('crypto');
const ITransactionInterface = require('../interfaces/ITransactionInterface');

/**
 * BookingTransactionManager (Realizes ITransactionInterface)
 * -----------------------------------------------------------------------
 * Coordinates operational safety blocks during high-concurrency
 * reservation events.
 *
 * NOTE: no database/table access lives here — availability lookups and
 * commits are modeled through an injected `availabilityGateway` so the
 * persistence layer stays fully decoupled and out of scope, per the
 * stated constraints.
 * -----------------------------------------------------------------------
 */
class BookingTransactionManager extends ITransactionInterface {
  constructor({ availabilityGateway, notificationDispatcher } = {}) {
    super();
    this._availabilityGateway = availabilityGateway || createInMemoryAvailabilityGateway();
    this._notificationDispatcher = notificationDispatcher || {
      dispatch: async (event) => event, // no-op default dispatcher
    };
    this._activeBlocks = new Map();
  }

  /**
   * Establishes a temporary isolated execution environment to prevent
   * dirty reads or concurrent data writes.
   * @returns {Promise<string>} transactionHandle
   */
  async openIsolatedTransactionBlock() {
    const transactionHandle = randomUUID();
    this._activeBlocks.set(transactionHandle, {
      openedAt: new Date(),
      status: 'OPEN',
    });
    return transactionHandle;
  }

  /**
   * Performs logical evaluation of dates to catch reservation conflicts.
   * @param {string} propertyId
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise<boolean>}
   */
  async detectDateOverlap(propertyId, start, end) {
    return this._availabilityGateway.hasOverlap(propertyId, start, end);
  }

  /**
   * Locks in reservations, updates memory-mapped availability calendars,
   * and prompts the notification dispatcher.
   * @param {string} bookingId
   * @param {object} bookingDetails
   * @param {string} transactionHandle
   * @returns {Promise<object>} committedBooking
   */
  async commitTransaction(bookingId, bookingDetails, transactionHandle) {
    const block = this._activeBlocks.get(transactionHandle);
    if (!block || block.status !== 'OPEN') {
      throw new Error('Cannot commit: no open transaction block for this handle');
    }

    await this._availabilityGateway.reserve(bookingId, bookingDetails);
    block.status = 'COMMITTED';

    const committedBooking = {
      bookingId,
      ...bookingDetails,
      status: 'CONFIRMED',
      committedAt: new Date(),
    };

    await this._notificationDispatcher.dispatch({
      type: 'BOOKING_CONFIRMED',
      booking: committedBooking,
    });

    this._activeBlocks.delete(transactionHandle);
    return committedBooking;
  }

  /**
   * Safely terminates the transaction block and returns errors if date
   * overlaps or system collisions occur.
   * @param {string} reason
   * @param {string} transactionHandle
   * @returns {Promise<void>}
   */
  async rollbackTransaction(reason, transactionHandle) {
    const block = this._activeBlocks.get(transactionHandle);
    if (block) {
      block.status = 'ROLLED_BACK';
      block.reason = reason;
      this._activeBlocks.delete(transactionHandle);
    }
  }
}

/**
 * Minimal in-memory stand-in for the availability gateway so the manager
 * is runnable out of the box. Swap for a real persistence-backed gateway
 * in production — intentionally outside this design's scope.
 */
function createInMemoryAvailabilityGateway() {
  const reservations = []; // { propertyId, start, end }

  return {
    async hasOverlap(propertyId, start, end) {
      return reservations.some(
        (r) =>
          r.propertyId === propertyId &&
          new Date(start) < new Date(r.end) &&
          new Date(end) > new Date(r.start)
      );
    },
    async reserve(bookingId, { propertyId, startDate, endDate }) {
      reservations.push({ bookingId, propertyId, start: startDate, end: endDate });
    },
  };
}

module.exports = BookingTransactionManager;
