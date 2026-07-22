/**
 * IMediaProcessor
 * -----------------------------------------------------------------------
 * Contract that any media/image processing service must satisfy.
 * ImageProcessingService realizes this interface.
 * -----------------------------------------------------------------------
 */
class IMediaProcessor {
  /**
   * @param {Array<Express.Multer.File>} rawImages
   * @returns {Promise<Array<{ assetId: string, url: string }>>}
   */
  // eslint-disable-next-line no-unused-vars
  async processImageFiles(rawImages) {
    throw new Error('processImageFiles() not implemented');
  }

  /**
   * @param {string} assetId
   * @returns {Promise<{ assetId: string, thumbnailUrl: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async renderPreviewThumbnail(assetId) {
    throw new Error('renderPreviewThumbnail() not implemented');
  }
}

module.exports = IMediaProcessor;
