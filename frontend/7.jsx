import React, { useState } from 'react';

const BookingCheckout = ({ pricePerNight = 100 }) => {
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(1);
  const [bookingStatus, setBookingStatus] = useState('Pending Payment'); // Pending Payment -> Processing Lock -> Confirmed

  const taxAndFees = 20;
  const totalPrice = (pricePerNight * nights) + taxAndFees;

  const handlePayment = () => {
    setBookingStatus('Processing Lock...');
    setTimeout(() => {
      setBookingStatus('Confirmed');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '400px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: 'auto' }}>
      <h2>Booking Checkout</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Nights: </label>
        <input type="number" min="1" value={nights} onChange={(e) => setNights(Number(e.target.value))} style={{ width: '50px' }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Guests: </label>
        <input type="number" min="1" value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: '50px' }} />
      </div>

      <hr />
      <p>${pricePerNight} x {nights} night(s) = ${pricePerNight * nights}</p>
      <p>Taxes & Fees = ${taxAndFees}</p>
      <h4>Total Price: ${totalPrice}</h4>

      <p>Status: <strong>{bookingStatus}</strong></p>

      {bookingStatus === 'Pending Payment' && (
        <button onClick={handlePayment} style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Confirm Payment (${totalPrice})
        </button>
      )}
    </div>
  );
};

export default BookingCheckout;
