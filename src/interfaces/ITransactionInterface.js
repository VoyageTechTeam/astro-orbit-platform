/**
 * ITransactionInterface
 * -----------------------------------------------------------------------
 * Contract for orchestrating isolated, concurrency-safe transaction
 * blocks. BookingTransactionManager realizes this interface.
 * -----------------------------------------------------------------------
 */
class ITransactionInterface {
  /**
   * @returns {Promise<string>} transactionHandle
   */
  async openIsolatedTransactionBlock() {
    throw new Error('openIsolatedTransactionBlock() not implemented');
  }

  /**
   * @param {string} propertyId
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise<boolean>} true if an overlapping reservation exists
   */
  // eslint-disable-next-line no-unused-vars
  async detectDateOverlap(propertyId, start, end) {
    throw new Error('detectDateOverlap() not implemented');
  }

  /**
   * @param {string} bookingId
   * @returns {Promise<object>} committedBooking
   */
  // eslint-disable-next-line no-unused-vars
  async commitTransaction(bookingId) {
    throw new Error('commitTransaction() not implemented');
  }

  /**
   * @param {string} reason
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async rollbackTransaction(reason) {
    throw new Error('rollbackTransaction() not implemented');
  }
}

module.exports = ITransactionInterface;
