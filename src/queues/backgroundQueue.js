const { Queue, Worker } = require('bullmq');
const cloudinary = require('cloudinary').v2;
const redisClient = require('../config/redis'); // ensure returns raw ioredis connection

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mediaQueue = new Queue('media-processing', { connection: redisClient });

const mediaWorker = new Worker(
  'media-processing',
  async (job) => {
    if (job.name === 'processImageVariations') {
      const { publicId } = job.data;
      await cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        eager: [
          { width: 800, height: 600, crop: 'fill', format: 'jpg' },
          { width: 300, height: 300, crop: 'thumb', format: 'webp' },
        ],
      });
    }
  },
  { connection: redisClient }
);

module.exports = { mediaQueue, mediaWorker };
