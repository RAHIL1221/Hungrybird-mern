import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, deliveryAPI } from '../../api';
import { fmt, statusOrder } from '../../utils/helpers';
import { Badge } from '../../components/ui/Badge';
import { LoadingCenter } from '../../components/ui/Loaders';
import toast from 'react-hot-toast';

const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'preparing',
  preparing: 'out_for_delivery', out_for_delivery: 'delivered',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      ordersAPI.getOne(id),
      deliveryAPI.getAll({ isAvailable: true, limit: 100 }),
    ]).then(([o, a]) => {
      setOrder(o.data.data);
      setAgents(a.data.data);
    }).catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    // Validate delivery agent assignment before moving to out_for_delivery
    if (status === 'out_for_delivery' && !order.deliveryAgent) {
      toast.error('Please assign a delivery agent before marking as out for delivery');
      return;
    }
    
    setUpdating(true);
    try {
      const { data } = await ordersAPI.updateStatus(id, { status });
      setOrder(data.data);
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const assignAgent = async (agentId) => {
    try {
      const { data } = await ordersAPI.assignAgent(id, { agentId });
      setOrder(data.data);
      toast.success('Delivery agent assigned');
    } catch { toast.error('Assignment failed'); }
  };

  if (loading) return <LoadingCenter />;
  if (!order) return <div className="empty-state"><div className="empty-state-text">Order not found</div></div>;

  const nextStatus = NEXT_STATUS[order.status];
  const stepIdx = statusOrder.indexOf(order.status);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Order {order.orderNumber}</h1>
          <p>Placed {fmt.datetime(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}><i className="fa-solid fa-arrow-left" /> Back</button>
          {nextStatus && (
            <button className="btn btn-primary" onClick={() => updateStatus(nextStatus)} disabled={updating}>
              Mark as {nextStatus.replace(/_/g, ' ')}
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button className="btn btn-danger btn-sm" onClick={() => updateStatus('cancelled')} disabled={updating}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status Steps */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="status-steps">
            {['pending','confirmed','preparing','out_for_delivery','delivered'].map((s, i) => (
              <div key={s} className={`status-step${i <= stepIdx ? ' done' : i === stepIdx ? ' active' : ''}`}>
          <div className="status-step-dot">{i <= stepIdx ? <i className="fa-solid fa-check" /> : i + 1}</div>
                <div className="status-step-label">{s.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Order Items */}
        <div className="card">
          <div className="card-header"><span className="card-title">Order Items</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{fmt.currency(item.price)}</td>
                    <td className="fw-600">{fmt.currency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-muted">Subtotal</span><span>{fmt.currency(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-muted">Delivery Fee</span><span>{fmt.currency(order.deliveryFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-muted">Tax</span><span>{fmt.currency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-muted">Discount</span><span className="text-success">-{fmt.currency(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span>Total</span><span>{fmt.currency(order.total)}</span>
              </div>
              {order.commission > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Revenue Distribution</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span className="text-muted">Platform Commission ({order.commissionRate}%)</span>
                    <span className="text-danger">{fmt.currency(order.commission)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span className="text-muted">Restaurant Earnings</span>
                    <span style={{ color: 'var(--success)' }}>{fmt.currency(order.restaurantEarnings)}</span>
                  </div>
                  {order.deliveryAgentFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span className="text-muted">Delivery Agent Fee</span>
                      <span style={{ color: 'var(--info)' }}>{fmt.currency(order.deliveryAgentFee)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Delivery Agent */}
          <div className="card">
            <div className="card-header"><span className="card-title">Delivery Agent</span></div>
            <div className="card-body">
              {order.deliveryAgent ? (
                <div>
                  <div className="fw-600">{order.deliveryAgent.name}</div>
                  <div className="text-muted">{order.deliveryAgent.phone}</div>
                </div>
              ) : (
                <div>
                  <div className="text-muted" style={{ marginBottom: 8 }}>No agent assigned</div>
                  {agents.length > 0 && (
                    <select className="form-control" onChange={e => e.target.value && assignAgent(e.target.value)} defaultValue="">
                      <option value="">Assign agent...</option>
                      {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.vehicleType})</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="card">
            <div className="card-header"><span className="card-title">Customer</span></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{order.user?.name}</div></div>
                <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{order.user?.email}</div></div>
                <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{order.user?.phone || '—'}</div></div>
                <div className="detail-item">
                  <div className="detail-label">Delivery Address</div>
                  <div className="detail-value">{[order.deliveryAddress?.street, order.deliveryAddress?.city, order.deliveryAddress?.state].filter(Boolean).join(', ')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div className="card-header"><span className="card-title">Payment</span></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Method</div><div className="detail-value" style={{ textTransform: 'capitalize' }}>{order.payment?.method}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge status={order.payment?.status} /></div></div>
                {order.payment?.transactionId && <div className="detail-item"><div className="detail-label">Transaction ID</div><div className="detail-value" style={{ fontSize: 12 }}>{order.payment.transactionId}</div></div>}
                {order.payment?.paidAt && <div className="detail-item"><div className="detail-label">Paid At</div><div className="detail-value">{fmt.datetime(order.payment.paidAt)}</div></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
