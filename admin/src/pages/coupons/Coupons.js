import { useEffect, useState, useCallback } from 'react';
import { couponsAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

const EMPTY = { code: '', description: '', type: 'percentage', value: '', minOrderValue: 0, maxDiscount: '', usageLimit: '', expiryDate: '', isActive: true };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '' });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await couponsAPI.getAll(params);
      setCoupons(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const open = (c = null) => {
    setEditing(c);
    setForm(c ? { ...c, expiryDate: c.expiryDate?.slice(0, 10) } : EMPTY);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.maxDiscount) delete payload.maxDiscount;
      if (!payload.usageLimit) delete payload.usageLimit;
      if (editing) await couponsAPI.update(editing._id, payload);
      else await couponsAPI.create(payload);
      toast.success('Saved'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id, code) => {
    const confirmed = await confirm({
      title: 'Delete Coupon',
      message: `Are you sure you want to delete coupon "${code}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await couponsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (id) => {
    try { await couponsAPI.toggle(id); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Coupons & Offers</h1><p>Manage discount coupons</p></div>
        <button className="btn btn-primary" onClick={() => open()}>+ Create Coupon</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ maxWidth: 300 }}>
            <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input className="form-control" placeholder="Search coupon code..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Expiry</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i) => <SkeletonRow key={i} cols={8} />) :
               coupons.length === 0 ? <tr><td colSpan={8}><EmptyState icon="fa-solid fa-tag" text="No coupons" /></td></tr> :
               coupons.map(c => (
                <tr key={c._id}>
                  <td>
                    <div className="fw-600" style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--primary)' }}>{c.code}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{c.description}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                  <td className="fw-600">{c.type === 'percentage' ? `${c.value}%` : fmt.currency(c.value)}</td>
                  <td>{fmt.currency(c.minOrderValue)}</td>
                  <td>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className={new Date(c.expiryDate) < new Date() ? 'text-danger' : 'text-muted'}>{fmt.date(c.expiryDate)}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={c.isActive} onChange={() => toggle(c._id)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(c)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => del(c._id, c.code)}><i className="fa-solid fa-trash" /></button>
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
        <Modal title={editing ? 'Edit Coupon' : 'Create Coupon'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" form="coupon-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <form id="coupon-form" onSubmit={save}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Code *</label><input className="form-control" value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} required style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} /></div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-control" value={form.type} onChange={e => f('type', e.target.value)}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Value *</label><input className="form-control" type="number" step="0.01" min="0" value={form.value} onChange={e => f('value', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Min Order Value</label><input className="form-control" type="number" step="0.01" min="0" value={form.minOrderValue} onChange={e => f('minOrderValue', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Max Discount</label><input className="form-control" type="number" step="0.01" value={form.maxDiscount} onChange={e => f('maxDiscount', e.target.value)} placeholder="No limit" /></div>
              <div className="form-group"><label className="form-label">Usage Limit</label><input className="form-control" type="number" value={form.usageLimit} onChange={e => f('usageLimit', e.target.value)} placeholder="Unlimited" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Expiry Date *</label><input className="form-control" type="date" value={form.expiryDate} onChange={e => f('expiryDate', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Description</label><input className="form-control" value={form.description} onChange={e => f('description', e.target.value)} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={!!form.isActive} onChange={e => f('isActive', e.target.checked)} />Active
            </label>
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
