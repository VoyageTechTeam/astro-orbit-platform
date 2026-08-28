import React, { useState } from 'react';

const ConciergeHub = () => {
  const [requests, setRequests] = useState([
    { id: 1, service: 'Airport Transfer', status: 'Confirmed', date: '2026-08-15' },
    { id: 2, service: 'Local Island Tour', status: 'Pending', date: '2026-08-16' },
  ]);
  const [selectedService, setSelectedService] = useState('');

  const handleRequest = (e) => {
    e.preventDefault();
    if (!selectedService) return;
    const newReq = {
      id: Date.now(),
      service: selectedService,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };
    setRequests([...requests, newReq]);
    setSelectedService('');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Travel Concierge Experience Hub</h2>
      <form onSubmit={handleRequest} style={{ marginBottom: '20px' }}>
        <select 
          value={selectedService} 
          onChange={(e) => setSelectedService(e.target.value)}
          style={{ padding: '8px', width: '70%', marginRight: '10px' }}
        >
          <option value="">-- Select Concierge Service --</option>
          <option value="Airport Pickup / Drop">Airport Pickup / Drop</option>
          <option value="Private Tour Guide">Private Tour Guide</option>
          <option value="Car Rental">Car Rental</option>
        </select>
        <button type="submit" style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Submit Request
        </button>
      </form>

      <h3>Real-time Progress Tracker</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {requests.map((req) => (
          <li key={req.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{req.service}</strong> ({req.date})</span>
            <span style={{ 
              color: req.status === 'Confirmed' ? 'green' : 'orange', 
              fontWeight: 'bold' 
            }}>
              {req.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConciergeHub;
