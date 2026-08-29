// 2_2.jsx
import React, { useState } from 'react';
import MediaUpload from './1_2';
import api from './api_2';

const ListingWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    pricePerNight: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('address', formData.address);
      payload.append('pricePerNight', formData.pricePerNight);

      images.forEach((imgObj) => {
        payload.append('images', imgObj.file);
        if (imgObj.isCover) {
          payload.append('coverImage', imgObj.file.name);
        }
      });

      await api.post('/listings', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Property listing submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '600px', margin: '20px auto' }}>
      <h2>Create Listing (Step {step} of 3)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {step === 1 && (
        <div>
          <h3>1. Location & Details</h3>
          <input
            type="text"
            name="title"
            placeholder="Property Title"
            value={formData.title}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <input
            type="text"
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>2. Pricing Tiers</h3>
          <input
            type="number"
            name="pricePerNight"
            placeholder="Nightly Rate ($)"
            value={formData.pricePerNight}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <MediaUpload images={images} setImages={setImages} />
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        {step > 1 && <button type="button" onClick={handleBack} disabled={loading}>Back</button>}
        {step < 3 && <button type="button" onClick={handleNext}>Next</button>}
        {step === 3 && (
          <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'green', color: 'white' }}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingWizard;
