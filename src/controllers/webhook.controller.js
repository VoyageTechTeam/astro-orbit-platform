// webhook.controller.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db_2');

const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.booking_id;

    if (bookingId) {
      try {
        await db.query(
          `UPDATE bookings SET status = 'CONFIRMED', payment_status = 'PAID', updated_at = NOW() WHERE booking_id = $1`,
          [bookingId]
        );
      } catch (dbErr) {
        return next(dbErr);
      }
    }
  }

  res.status(200).json({ received: true });
};

module.exports = { handleStripeWebhook };
