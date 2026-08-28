Skeleton Loader (ListingSkeleton.jsx)
import React from 'react';

const ListingSkeleton = () => {
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ width: '250px', height: '200px', background: '#e0e0e0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}>
          <div style={{ height: '120px', background: '#ccc', borderRadius: '8px 8px 0 0' }}></div>
          <div style={{ height: '15px', background: '#ccc', margin: '10px', width: '80%' }}></div>
          <div style={{ height: '15px', background: '#ccc', margin: '10px', width: '50%' }}></div>
        </div>
      ))}
    </div>
  );
};

export default ListingSkeleton;
