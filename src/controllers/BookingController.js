const db = require('../config/db');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { AppError } = require('../errors/AppError');

class BookingController {
  /**
   * Combined handler for creating booking record and Stripe PaymentIntent
   */
  async createBookingAndPaymentIntent(req, res, next) {
    try {
      const { property_id, check_in_date, check_out_date, guests } = req.body;
      const traveler_id = req.user.user_id;

      // 1. Check for overlapping confirmed or pending bookings
      const overlapCheck = await db.query(
        `SELECT booking_id FROM bookings 
         WHERE property_id = $1 
           AND status IN ('CONFIRMED', 'PENDING')
           AND NOT (check_out_date <= $2 OR check_in_date >= $3)`,
        [property_id, check_in_date, check_out_date]
      );

      if (overlapCheck.rows.length > 0) {
        throw new AppError('Property is not available for the selected dates', 400);
      }

      // 2. Fetch property pricing
      const propertyQuery = await db.query(
        `SELECT base_rate FROM property_listings WHERE property_id = $1`,
        [property_id]
      );

      if (propertyQuery.rows.length === 0) {
        throw new AppError('Property not found', 404);
      }

      const baseRate = propertyQuery.rows[0].base_rate;
      const days = Math.ceil(
        (new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = Math.round(baseRate * days * 100); // Amount in cents

      // 3. Create pending booking entry
      const bookingResult = await db.query(
        `INSERT INTO bookings (property_id, traveler_id, check_in_date, check_out_date, guests, total_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
         RETURNING booking_id`,
        [property_id, traveler_id, check_in_date, check_out_date, guests, baseRate * days]
      );

      const bookingId = bookingResult.rows[0].booking_id;

      // 4. Create Stripe PaymentIntent with metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        metadata: {
          booking_id: bookingId,
          traveler_id: traveler_id,
        },
      });

      res.status(201).json({
        status: 'success',
        data: {
          booking_id: bookingId,
          clientSecret: paymentIntent.client_secret,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
