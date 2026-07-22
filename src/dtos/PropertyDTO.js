/**
 * PropertyDTO (Input Schema)
 * -----------------------------------------------------------------------
 * {
 *   title: string;
 *   description: string;
 *   baseRate: number;
 *   locationCoordinates: { x: number; y: number };
 *   stayGuidelines: string;
 * }
 * -----------------------------------------------------------------------
 */

/**
 * Sanitizes and validates raw listing details against the PropertyDTO
 * contract. Trims strings and rejects malformed structural metadata.
 * @param {object} body
 * @returns {{ valid: boolean, errors: string[], payload: object|null }}
 */
function validatePropertyDTO(body) {
  const errors = [];
  const {
    title,
    description,
    baseRate,
    locationCoordinates,
    stayGuidelines,
  } = body || {};

  if (typeof title !== 'string' || !title.trim()) {
    errors.push('title is required');
  }
  if (typeof description !== 'string' || !description.trim()) {
    errors.push('description is required');
  }
  if (typeof baseRate !== 'number' || Number.isNaN(baseRate) || baseRate <= 0) {
    errors.push('baseRate must be a positive number');
  }
  if (
    !locationCoordinates ||
    typeof locationCoordinates.x !== 'number' ||
    typeof locationCoordinates.y !== 'number'
  ) {
    errors.push('locationCoordinates must include numeric x and y');
  }
  if (typeof stayGuidelines !== 'string' || !stayGuidelines.trim()) {
    errors.push('stayGuidelines is required');
  }

  if (errors.length) {
    return { valid: false, errors, payload: null };
  }

  return {
    valid: true,
    errors: [],
    payload: {
      title: title.trim(),
      description: description.trim(),
      baseRate,
      locationCoordinates: { x: locationCoordinates.x, y: locationCoordinates.y },
      stayGuidelines: stayGuidelines.trim(),
    },
  };
}

module.exports = { validatePropertyDTO };
