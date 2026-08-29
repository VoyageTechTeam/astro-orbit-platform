const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);[cite: 61]
const db = require('../config/db');[cite: 62]

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET[cite: 61]
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const { bookingId } = paymentIntent.metadata;

      await db.query(
        `UPDATE bookings SET status = 'CONFIRMED' WHERE booking_id = $1`,
        [bookingId]
      );
      console.log(`[Stripe Webhook] Confirmed booking: ${bookingId}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const { bookingId } = paymentIntent.metadata;

      await db.query(
        `UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = $1`,
        [bookingId]
      );
      console.log(`[Stripe Webhook] Payment failed for booking: ${bookingId}`);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
