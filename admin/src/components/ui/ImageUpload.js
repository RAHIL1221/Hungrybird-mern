import { useRef } from 'react';

export default function ImageUpload({ value, onChange, label = 'Upload Image' }) {
  const ref = useRef();

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="img-upload-box" onClick={() => ref.current.click()}>
        {value && typeof value === 'string' ? (
          <img src={value} alt="preview" className="img-preview" />
        ) : value instanceof File ? (
          <img src={URL.createObjectURL(value)} alt="preview" className="img-preview" />
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to upload</div>
          </div>
        )}
        <input
          ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files[0])}
        />
      </div>
    </div>
  );
}
