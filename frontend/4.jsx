import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from './api_2';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const PropertyMap = () => {
  const [properties, setProperties] = useState([]);
  const [maxPrice, setMaxPrice] = useState(300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get('/listings');
        const data = response.data.data || response.data;
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load properties from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const filteredProperties = properties.filter(
    (item) => Number(item.price_per_night || item.price) <= maxPrice
  );

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h2>Interactive Map & Spatial Search</h2>

      <div style={{ marginBottom: '15px', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
        <label style={{ fontWeight: 'bold' }}>
          Max Budget ($): {maxPrice}
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          style={{ marginLeft: '15px', cursor: 'pointer' }}
        />
      </div>

      {loading && <p>Loading map listings...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && (
        <div style={{ height: '450px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
          <MapContainer
            center={[21.4272, 91.9712]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredProperties.map((property) => (
              <Marker
                key={property.property_id || property.id}
                position={[
                  Number(property.latitude || property.lat || 21.4272),
                  Number(property.longitude || property.lng || 91.9712),
                ]}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{property.title || property.name}</h4>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'green' }}>
                      ${property.price_per_night || property.price} / night
                    </p>
                    <button style={{ marginTop: '8px', padding: '4px 8px', cursor: 'pointer' }}>
                      Book Now
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;
