Ratings & Reviews Widget (ReviewWidget.jsx)
import React, { useState } from 'react';

const ReviewWidget = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment) return;
    setReviews([{ rating, comment, id: Date.now() }, ...reviews]);
    setComment('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <h3>Leave a Review</h3>
      <form onSubmit={handleSubmit}>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: '5px', marginBottom: '10px' }}>
          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
          <option value="4">⭐⭐⭐⭐ (4/5)</option>
          <option value="3">⭐⭐⭐ (3/5)</option>
          <option value="2">⭐⭐ (2/5)</option>
          <option value="1">⭐ (1/5)</option>
        </select>
        <textarea 
          placeholder="Share details of your experience..." 
          value={comment} 
          onChange={(e) => setComment(e.target.value)}
          style={{ width: '100%', height: '80px', display: 'block', marginBottom: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 15px', background: '#17a2b8', color: '#fff', border: 'none' }}>Submit Review</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <h4>All Reviews ({reviews.length})</h4>
        {reviews.map((rev) => (
          <div key={rev.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
            <div>{'⭐'.repeat(rev.rating)}</div>
            <p style={{ margin: '5px 0' }}>{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewWidget;
