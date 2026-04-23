import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await orderAPI.getMyOrders();
      setOrders(data.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="container page-content">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>My Orders</h1>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-box-open" /></div>
          <div className="empty-state-title">No orders yet</div>
          <div className="empty-state-text">Start ordering delicious food!</div>
          <Link to="/" className="btn btn-primary">
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-number">Order #{order.orderNumber}</div>
                  <div className="order-date">{format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}</div>
                </div>
                <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
              </div>
              <div className="order-restaurant"><i className="fa-solid fa-store" /> {order.restaurant?.name}</div>
              <div className="order-items">
                {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.items.map((i) => i.name).join(', ')}
              </div>
              <div className="order-footer">
                <div className="order-total">${order.total.toFixed(2)}</div>
                <button className="btn btn-sm btn-outline">View Details</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
