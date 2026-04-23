export const Spinner = ({ size = '' }) => <div className={`spinner${size === 'lg' ? ' spinner-lg' : ''}`} />;

export const LoadingCenter = () => (
  <div className="loading-center"><Spinner size="lg" /></div>
);

export const SkeletonRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}><div className="skeleton skeleton-text" style={{ width: `${60 + (i * 10) % 40}%` }} /></td>
    ))}
  </tr>
);

export const EmptyState = ({ icon = 'fa-solid fa-inbox', text = 'No data found', sub = '' }) => (
  <div className="empty-state">
    <div className="empty-state-icon"><i className={icon} /></div>
    <div className="empty-state-text">{text}</div>
    {sub && <div className="empty-state-sub">{sub}</div>}
  </div>
);
