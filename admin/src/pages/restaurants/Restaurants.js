import { useEffect, useState, useCallback } from 'react';
import { restaurantsAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ImageUpload from '../../components/ui/ImageUpload';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import { buildFormData } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', email: '', phone: '', 'address.street': '', 'address.city': '', 'address.state': '', 'address.zipCode': '', cuisine: '', deliveryTime: '30-45 min', minOrder: 0, deliveryFee: 0, commission: 10 };

export default function Restaurants() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '' });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await restaurantsAPI.getAll(params);
      setItems(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const open = (r = null) => {
    setEditing(r);
    if (r) {
      setForm({
        name: r.name || '',
        description: r.description || '',
        email: r.email || '',
        phone: r.phone || '',
        'address.street': r.address?.street || '',
        'address.city': r.address?.city || '',
        'address.state': r.address?.state || '',
        'address.zipCode': r.address?.zipCode || '',
        cuisine: r.cuisine?.join(', ') || '',
        deliveryTime: r.deliveryTime || '30-45 min',
        minOrder: r.minOrder || 0,
        deliveryFee: r.deliveryFee || 0,
        commission: r.commission || 10,
        logo: r.logo || ''
      });
    } else {
      setForm(EMPTY);
    }
    setLogo(null);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build clean payload without the flattened address fields
      const { 'address.street': street, 'address.city': city, 'address.state': state, 'address.zipCode': zipCode, cuisine, ...rest } = form;
      
      const payload = {
        ...rest,
        address: { street, city, state, zipCode },
        cuisine: cuisine.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      const fd = buildFormData(payload);
      if (logo) fd.append('logo', logo);
      
      if (editing) await restaurantsAPI.update(editing._id, fd);
      else await restaurantsAPI.create(fd);
      
      toast.success('Saved');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id, name) => {
    const confirmed = await confirm({
      title: 'Delete Restaurant',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await restaurantsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const updateStatus = async (id, status) => {
    try { await restaurantsAPI.updateStatus(id, { status }); toast.success('Status updated'); load(); }
    catch { toast.error('Update failed'); }
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Restaurants</h1><p>Manage restaurant vendors</p></div>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Restaurant</button>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input className="form-control" placeholder="Search restaurants..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
            {['','pending','approved','rejected','suspended'].map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Restaurant</th><th>Cuisine</th><th>City</th><th>Rating</th><th>Status</th><th>Delivery</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i) => <SkeletonRow key={i} cols={7} />) :
               items.length === 0 ? <tr><td colSpan={7}><EmptyState icon="fa-solid fa-store" text="No restaurants" /></td></tr> :
               items.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.logo ? <img src={r.logo} alt={r.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><i className="fa-solid fa-store" /></div>}
                      <div>
                        <div className="fw-600">{r.name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.cuisine?.join(', ') || '—'}</td>
                  <td>{r.address?.city || '—'}</td>
                  <td><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> {r.rating?.toFixed(1)} ({r.totalReviews})</td>
                  <td>
                    <select className="form-control" style={{ width: 120, padding: '4px 8px', fontSize: 12 }} value={r.status} onChange={e => updateStatus(r._id, e.target.value)}>
                      {['pending','approved','rejected','suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{r.deliveryTime}<br /><span className="text-muted" style={{ fontSize: 12 }}>{fmt.currency(r.deliveryFee)} fee</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(r)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => del(r._id, r.name)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Restaurant' : 'Add Restaurant'} onClose={() => setModal(false)} size="lg"
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" form="rest-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <form id="rest-form" onSubmit={save}>
            <ImageUpload value={logo || form.logo} onChange={setLogo} label="Restaurant Logo" />
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={e => f('name', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Cuisine (comma separated)</label><input className="form-control" value={form.cuisine} onChange={e => f('cuisine', e.target.value)} placeholder="Italian, Pizza" /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e => f('description', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Street</label><input className="form-control" value={form['address.street']} onChange={e => f('address.street', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">City</label><input className="form-control" value={form['address.city']} onChange={e => f('address.city', e.target.value)} /></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">State</label><input className="form-control" value={form['address.state']} onChange={e => f('address.state', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Zip Code</label><input className="form-control" value={form['address.zipCode']} onChange={e => f('address.zipCode', e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label">Delivery Time</label>
                <select className="form-control" value={form.deliveryTime} onChange={e => f('deliveryTime', e.target.value)}>
                  <option value="15-20 min">15-20 min</option>
                  <option value="20-30 min">20-30 min</option>
                  <option value="25-35 min">25-35 min</option>
                  <option value="30-40 min">30-40 min</option>
                  <option value="30-45 min">30-45 min</option>
                  <option value="35-45 min">35-45 min</option>
                  <option value="40-50 min">40-50 min</option>
                  <option value="45-60 min">45-60 min</option>
                  <option value="60-90 min">60-90 min</option>
                </select>
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Min Order ($)</label><input className="form-control" type="number" step="0.01" min="0" value={form.minOrder} onChange={e => f('minOrder', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Delivery Fee ($)</label><input className="form-control" type="number" step="0.01" min="0" value={form.deliveryFee} onChange={e => f('deliveryFee', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Commission (%)</label><input className="form-control" type="number" min="0" max="100" value={form.commission} onChange={e => f('commission', e.target.value)} /></div>
            </div>
          </form>
        </Modal>
      )}

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
