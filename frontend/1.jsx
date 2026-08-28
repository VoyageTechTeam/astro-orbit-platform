import React, { useState } from 'react';

const MediaUpload = ({ images, setImages }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const fileList = Array.from(files);
    const mappedFiles = fileList.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: false,
    }));

    if (images.length === 0 && mappedFiles.length > 0) {
      mappedFiles[0].isCover = true;
    }

    setImages((prev) => [...prev, ...mappedFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const setCoverPhoto = (index) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isCover: i === index,
      }))
    );
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h3>Upload Property Media</h3>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#007bff' : '#ccc'}`,
          padding: '20px',
          textAlign: 'center',
          borderRadius: '8px',
          background: dragActive ? '#f0f8ff' : '#fafafa',
          cursor: 'pointer',
        }}
      >
        <p>Drag and drop images here, or click to select files</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}>
          Browse Files
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
        {images.map((img, index) => (
          <div key={index} style={{ position: 'relative', border: img.isCover ? '2px solid green' : '1px solid #ddd', borderRadius: '4px', padding: '5px' }}>
            <img src={img.preview} alt="preview" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
            {img.isCover && (
              <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'green', color: 'white', padding: '2px 5px', fontSize: '10px' }}>
                Cover
              </span>
            )}
            <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setCoverPhoto(index)} style={{ fontSize: '10px' }}>
                Make Cover
              </button>
              <button type="button" onClick={() => removeImage(index)} style={{ fontSize: '10px', color: 'red' }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaUpload;
