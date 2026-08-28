const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { AppError } = require('../errors/AppError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed!', 400), false);
    }
  },
});

const uploadToCloudinary = (fileBuffer, folder = 'astro_orbit/listings') => {
  return new Promise((resolve, reject) => {
    const cldUploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, format: 'webp', quality: 'auto' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(cldUploadStream);
  });
};

module.exports = { upload, uploadToCloudinary };
