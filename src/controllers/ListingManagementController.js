const { randomUUID } = require('crypto');
const { validatePropertyDTO } = require('../dtos/PropertyDTO');

/**
 * ListingManagementController
 * -----------------------------------------------------------------------
 * Manages the lifecycle of rental offerings on behalf of the host.
 * Endpoint: POST /api/v1/listings
 * -----------------------------------------------------------------------
 */
class ListingManagementController {
  constructor({ imageProcessingService, listingGateway } = {}) {
    this._imageProcessingService = imageProcessingService;
    // listingGateway abstracts wherever finalized listings are persisted —
    // intentionally not a concrete DB write per design scope.
    this._listingGateway = listingGateway || {
      async save(listing) {
        return listing;
      },
    };
  }

  /**
   * Sanitizes structural metadata (titles, pricing rates, rules).
   * @param {object} details — raw PropertyDTO
   * @returns {object} sanitized property details
   */
  inputPropertyDetails(details) {
    const { valid, errors, payload } = validatePropertyDTO(details);
    if (!valid) {
      const error = new Error('Invalid property details');
      error.details = errors;
      error.statusCode = 422;
      throw error;
    }
    return payload;
  }

  /**
   * Compiles finalized metadata and triggers live deployment across
   * the platform.
   * @param {string} propertyId
   * @param {object} sanitizedDetails
   * @param {Array<object>} processedMedia
   * @returns {Promise<object>} the live listing entry
   */
  async commitListingEntry(propertyId, sanitizedDetails, processedMedia = []) {
    const listingEntry = {
      propertyId,
      ...sanitizedDetails,
      media: processedMedia,
      status: 'LIVE',
      deployedAt: new Date(),
    };
    return this._listingGateway.save(listingEntry);
  }

  /**
   * Express handler for POST /api/v1/listings
   * Expects multipart/form-data with listing fields + `images[]` files
   * (see routes/index.js for multer wiring), or a plain JSON body with
   * no images.
   */
  handleCreateListing = async (req, res) => {
    try {
      const sanitizedDetails = this.inputPropertyDetails(req.body);
      const propertyId = randomUUID();

      let processedMedia = [];
      const rawImages = req.files;
      if (rawImages && rawImages.length > 0) {
        if (!this._imageProcessingService) {
          throw Object.assign(new Error('Image processing is not configured'), {
            statusCode: 503,
          });
        }
        processedMedia = await this._imageProcessingService.processImageFiles(rawImages);
      }

      const listingEntry = await this.commitListingEntry(
        propertyId,
        sanitizedDetails,
        processedMedia
      );

      return res.status(201).json(listingEntry);
    } catch (err) {
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        error: err.message,
        details: err.details,
      });
    }
  };
}

module.exports = ListingManagementController;
