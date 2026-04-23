import { useEffect, useState, useCallback } from 'react';
import { reviewsAPI } from '../../api';
import { fmt, getInitials, avatarColor } from '../../utils/helpers';
import { Stars } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await reviewsAPI.getAll(params);
      setReviews(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await reviewsAPI.updateStatus(id, { status }); toast.success('Status updated'); load(); }
    catch { toast.error('Update failed'); }
  };

  const del = async (id, userName) => {
    const confirmed = await confirm({
      title: 'Delete Review',
      message: `Are you sure you want to delete the review by "${userName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await reviewsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Reviews & Ratings</h1><p>Moderate customer reviews</p></div>
        <select className="form-control" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          {['','pending','approved','rejected'].map(s => <option key={s} value={s}>{s || 'All Reviews'}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Restaurant / Agent</th><th>Rating</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={7} />) :
               reviews.length === 0 ? <tr><td colSpan={7}><EmptyState icon="fa-solid fa-star" text="No reviews" /></td></tr> :
               reviews.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{ background: avatarColor(r.user?.name || '') }}>{getInitials(r.user?.name)}</div>
                      <div>
                        <div className="fw-600">{r.user?.name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{r.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {r.restaurant && <div><i className="fa-solid fa-utensils" /> {r.restaurant?.name}</div>}
                    {r.deliveryAgent && <div><i className="fa-solid fa-motorcycle" /> {r.deliveryAgent?.name}</div>}
                    {!r.restaurant && !r.deliveryAgent && '—'}
                  </td>
                  <td><Stars rating={r.rating} /></td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '—'}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td className="text-muted">{fmt.ago(r.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status !== 'approved' && <button className="btn btn-success btn-sm" onClick={() => updateStatus(r._id, 'approved')}><i className="fa-solid fa-check" /></button>}
                      {r.status !== 'rejected' && <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r._id, 'rejected')}><i className="fa-solid fa-xmark" /></button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => del(r._id, r.user?.name)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
    </div>
  );
}
