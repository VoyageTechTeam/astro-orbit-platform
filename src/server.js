const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Stripe = require('stripe');
const { z } = require('zod');

// Configuration & Middlewares
const db = require('./config/db');
const redis = require('./config/redis');
const { setupSwagger } = require('./config/swagger');
const { initGarbageCollector } = require('./cron/garbageCollector.cron');
const { AppError } = require('./errors/AppError');
const { authenticateJWT, requireRole } = require('./middleware/auth');
const { validateRequest } = require('./middleware/validate');
const { authRateLimiter, globalRateLimiter } = require('./middleware/rateLimiter');
const { upload, uploadToCloudinary } = require('./services/upload.service');
const { taskQueue } = require('./queues/backgroundQueue');

// Controllers
const authController = require('./controllers/auth.controller');
const bookingController = require('./controllers/booking.controller');
const healthController = require('./controllers/health.controller');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const server = http.createServer(app);

// 1. WebSocket Server with Authentication
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected]: ${socket.user.user_id}`);
  socket.join(`user_${socket.user.user_id}`);

  socket.on('send_message', ({ recipient_id, message }) => {
    io.to(`user_${recipient_id}`).emit('receive_message', {
      sender_id: socket.user.user_id,
      message,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected]: ${socket.user.user_id}`);
  });
});

// 2. Global Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(globalRateLimiter);

// 3. Setup Interactive API Documentation
setupSwagger(app);

// 4. Health Check Probes
app.get('/healthz', healthController.getHealthStatus);
app.get('/ready', healthController.getLiveness);

// 5. Raw Body Handler for Stripe Webhook
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;

    // Confirm booking in DB
    await db.query(`UPDATE bookings SET status = 'CONFIRMED' WHERE booking_id = $1`, [bookingId]);

    // Emit live socket event
    io.to(`user_${paymentIntent.metadata.traveler_id}`).emit('booking_confirmed', { bookingId });

    // Queue email confirmation
    await taskQueue.add('sendEmail', {
      to: paymentIntent.receipt_email,
      subject: 'Astro Orbit - Stay Confirmed!',
      html: `<h1>Booking Confirmed</h1><p>Booking reference: ${bookingId}</p>`,
    });
  }

  res.status(200).json({ received: true });
});

// 6. JSON Body Parser for Standard REST Endpoints
app.use(express.json());

// 7. Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().optional(),
    role: z.enum(['traveler', 'host']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const createBookingSchema = z.object({
  body: z.object({
    property_id: z.string().uuid(),
    check_in_date: z.string(),
    check_out_date: z.string(),
    guests: z.number().positive(),
  }),
});

// 8. REST Routes
app.post('/api/v1/auth/register', authRateLimiter, validateRequest(registerSchema), authController.register);
app.post('/api/v1/auth/login', authRateLimiter, validateRequest(loginSchema), authController.login);
app.post('/api/v1/auth/refresh-token', authController.refreshToken);
app.post('/api/v1/auth/forgot-password', authRateLimiter, authController.requestPasswordReset);
app.post('/api/v1/auth/reset-password', authRateLimiter, authController.resetPassword);

app.post('/api/v1/bookings', authenticateJWT, validateRequest(createBookingSchema), bookingController.createBookingAndPaymentIntent);

app.post(
  '/api/v1/media/upload',
  authenticateJWT,
  requireRole('host'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No image provided', 400);
      const result = await uploadToCloudinary(req.file.buffer);

      // Save as unlinked media record initially (will be cleaned up by GC if never attached to listing)
      const mediaRecord = await db.query(
        `INSERT INTO listing_media (url, public_id) VALUES ($1, $2) RETURNING media_id`,
        [result.secure_url, result.public_id]
      );

      // Dispatch async job for image thumbnail variation generation
      await taskQueue.add('processImageVariations', { publicId: result.public_id });

      res.status(200).json({
        status: 'success',
        data: {
          media_id: mediaRecord.rows[0].media_id,
          url: result.secure_url,
          public_id: result.public_id,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// 9. Unhandled Route Catch-All
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 10. Global Express Operational Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
      console.error('ERROR 💥:', err);
      res.status(500).json({ status: 'error', message: 'Something went wrong on the server!' });
    }
  }
});

// 11. Initialize Cron Jobs
initGarbageCollector();

// 12. Boot Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Astro Orbit Backend running on port ${PORT}`);
  console.log(`📚 Swagger API Documentation available at http://localhost:${PORT}/docs`);
});
