import { useEffect, useState } from 'react';
import { settingsAPI, authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { LoadingCenter } from '../../components/ui/Loaders';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');
  const { admin, setAdmin } = useAuth();
  const [profile, setProfile] = useState({ name: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    settingsAPI.get().then(r => setSettings(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    if (admin) setProfile({ name: admin.name, avatar: admin.avatar || '' });
  }, [admin]);

  const saveSettings = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await settingsAPI.update(settings); toast.success('Settings saved'); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(profile);
      setAdmin(data.data);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Change failed'); }
    finally { setSaving(false); }
  };

  const s = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  if (loading) return <LoadingCenter />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Settings</h1><p>Configure your application</p></div>
      </div>

      <div className="tabs">
        {[['general','General'],['payment','Payment'],['delivery','Delivery'],['profile','Profile'],['security','Security']].map(([id, label]) => {
          const tabIcons = { general: 'fa-solid fa-gear', payment: 'fa-solid fa-credit-card', delivery: 'fa-solid fa-motorcycle', profile: 'fa-solid fa-user', security: 'fa-solid fa-lock' };
          return (
            <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              <i className={tabIcons[id]} /> {label}
            </button>
          );
        })}
      </div>

      {tab === 'general' && (
        <div className="card">
          <div className="card-header"><span className="card-title">General Settings</span></div>
          <form onSubmit={saveSettings}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">App Name</label><input className="form-control" value={settings.app_name || ''} onChange={e => s('app_name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Support Email</label><input className="form-control" type="email" value={settings.support_email || ''} onChange={e => s('support_email', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tax Rate (%)</label><input className="form-control" type="number" step="0.01" value={settings.tax_rate || ''} onChange={e => s('tax_rate', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Currency</label><input className="form-control" value={settings.currency || 'USD'} onChange={e => s('currency', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">App Description</label><textarea className="form-control" rows={2} value={settings.app_description || ''} onChange={e => s('app_description', e.target.value)} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button></div>
          </form>
        </div>
      )}

      {tab === 'payment' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Settings</span></div>
          <form onSubmit={saveSettings}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Stripe Public Key</label><input className="form-control" value={settings.stripe_public_key || ''} onChange={e => s('stripe_public_key', e.target.value)} placeholder="pk_..." /></div>
                <div className="form-group"><label className="form-label">Payment Gateway</label>
                  <select className="form-control" value={settings.payment_gateway || 'stripe'} onChange={e => s('payment_gateway', e.target.value)}>
                    <option value="stripe">Stripe</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['cash_on_delivery','Cash on Delivery'],['card_payment','Card Payment'],['wallet_payment','Wallet Payment']].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={!!settings[k]} onChange={e => s(k, e.target.checked)} />{l}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button></div>
          </form>
        </div>
      )}

      {tab === 'delivery' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Delivery Settings</span></div>
          <form onSubmit={saveSettings}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Base Delivery Fee ($)</label><input className="form-control" type="number" step="0.01" value={settings.base_delivery_fee || ''} onChange={e => s('base_delivery_fee', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Free Delivery Above ($)</label><input className="form-control" type="number" step="0.01" value={settings.free_delivery_above || ''} onChange={e => s('free_delivery_above', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Max Delivery Radius (km)</label><input className="form-control" type="number" value={settings.max_delivery_radius || ''} onChange={e => s('max_delivery_radius', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Estimated Delivery Time (min)</label><input className="form-control" type="number" value={settings.estimated_delivery_time || ''} onChange={e => s('estimated_delivery_time', e.target.value)} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button></div>
          </form>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Profile Settings</span></div>
          <form onSubmit={saveProfile}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={admin?.email || ''} disabled style={{ opacity: .6 }} /></div>
              </div>
              <div className="form-group"><label className="form-label">Avatar URL</label><input className="form-control" value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="https://..." /></div>
              <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Role: <strong style={{ textTransform: 'capitalize' }}>{admin?.role?.replace('_', ' ')}</strong>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Profile'}</button></div>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Change Password</span></div>
          <form onSubmit={changePassword}>
            <div className="card-body">
              <div className="form-group"><label className="form-label">Current Password</label><input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">New Password</label><input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} /></div>
                <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-control" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Changing...' : 'Change Password'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
