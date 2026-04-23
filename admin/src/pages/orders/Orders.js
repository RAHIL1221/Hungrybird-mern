import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import { Badge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import toast from 'react-hot-toast';

const STATUSES = ['', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '' });
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await ordersAPI.getAll(params);
      setOrders(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Orders</h1>
          <p>Manage and track all customer orders</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="filters-bar" style={{ margin: 0, flex: 1 }}>
            <div className="search-box">
              <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
              <input
                className="form-control" placeholder="Search order #..."
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
            </div>
            <select className="form-control" style={{ width: 160 }} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All Statuses'}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th><th>Customer</th><th>Restaurant</th>
                <th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={9} />) :
               orders.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon="fa-solid fa-receipt" text="No orders found" /></td></tr>
               ) : orders.map(o => (
                <tr key={o._id}>
                  <td><span className="fw-600 text-primary">{o.orderNumber}</span></td>
                  <td>
                    <div>{o.user?.name || '—'}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{o.user?.email}</div>
                  </td>
                  <td>{o.restaurant?.name || '—'}</td>
                  <td>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td className="fw-600">{fmt.currency(o.total)}</td>
                  <td><Badge status={o.payment?.status} /></td>
                  <td><Badge status={o.status} /></td>
                  <td className="text-muted">{fmt.ago(o.createdAt)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/orders/${o._id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
      </div>
    </div>
  );
}
