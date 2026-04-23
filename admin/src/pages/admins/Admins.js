import { useEffect, useState, useCallback } from 'react';
import { adminsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { fmt, getInitials, avatarColor } from '../../utils/helpers';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

const ALL_PERMS = ['dashboard','orders','food','restaurants','users','payments','delivery','reviews','coupons','notifications','settings','admins','inventory'];
const EMPTY = { name: '', email: '', password: '', role: 'staff', permissions: ['dashboard','orders'], isActive: true };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { admin: me } = useAuth();
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminsAPI.getAll(); setAdmins(data.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (a = null) => {
    setEditing(a);
    setForm(a ? { ...a, password: '' } : EMPTY);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) await adminsAPI.update(editing._id, payload);
      else await adminsAPI.create(payload);
      toast.success('Saved'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (id === me?._id) return toast.error("Can't delete yourself");
    const confirmed = await confirm({
      title: 'Delete Admin',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await adminsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (id) => {
    try { await adminsAPI.toggle(id); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const togglePerm = (perm) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm]
    }));
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Admin Management</h1><p>Manage admin users and permissions</p></div>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Admin</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Admin</th><th>Role</th><th>Permissions</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:4}).map((_,i) => <SkeletonRow key={i} cols={6} />) :
               admins.length === 0 ? <tr><td colSpan={6}><EmptyState icon="fa-solid fa-user-tie" text="No admins" /></td></tr> :
               admins.map(a => (
                <tr key={a._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: avatarColor(a.name) }}>{getInitials(a.name)}</div>
                      <div>
                        <div className="fw-600">{a.name} {a._id === me?._id && <span style={{ fontSize: 11, color: 'var(--primary)' }}>(you)</span>}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${a.role}`}>{a.role?.replace('_', ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 300 }}>
                      {a.role === 'super_admin' ? <span className="badge badge-super_admin">All Permissions</span> :
                        a.permissions?.slice(0, 4).map(p => <span key={p} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 10 }}>{p}</span>)}
                      {a.permissions?.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{a.permissions.length - 4} more</span>}
                    </div>
                  </td>
                  <td className="text-muted">{a.lastLogin ? fmt.ago(a.lastLogin) : 'Never'}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={a.isActive} onChange={() => toggle(a._id)} disabled={a._id === me?._id} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(a)}><i className="fa-solid fa-pen" /></button>
                      {a._id !== me?._id && <button className="btn btn-ghost btn-sm" onClick={() => del(a._id, a.name)}><i className="fa-solid fa-trash" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Admin' : 'Add Admin'} onClose={() => setModal(false)} size="lg"
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" form="admin-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <form id="admin-form" onSubmit={save}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={e => f('name', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label><input className="form-control" type="password" value={form.password} onChange={e => f('password', e.target.value)} required={!editing} /></div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role} onChange={e => f('role', e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            {form.role !== 'super_admin' && (
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {ALL_PERMS.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 20, background: form.permissions.includes(p) ? 'var(--primary-light)' : 'var(--bg)', color: form.permissions.includes(p) ? 'var(--primary)' : 'var(--text)' }}>
                      <input type="checkbox" style={{ display: 'none' }} checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} />{p}
                    </label>
                  ))}
                </div>
              </div>
            )}
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
