import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(formData);
      updateUser(data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.addAddress(addressForm);
      updateUser({ ...user, addresses: data.data });
      toast.success('Address added');
      setShowAddressModal(false);
      setAddressForm({ label: '', street: '', city: '', state: '', zipCode: '', isDefault: false });
    } catch (err) {
      toast.error('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await authAPI.deleteAddress(id);
      updateUser({ ...user, addresses: data.data });
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="container page-content">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>My Profile</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
        <div style={{ width: 240 }}>
          <div className="card" style={{ padding: 0 }}>
            <button
              className={`btn btn-block ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('profile')}
            >
              Profile Info
            </button>
            <button
              className={`btn btn-block ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
            <button
              className={`btn btn-block ${activeTab === 'addresses' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('addresses')}
            >
              Addresses
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="card-title">Profile Information</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={user?.email} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <h2 className="card-title">Change Password</h2>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>
                  Delivery Addresses
                </h2>
                <button className="btn btn-primary" onClick={() => setShowAddressModal(true)}>
                  + Add Address
                </button>
              </div>

              {user?.addresses?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><i className="fa-solid fa-location-dot" /></div>
                  <div className="empty-state-title">No addresses saved</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {user?.addresses?.map((addr) => (
                    <div
                      key={addr._id}
                      style={{
                        padding: 16,
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {addr.label} {addr.isDefault && <span className="badge badge-active">Default</span>}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                          {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteAddress(addr._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Address</h3>
              <button className="modal-close" onClick={() => setShowAddressModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddAddress}>
                <div className="form-group">
                  <label className="form-label">Label (Home, Work, etc.)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    required
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                  <span>Set as default address</span>
                </label>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Address'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
