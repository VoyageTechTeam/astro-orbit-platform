const cloudinary = require('cloudinary').v2;
const IMediaProcessor = require('../interfaces/IMediaProcessor');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ImageProcessingService extends IMediaProcessor {
  /**
   * Processes a single image buffer and uploads to Cloudinary.
   */
  async processAndUploadImage(fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'listings',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Processes multiple raw image files uploaded via Multer.
   */
  async processImageFiles(rawImages = [], options = {}) {
    if (!Array.isArray(rawImages) || rawImages.length === 0) {
      return [];
    }

    const uploadPromises = rawImages.map((file) =>
      this.processAndUploadImage(file.buffer, options)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Generates a fast preview thumbnail URL for dynamic UI previews.
   */
  async renderPreviewThumbnail(publicId) {
    if (!publicId) return null;
    return cloudinary.url(publicId, {
      width: 300,
      height: 300,
      crop: 'thumb',
      gravity: 'auto',
      secure: true,
    });
  }

  /**
   * Deletes an image asset from Cloudinary.
   */
  async deleteImage(publicId) {
    if (!publicId) return;
    return cloudinary.uploader.destroy(publicId);
  }
}

module.exports = ImageProcessingService;
