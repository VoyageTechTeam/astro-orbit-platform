const db = require('../db.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { AppError } = require('../errors/AppError.js');

const createBookingIntent = async (req, res, next) => {
  const client = await db.connect();
  try {
    const { property_id, check_in_date, check_out_date, guests } = req.body;
    const traveler_id = req.user.user_id;

    await client.query('BEGIN');

    // 1. Lock property for date overlap verification
    const propertyRes = await client.query(
      `SELECT price_per_night FROM property_listings WHERE property_id = $1 FOR UPDATE`,
      [property_id]
    );

    if (propertyRes.rows.length === 0) {
      throw new AppError('Property not found', 404);
    }

    const pricePerNight = propertyRes.rows[0].price_per_night;
    const days = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24));
    const totalAmount = Math.round(pricePerNight * days * 100); // Amount in cents for Stripe

    // 2. Insert Booking Record
    const bookingRes = await client.query(
      `INSERT INTO bookings (property_id, traveler_id, check_in_date, check_out_date, guests, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING booking_id`,
      [property_id, traveler_id, check_in_date, check_out_date, guests, totalAmount / 100]
    );

    const bookingId = bookingRes.rows[0].booking_id;

    // 3. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: { booking_id: bookingId, traveler_id },
    });

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      data: {
        bookingId,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { createBookingIntent };
