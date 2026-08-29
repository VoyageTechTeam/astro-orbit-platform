import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix asset paths using reliable CDN URLs for Leaflet markers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const initialProperties = [
  { id: 1, name: 'Ocean View Villa', price: 150, lat: 21.4272, lng: 91.9712 },
  { id: 2, name: 'Mountain Retreat', price: 80, lat: 21.4350, lng: 91.9800 },
  { id: 3, name: 'Luxury Apartment', price: 250, lat: 21.4150, lng: 91.9600 },
];

const PropertyMap = () => {
  const [maxPrice, setMaxPrice] = useState(300);

  const filteredProperties = initialProperties.filter(
    (item) => item.price <= maxPrice
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
          max="300"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          style={{ marginLeft: '15px', cursor: 'pointer' }}
        />
      </div>

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
            <Marker key={property.id} position={[property.lat, property.lng]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{property.name}</h4>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'green' }}>
                    ${property.price} / night
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
    </div>
  );
};

export default PropertyMap;
