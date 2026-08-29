const IMediaProcessor = require('../interfaces/IMediaProcessor');[cite: 55]
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,[cite: 61]
  api_key: process.env.CLOUDINARY_API_KEY,[cite: 61]
  api_secret: process.env.CLOUDINARY_API_SECRET,[cite: 61]
});

class ImageProcessingService extends IMediaProcessor {[cite: 55]
  async processAndUploadImage(fileBuffer, folderPath = 'properties') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderPath, format: 'webp' },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  async deleteImage(publicId) {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  }
}

module.exports = ImageProcessingService;
