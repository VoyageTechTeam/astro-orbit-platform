const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');
const Stripe = require('stripe');
const { z } = require('zod');

// Internal Modules
const { AppError } = require('./errors/AppError');
const { authenticateJWT, requireRole, generateTokens } = require('./middleware/auth');
const { validateRequest } = require('./middleware/validate');
const { authRateLimiter, globalRateLimiter } = require('./middleware/rateLimiter');
const { upload, uploadToCloudinary } = require('./services/upload.service');
const { taskQueue } = require('./queues/backgroundQueue');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const server = http.createServer(app);

// 1. WebSocket Server Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
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
  console.log(`[Socket] User connected: ${socket.user.user_id}`);
  
  socket.join(`user_${socket.user.user_id}`);

  socket.on('send_message', ({ recipient_id, message }) => {
    io.to(`user_${recipient_id}`).emit('receive_message', {
      sender_id: socket.user.user_id,
      message,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.user.user_id}`);
  });
});

// 2. Global Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(globalRateLimiter);

// 3. SPECIAL ROUTE: Stripe Webhook (Requires RAW Body Parser before express.json())
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Stripe Asynchronous Events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`Payment Succeeded for Intent: ${paymentIntent.id}`);
      // Push event to background task queue to send confirmation email
      await taskQueue.add('sendEmail', {
        to: paymentIntent.receipt_email,
        subject: 'Astro Orbit - Booking Confirmed!',
        html: `<h1>Payment Received</h1><p>Your booking is confirmed. Intent ID: ${paymentIntent.id}</p>`,
      });
      break;

    case 'payment_intent.payment_failed':
      console.warn(`Payment failed: ${event.data.object.id}`);
      break;
  }

  res.status(200).json({ received: true });
});

// 4. Standard JSON Body Parser for all other endpoints
app.use(express.json());

// 5. API Routes

// Registration Schema
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['traveler', 'host']),
  }),
});

app.post('/api/v1/auth/register', authRateLimiter, validateRequest(registerSchema), async (req, res, next) => {
  try {
    // Save to DB and hash password...
    res.status(201).json({ status: 'success', message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
});

// Image Upload Endpoint (Host Restricted)
app.post(
  '/api/v1/media/upload',
  authenticateJWT,
  requireRole('host'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file provided', 400);
      const result = await uploadToCloudinary(req.file.buffer);
      res.status(200).json({
        status: 'success',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Global Catch-All Unhandled Route Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 7. Global Express Operational Error Handler Middleware
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
    // Production Mode: Hide internal details for non-operational errors
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('ERROR 💥:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on the server!',
      });
    }
  }
});

// 8. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Astro Orbit Backend running on port ${PORT}`);
});
