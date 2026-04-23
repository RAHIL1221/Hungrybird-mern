export const statusLabel = (s) => s?.replace(/_/g, ' ') || '';

export const Badge = ({ status, label }) => {
  const text = label || statusLabel(status);
  return <span className={`badge badge-${status}`}>{text}</span>;
};

export const Stars = ({ rating = 0 }) => (
  <div className="stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`star${i <= Math.round(rating) ? '' : ' empty'}`}>★</span>
    ))}
  </div>
);
