import { useEffect, useState, useCallback } from 'react';
import { foodAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import Pagination from '../../components/ui/Pagination';
import { SkeletonRow, EmptyState } from '../../components/ui/Loaders';
import Modal from '../../components/ui/Modal';
import ImageUpload from '../../components/ui/ImageUpload';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';
import { buildFormData } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', price: '', discountPrice: '', category: '', restaurant: '', isAvailable: true, isVeg: false, isFeatured: false, preparationTime: 15, stock: -1 };

export default function Food() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', category: '' });
  const [modal, setModal] = useState(null); // null | 'food' | 'category'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catImage, setCatImage] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const { isOpen: confirmOpen, config: confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [f, c, r] = await Promise.all([foodAPI.getAll(params), foodAPI.getCategories(), import('../../api').then(m => m.restaurantsAPI.getAll())]);
      setFoods(f.data.data);
      setPagination(f.data.pagination);
      setCategories(c.data.data);
      setRestaurants(r.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openFood = (food = null) => {
    setEditing(food);
    setForm(food ? { ...food, category: food.category?._id || food.category, restaurant: food.restaurant?._id || food.restaurant } : EMPTY_FORM);
    setImage(null);
    setModal('food');
  };

  const saveFood = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData({ ...form });
      if (image) fd.append('image', image);
      if (editing) await foodAPI.update(editing._id, fd);
      else await foodAPI.create(fd);
      toast.success(editing ? 'Food updated' : 'Food created');
      setModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteFood = async (id, name) => {
    const confirmed = await confirm({
      title: 'Delete Food Item',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await foodAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleAvail = async (id) => {
    try { await foodAPI.toggle(id); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const saveCat = async (e) => {
    e.preventDefault();
    try {
      const fd = buildFormData({ ...catForm });
      if (catImage) fd.append('image', catImage);
      if (editingCat) await foodAPI.updateCategory(editingCat._id, fd);
      else await foodAPI.createCategory(fd);
      toast.success('Category saved');
      setModal(null);
      load();
    } catch { toast.error('Save failed'); }
  };

  const deleteCat = async (id, name) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try { await foodAPI.deleteCategory(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Food & Menu</h1><p>Manage food items and categories</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setEditingCat(null); setCatForm({ name: '', description: '' }); setCatImage(null); setModal('category'); }}>+ Category</button>
          <button className="btn btn-primary" onClick={() => openFood()}>+ Add Food</button>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filters.category === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilters(f => ({ ...f, category: '', page: 1 }))}>All</button>
        {categories.map(c => (
          <button key={c._id} className={`btn btn-sm ${filters.category === c._id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilters(f => ({ ...f, category: c._id, page: 1 }))}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ maxWidth: 300 }}>
            <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input className="form-control" placeholder="Search food..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Restaurant</th><th>Available</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={7} />) :
               foods.length === 0 ? <tr><td colSpan={7}><EmptyState icon="fa-solid fa-burger" text="No food items" /></td></tr> :
               foods.map(f => (
                <tr key={f._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {f.image ? <img src={f.image} alt={f.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-burger" /></div>}
                      <div>
                        <div className="fw-600">{f.name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{f.isVeg ? <><i className="fa-solid fa-circle" style={{ color: 'green', fontSize: 10 }} /> Veg</> : <><i className="fa-solid fa-circle" style={{ color: 'red', fontSize: 10 }} /> Non-veg</>}</div>
                      </div>
                    </div>
                  </td>
                  <td>{f.category?.name || '—'}</td>
                  <td>
                    <div className="fw-600">{fmt.currency(f.price)}</div>
                    {f.discountPrice > 0 && <div className="text-muted" style={{ fontSize: 12, textDecoration: 'line-through' }}>{fmt.currency(f.discountPrice)}</div>}
                  </td>
                  <td>{f.restaurant?.name || '—'}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={f.isAvailable} onChange={() => toggleAvail(f._id)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>{f.isFeatured ? <i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openFood(f)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteFood(f._id, f.name)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
      </div>

      {/* Food Modal */}
      {modal === 'food' && (
        <Modal title={editing ? 'Edit Food Item' : 'Add Food Item'} onClose={() => setModal(null)} size="lg"
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" form="food-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <form id="food-form" onSubmit={saveFood}>
            <ImageUpload value={image || form.image} onChange={setImage} />
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Restaurant *</label>
              <select className="form-control" value={form.restaurant} onChange={e => setForm(f => ({ ...f, restaurant: e.target.value }))} required>
                <option value="">Select restaurant</option>
                {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Price *</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Price</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Prep Time (min)</label>
                <input className="form-control" type="number" min="1" value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 8 }}>Food Type *</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="foodType" checked={form.isVeg === true} onChange={() => setForm(f => ({ ...f, isVeg: true }))} />
                    <i className="fa-solid fa-circle" style={{ color: 'green', fontSize: 10 }} /> Vegetarian
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="foodType" checked={form.isVeg === false} onChange={() => setForm(f => ({ ...f, isVeg: false }))} />
                    <i className="fa-solid fa-circle" style={{ color: 'red', fontSize: 10 }} /> Non-Vegetarian
                  </label>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {[['isFeatured','Featured'],['isAvailable','Available']].map(([key, lbl]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  {key === 'isFeatured' ? <><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> {lbl}</> : <><i className="fa-solid fa-circle-check" style={{ color: 'green' }} /> {lbl}</>}
                </label>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {/* Category Modal */}
      {modal === 'category' && (
        <Modal title={editingCat ? 'Edit Category' : 'Add Category'} onClose={() => setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" form="cat-form" type="submit">Save</button></>}>
          <form id="cat-form" onSubmit={saveCat}>
            <ImageUpload value={catImage || catForm.image} onChange={setCatImage} label="Category Image" />
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-control" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </form>
          {categories.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Existing Categories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(c => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg)', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13 }}>
                    {c.image && <img src={c.image} alt={c.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />}
                    {c.name}
                    <button className="btn btn-ghost" style={{ padding: '0 4px', fontSize: 11 }} onClick={() => { setEditingCat(c); setCatForm({ name: c.name, description: c.description || '', image: c.image || '' }); setCatImage(null); }}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-ghost" style={{ padding: '0 4px', fontSize: 11 }} onClick={() => deleteCat(c._id, c.name)}><i className="fa-solid fa-xmark" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
