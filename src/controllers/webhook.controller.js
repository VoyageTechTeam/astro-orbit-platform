const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

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
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { booking_id } = paymentIntent.metadata || {};

      if (booking_id) {
        await db.query(
          `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE booking_id = $1`,
          [booking_id]
        );
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const { booking_id } = paymentIntent.metadata || {};

      if (booking_id) {
        await db.query(
          `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE booking_id = $1`,
          [booking_id]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { handleStripeWebhook };
