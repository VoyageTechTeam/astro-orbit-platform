/**
 * BookingPayload (Input Schema)
 * -----------------------------------------------------------------------
 * {
 *   propertyId: string;   // UUID
 *   travelerId: string;   // UUID
 *   startDate: string;    // ISO Date
 *   endDate: string;      // ISO Date
 * }
 * -----------------------------------------------------------------------
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates a raw request body against the BookingPayload contract.
 * @param {object} body
 * @returns {{ valid: boolean, errors: string[], payload: object|null }}
 */
function validateBookingPayload(body) {
  const errors = [];
  const { propertyId, travelerId, startDate, endDate } = body || {};

  if (!propertyId || !UUID_PATTERN.test(propertyId)) {
    errors.push('propertyId must be a valid UUID');
  }
  if (!travelerId || !UUID_PATTERN.test(travelerId)) {
    errors.push('travelerId must be a valid UUID');
  }
  if (!startDate || Number.isNaN(Date.parse(startDate))) {
    errors.push('startDate must be a valid ISO date');
  }
  if (!endDate || Number.isNaN(Date.parse(endDate))) {
    errors.push('endDate must be a valid ISO date');
  }
  if (
    !errors.length &&
    new Date(startDate).getTime() >= new Date(endDate).getTime()
  ) {
    errors.push('startDate must be strictly before endDate');
  }

  if (errors.length) {
    return { valid: false, errors, payload: null };
  }

  return {
    valid: true,
    errors: [],
    payload: {
      propertyId,
      travelerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  };
}

module.exports = { validateBookingPayload, UUID_PATTERN };
