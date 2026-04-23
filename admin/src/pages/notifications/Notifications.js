import { useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import { EmptyState, LoadingCenter } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import toast from 'react-hot-toast';

const EMPTY = { title: '', message: '', type: 'system', target: 'all', channels: ['push'] };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await notificationsAPI.getAll(); setItems(data.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (notification = null) => {
    setEditing(notification);
    if (notification) {
      setForm({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        target: notification.target,
        channels: notification.channels || ['push']
      });
    } else {
      setForm(EMPTY);
    }
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await notificationsAPI.update(editing._id, form);
        toast.success('Updated');
      } else {
        await notificationsAPI.create(form);
        toast.success('Created');
      }
      setModal(false);
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const send = async (id) => {
    try { await notificationsAPI.send(id); toast.success('Notification sent!'); load(); }
    catch { toast.error('Send failed'); }
  };

  const del = async (id, title) => {
    const confirmed = await confirm({
      title: 'Delete Notification',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await notificationsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleChannel = (ch) => setForm(f => ({
    ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch]
  }));

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const TYPE_ICONS = { order: 'fa-solid fa-receipt', promotion: 'fa-solid fa-tag', system: 'fa-solid fa-gear', alert: 'fa-solid fa-triangle-exclamation' };

  if (loading) return <LoadingCenter />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Notifications</h1><p>Send push and email notifications</p></div>
        <button className="btn btn-primary" onClick={() => open()}>+ Create Notification</button>
      </div>

      {items.length === 0 ? (
        <div className="card"><EmptyState icon="fa-solid fa-bell" text="No notifications yet" sub="Create your first notification" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(n => (
            <div className="card" key={n._id}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ fontSize: 28 }}><i className={TYPE_ICONS[n.type] || 'fa-solid fa-bell'} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="fw-600">{n.title}</span>
                    <span className={`badge badge-${n.status === 'sent' ? 'delivered' : n.status === 'draft' ? 'pending' : 'confirmed'}`}>{n.status}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{n.type}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>{n.message}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Target: {n.target}</span>
                    <span>Channels: {n.channels?.join(', ')}</span>
                    {n.sentAt && <span>Sent: {fmt.ago(n.sentAt)}</span>}
                    <span>By: {n.createdBy?.name || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {n.status === 'draft' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => send(n._id)}>Send Now</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(n)} title="Edit"><i className="fa-solid fa-pen" /></button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => del(n._id, n.title)}><i className="fa-solid fa-trash" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Notification' : 'Create Notification'} onClose={() => { setModal(false); setEditing(null); setForm(EMPTY); }}
          footer={<><button className="btn btn-secondary" onClick={() => { setModal(false); setEditing(null); setForm(EMPTY); }}>Cancel</button><button className="btn btn-primary" form="notif-form" type="submit" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button></>}>
          <form id="notif-form" onSubmit={save}>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e => f('title', e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Message *</label><textarea className="form-control" rows={3} value={form.message} onChange={e => f('message', e.target.value)} required /></div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type} onChange={e => f('type', e.target.value)}>
                  {['order','promotion','system','alert'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target</label>
                <select className="form-control" value={form.target} onChange={e => f('target', e.target.value)}>
                  {['all','specific','segment'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Channels</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {['push','email','sms'].map(ch => (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)} />
                    {ch.toUpperCase()}
                  </label>
                ))}
              </div>
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
