import { useEffect, useState, useCallback, useRef } from 'react';
import { deliveryAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import { initFormValidation } from '../../utils/validation';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', phone: '', vehicleType: 'cycle', vehicleNumber: '', zone: '', isAvailable: true, isActive: true };

export default function Delivery() {
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '' });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => {
    if (modal && formRef.current) {
      initFormValidation(formRef.current);
    }
  }, [modal]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await deliveryAPI.getAll(params);
      setAgents(data.data); setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const open = (a = null) => { setEditing(a); setForm(a || EMPTY); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await deliveryAPI.update(editing._id, form);
      else await deliveryAPI.create(form);
      toast.success('Saved'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    const confirmed = await confirm({
      title: 'Delete Delivery Agent',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await deliveryAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Delivery Agents</h1><p>Manage delivery personnel</p></div>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Agent</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ maxWidth: 300 }}>
            <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input className="form-control" placeholder="Search agents..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Agent</th><th>Phone</th><th>Vehicle</th><th>Zone</th><th>Deliveries</th><th>Rating</th><th>Earnings</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i) => <SkeletonRow key={i} cols={9} />) :
               agents.length === 0 ? <tr><td colSpan={9}><EmptyState icon="fa-solid fa-motorcycle" text="No agents" /></td></tr> :
               agents.map(a => (
                <tr key={a._id}>
                  <td>
                    <div className="fw-600">{a.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{a.email}</div>
                  </td>
                  <td>{a.phone}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.vehicleType} {a.vehicleNumber && <span className="text-muted">({a.vehicleNumber})</span>}</td>
                  <td>{a.zone || '—'}</td>
                  <td>{a.totalDeliveries}</td>
                  <td><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> {a.rating?.toFixed(1)}</td>
                  <td className="fw-600">{fmt.currency(a.earnings)}</td>
                  <td><span className={`badge badge-${a.isAvailable ? 'delivered' : 'cancelled'}`}>{a.isAvailable ? 'Available' : 'Busy'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(a)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => del(a._id, a.name)}><i className="fa-solid fa-trash" /></button>
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
        <Modal title={editing ? 'Edit Agent' : 'Add Agent'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" form="agent-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <form id="agent-form" ref={formRef} onSubmit={save}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-control" placeholder="Enter agent name" value={form.name} onChange={e => f('name', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" placeholder="Enter email address" value={form.email} onChange={e => f('email', e.target.value)} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone *</label><input className="form-control" type="tel" name="phone" placeholder="Enter 10-digit phone number" pattern="\d{10}" value={form.phone} onChange={e => f('phone', e.target.value)} required /></div>
              <div className="form-group">
                <label className="form-label">Vehicle Type *</label>
                <select className="form-control" value={form.vehicleType} onChange={e => f('vehicleType', e.target.value)} required>
                  {['cycle','bike','scooter'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Vehicle Number *</label><input className="form-control" placeholder="Enter vehicle number" value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Zone *</label><input className="form-control" placeholder="Enter delivery zone" value={form.zone} onChange={e => f('zone', e.target.value)} required /></div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[['isAvailable','Available'],['isActive','Active']].map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={!!form[k]} onChange={e => f(k, e.target.checked)} />{l}
                </label>
              ))}
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
