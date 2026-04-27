import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, settingsAPI } from '../../api';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find((a) => a.isDefault)?._id || '');
  const [taxRate, setTaxRate] = useState(0.08);

  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const { data } = await settingsAPI.getPublicSettings();
        setTaxRate(data.data.taxRate);
      } catch (err) {
        console.error('Failed to fetch tax rate:', err);
      }
    };
    fetchTaxRate();
  }, []);

  const subtotal = getTotal();
  const deliveryFee = cart.restaurantDeliveryFee || 2.99;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await orderAPI.validateCoupon({ code: couponCode, subtotal });
      setDiscount(data.data.discount);
      toast.success(`Coupon applied! $${data.data.discount} off`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }

    if (!user.addresses?.length) {
      toast.error('Please add a delivery address first');
      navigate('/profile', { state: { tab: 'addresses' } });
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    const address = user.addresses.find((a) => a._id === selectedAddress);
    if (!address) {
      toast.error('Invalid address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await orderAPI.placeOrder({
        restaurantId: cart.restaurantId,
        items: cart.items,
        deliveryAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        paymentMethod: 'cash',
        couponCode: couponCode || undefined,
      });
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container page-content">
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-cart-shopping" /></div>
          <div className="empty-state-title">Your cart is empty</div>
          <div className="empty-state-text">Add items to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Your Cart</h1>

      <div className="cart-page">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
              Items from {cart.restaurantName}
            </div>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.foodId} className="cart-item">
                  <img src={getImageUrl(item.image) || 'https://picsum.photos/150/150?random=6'} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">${item.price}</div>
                    <div className="cart-item-actions">
                      <div className="cart-qty">
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.foodId, item.quantity - 1)}>
                          −
                        </button>
                        <span className="cart-qty-value">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.foodId, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <button
                        style={{ color: 'var(--danger)', fontSize: 13, background: 'none', padding: 0 }}
                        onClick={() => removeFromCart(item.foodId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {user && !user.addresses?.length && (
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>No delivery address</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add an address to proceed with checkout</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/profile', { state: { tab: 'addresses' } })}>
                + Add Address
              </button>
            </div>
          )}

          {user && user.addresses?.length > 0 && (
            <div className="card">
              <div className="card-title">Delivery Address</div>
              {user.addresses.map((addr) => (
                <label
                  key={addr._id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr._id}
                    checked={selectedAddress === addr._id}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{addr.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="cart-summary">
            <div className="cart-summary-title">Order Summary</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Coupon code"
                  className="form-control"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button className="btn btn-secondary" onClick={handleApplyCoupon}>
                  Apply
                </button>
              </div>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="cart-summary-row" style={{ color: 'var(--success)' }}>
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="cart-summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
