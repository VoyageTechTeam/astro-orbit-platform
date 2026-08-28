const { Queue, Worker } = require('bullmq');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Initialize Background Job Queue
const taskQueue = new Queue('astroOrbitTasks', { connection: redisConnection });

// Worker Processing Jobs Asynchronously
const taskWorker = new Worker(
  'astroOrbitTasks',
  async (job) => {
    switch (job.name) {
      case 'sendEmail':
        const { to, subject, text, html } = job.data;
        await sgMail.send({
          to,
          from: 'notifications@astroorbit.com',
          subject,
          text,
          html,
        });
        console.log(`[Queue] Email sent successfully to ${to}`);
        break;

      case 'releaseExpiredBookingHolds':
        const { bookingId } = job.data;
        console.log(`[Queue] Checking expired booking hold for Booking ID: ${bookingId}`);
        // Add DB update logic here if booking status is still 'pending'
        break;

      default:
        console.warn(`[Queue] Unknown job type: ${job.name}`);
    }
  },
  { connection: redisConnection }
);

taskWorker.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = { taskQueue };
