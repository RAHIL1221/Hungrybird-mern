import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAgentReviewModal, setShowAgentReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [agentReviewForm, setAgentReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data } = await orderAPI.getMyOrder(id);
      setOrder(data.data);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    const invoiceWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ff6b35; padding-bottom: 20px; }
          .invoice-header h1 { color: #ff6b35; font-size: 32px; margin-bottom: 5px; }
          .invoice-header p { color: #666; font-size: 14px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-section h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .info-section p { font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #dee2e6; }
          td { padding: 12px; border-bottom: 1px solid #dee2e6; font-size: 14px; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .totals-row.total { border-top: 2px solid #333; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #dee2e6; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>🐦 INVOICE</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        
        <div class="invoice-info">
          <div class="info-section">
            <h3>Order Date</h3>
            <p>${format(new Date(order.createdAt), 'MMMM dd, yyyy')}</p>
            <p>${format(new Date(order.createdAt), 'hh:mm a')}</p>
          </div>
          <div class="info-section">
            <h3>Restaurant</h3>
            <p><strong>${order.restaurant?.name}</strong></p>
            <p>${order.restaurant?.phone || ''}</p>
          </div>
          <div class="info-section">
            <h3>Delivery Address</h3>
            <p>${order.deliveryAddress.street}</p>
            <p>${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Delivery Fee:</span>
            <span>$${order.deliveryFee.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Tax:</span>
            <span>$${order.tax.toFixed(2)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="totals-row" style="color: #22c55e;">
              <span>Discount:</span>
              <span>-$${order.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total:</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Payment Method: ${order.payment?.method?.toUpperCase()} | Status: ${order.status.replace('_', ' ').toUpperCase()}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderAPI.cancelOrder(id);
      toast.success('Order cancelled');
      loadOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await orderAPI.submitReview({
        orderId: order._id,
        restaurantId: order.restaurant._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success(response.data.message || 'Review submitted and pending approval');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAgentReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await orderAPI.submitReview({
        orderId: order._id,
        deliveryAgentId: order.deliveryAgent._id,
        rating: agentReviewForm.rating,
        comment: agentReviewForm.comment,
      });
      toast.success(response.data.message || 'Delivery agent review submitted');
      setShowAgentReviewModal(false);
      setAgentReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingCenter />;
  if (!order) return <div className="empty-state">Order not found</div>;

  const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  const currentIndex = statusSteps.indexOf(order.status);

  return (
    <div className="container page-content">
      <button className="btn btn-secondary" onClick={() => navigate('/orders')} style={{ marginBottom: 20 }}>
        <i className="fa-solid fa-arrow-left" /> Back to Orders
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Order #{order.orderNumber}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {format(new Date(order.createdAt), 'MMMM dd, yyyy • hh:mm a')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
            {order.status === 'delivered' && (
              <button
                onClick={downloadInvoice}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'all 0.2s',
                }}
                title="Download Invoice"
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
              >
                <i className="fa-solid fa-download" />
              </button>
            )}
          </div>
        </div>

        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              {statusSteps.map((status, idx) => (
                <div
                  key={status}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    position: 'relative',
                    opacity: idx <= currentIndex ? 1 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: idx <= currentIndex ? 'var(--primary)' : 'var(--border)',
                      color: idx <= currentIndex ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {idx < currentIndex ? <i className="fa-solid fa-check" /> : idx + 1}
                  </div>
                  <div style={{ fontSize: 11, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
                  {idx < statusSteps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        left: '50%',
                        right: '-50%',
                        height: 2,
                        background: idx < currentIndex ? 'var(--primary)' : 'var(--border)',
                        zIndex: -1,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>RESTAURANT</div>
            <div style={{ fontWeight: 600 }}>{order.restaurant?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.restaurant?.phone}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              DELIVERY ADDRESS
            </div>
            <div style={{ fontSize: 14 }}>
              {order.deliveryAddress.street}, {order.deliveryAddress.city}
              <br />
              {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
            </div>
          </div>
        </div>

        {order.deliveryAgent && (
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              DELIVERY AGENT
            </div>
            <div style={{ fontWeight: 600 }}>{order.deliveryAgent.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.deliveryAgent.phone}</div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Order Items</div>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>${item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>Delivery Fee</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>Tax</span>
            <span>${order.tax.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--success)' }}
            >
              <span>Discount</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {['pending', 'confirmed'].includes(order.status) && (
          <button className="btn btn-danger btn-block" style={{ marginTop: 20 }} onClick={handleCancel}>
            Cancel Order
          </button>
        )}

        {order.status === 'delivered' && (
          <>
            <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => setShowReviewModal(true)}>
              <i className="fa-solid fa-star" /> Write a Restaurant Review
            </button>
            {order.deliveryAgent && (
              <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setShowAgentReviewModal(true)}>
                <i className="fa-solid fa-motorcycle" /> Rate Delivery Agent
              </button>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Write a Restaurant Review</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label className="form-label">Rating *</label>
                  <div style={{ display: 'flex', gap: 8, fontSize: 32 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{
                          cursor: 'pointer',
                          color: star <= reviewForm.rating ? '#fbbf24' : '#e5e7eb',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Review *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Share your experience with this restaurant..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Agent Review Modal */}
      {showAgentReviewModal && (
        <div className="modal-overlay" onClick={() => setShowAgentReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Rate Delivery Agent</h3>
              <button className="modal-close" onClick={() => setShowAgentReviewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitAgentReview}>
                <div className="form-group">
                  <label className="form-label">Rating *</label>
                  <div style={{ display: 'flex', gap: 8, fontSize: 32 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setAgentReviewForm({ ...agentReviewForm, rating: star })}
                        style={{
                          cursor: 'pointer',
                          color: star <= agentReviewForm.rating ? '#fbbf24' : '#e5e7eb',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Feedback *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="How was your delivery experience?"
                    value={agentReviewForm.comment}
                    onChange={(e) => setAgentReviewForm({ ...agentReviewForm, comment: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAgentReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
