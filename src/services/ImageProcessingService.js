const { randomUUID } = require('crypto');
const IMediaProcessor = require('../interfaces/IMediaProcessor');

/**
 * compressImage (Private Helper)
 * -----------------------------------------------------------------------
 * Handles background pixel-density reductions away from the controller
 * thread to protect API performance. Not exported — internal to this
 * module only, mirroring the "private helper" role in the design.
 *
 * NOTE: actual pixel-buffer compression math (e.g. via sharp/libvips) is
 * intentionally stubbed here — this module models orchestration only.
 * -----------------------------------------------------------------------
 * @param {Buffer} rawImageBuffer
 * @returns {Promise<{ buffer: Buffer, sizeBytes: number }>}
 */
async function compressImage(rawImageBuffer) {
  // Simulate async, off-thread compression work without blocking the
  // event loop's ability to serve other requests.
  return new Promise((resolve) => {
    setImmediate(() => {
      resolve({
        buffer: rawImageBuffer,
        sizeBytes: rawImageBuffer.length,
      });
    });
  });
}

/**
 * ImageProcessingService (Realizes IMediaProcessor)
 * -----------------------------------------------------------------------
 * Processes, optimizes, and compresses visual media uploaded during
 * listing creation.
 * -----------------------------------------------------------------------
 */
class ImageProcessingService extends IMediaProcessor {
  constructor({ assetStore } = {}) {
    super();
    // In-memory placeholder for processed asset metadata. A real deployment
    // would swap this for a call to blob/object storage — omitted per the
    // persistence-layer constraint.
    this._assetStore = assetStore || new Map();
  }

  /**
   * Consumes raw file streams, applies compression math, and converts
   * uploads into structural media URLs.
   * @param {Array<{ buffer: Buffer, originalname: string, mimetype: string }>} rawImages
   * @returns {Promise<Array<{ assetId: string, url: string, mimetype: string }>>}
   */
  async processImageFiles(rawImages) {
    if (!Array.isArray(rawImages) || rawImages.length === 0) {
      throw new Error('processImageFiles requires a non-empty array of files');
    }

    const results = [];
    for (const file of rawImages) {
      const { buffer, sizeBytes } = await compressImage(file.buffer);
      const assetId = randomUUID();
      const record = {
        assetId,
        url: `/media/listings/${assetId}`,
        mimetype: file.mimetype,
        sizeBytes,
        originalname: file.originalname,
      };
      this._assetStore.set(assetId, { buffer, ...record });
      results.push({ assetId: record.assetId, url: record.url, mimetype: record.mimetype });
    }
    return results;
  }

  /**
   * Generates optimized viewport-ready previews for the host dashboard.
   * @param {string} assetId
   * @returns {Promise<{ assetId: string, thumbnailUrl: string }>}
   */
  async renderPreviewThumbnail(assetId) {
    const record = this._assetStore.get(assetId);
    if (!record) {
      throw new Error(`No processed asset found for assetId ${assetId}`);
    }
    return {
      assetId,
      thumbnailUrl: `/media/listings/${assetId}/thumbnail`,
    };
  }
}

module.exports = ImageProcessingService;
