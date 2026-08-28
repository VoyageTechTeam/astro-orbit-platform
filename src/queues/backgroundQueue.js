const { Queue, Worker } = require('bullmq');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;
const redisClient = require('../config/redis');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const taskQueue = new Queue('astroOrbitTasks', { connection: redisClient });

const taskWorker = new Worker(
  'astroOrbitTasks',
  async (job) => {
    switch (job.name) {
      // 1. Auto-release unconfirmed booking holds
      case 'releaseExpiredBookingHolds': {
        const { bookingId } = job.data;
        const db = require('../config/db');
        const result = await db.query(
          `UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 AND status = 'pending'`,
          [bookingId]
        );
        if (result.rowCount > 0) {
          console.log(`[Queue] Cancelled unconfirmed hold for Booking ID: ${bookingId}`);
        }
        break;
      }

      // 2. Batch processing for email notifications
      case 'sendBatchEmails': {
        const { recipients } = job.data; // Array of { to, subject, html }
        if (!process.env.SENDGRID_API_KEY) {
          console.log(`[Queue] Skipped sending batch emails (${recipients.length} messages) - No API Key`);
          break;
        }
        const messages = recipients.map((r) => ({
          to: r.to,
          from: process.env.EMAIL_FROM || 'noreply@astroorbit.com',
          subject: r.subject,
          html: r.html,
        }));
        await sgMail.send(messages, true); // Multiple recipient batch send
        console.log(`[Queue] Sent batch of ${recipients.length} emails successfully.`);
        break;
      }

      // 3. Async background image transformation/optimization
      case 'processImageVariations': {
        const { publicId } = job.data;
        // Generate explicit eager transformations for webp thumbnails and display sizes
        await cloudinary.uploader.explicit(publicId, {
          type: 'upload',
          eager: [
            { width: 800, height: 600, crop: 'fill', format: 'webp' },
            { width: 300, height: 200, crop: 'thumb', format: 'webp' },
          ],
        });
        console.log(`[Queue] Processed background thumbnail variations for image: ${publicId}`);
        break;
      }

      default:
        console.warn(`[Queue] Unhandled job name: ${job.name}`);
    }
  },
  { connection: redisClient }
);

taskWorker.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job ? job.id : 'unknown'} failed: ${err.message}`);
});

module.exports = { taskQueue };
