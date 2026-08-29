import React, { useState, useEffect } from 'react';
import api from './api_2';

const ConciergeHub = () => {
  const [requests, setRequests] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/concierge/requests');
      setRequests(res.data.data || []);
    } catch (err) {
      // Fallback display if endpoint is unreachable
      setError('Unable to fetch live requests.');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedService) return;
    setLoading(true);

    try {
      const res = await api.post('/concierge/requests', { service_type: selectedService });
      setRequests((prev) => [res.data.data, ...prev]);
      setSelectedService('');
    } catch (err) {
      setError('Failed to submit concierge request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Travel Concierge Experience Hub</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
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
        <button type="submit" disabled={loading} style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      <h3>Real-time Progress Tracker</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {requests.map((req) => (
          <li key={req.request_id || req.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{req.service_type || req.service}</strong> ({new Date(req.created_at || Date.now()).toISOString().split('T')[0]})</span>
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
