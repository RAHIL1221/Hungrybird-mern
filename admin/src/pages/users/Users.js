import { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../../api';
import { fmt, getInitials, avatarColor } from '../../utils/helpers';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', isBlocked: '' });
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await usersAPI.getAll(params);
      setUsers(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (id, name, isBlocked) => {
    const confirmed = await confirm({
      title: `${isBlocked ? 'Unblock' : 'Block'} User`,
      message: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} "${name}"?`,
      confirmText: isBlocked ? 'Unblock' : 'Block',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await usersAPI.toggleBlock(id);
      toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'}`);
      load();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Customers</h1><p>Manage registered users</p></div>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input className="form-control" placeholder="Search by name or email..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filters.isBlocked} onChange={e => setFilters(f => ({ ...f, isBlocked: e.target.value, page: 1 }))}>
            <option value="">All Users</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Verified</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={8} />) :
               users.length === 0 ? <tr><td colSpan={8}><EmptyState icon="fa-solid fa-users" text="No users found" /></td></tr> :
               users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: avatarColor(u.name) }}>{getInitials(u.name)}</div>
                      <div>
                        <div className="fw-600">{u.name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.totalOrders}</td>
                  <td className="fw-600">{fmt.currency(u.totalSpent)}</td>
                  <td>{u.isVerified ? <i className="fa-solid fa-circle-check" style={{ color: 'green' }} /> : <i className="fa-solid fa-circle-xmark" style={{ color: 'red' }} />}</td>
                  <td className="text-muted">{fmt.date(u.createdAt)}</td>
                  <td>
                    <span className={`badge badge-${u.isBlocked ? 'cancelled' : 'delivered'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isBlocked ? 'btn-success' : 'btn-danger'}`}
                      onClick={() => toggleBlock(u._id, u.name, u.isBlocked)}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
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
