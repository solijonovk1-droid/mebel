import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import { supabase } from '../lib/supabase';
import type { Product, Order } from '../lib/supabase';

type Tab = 'dashboard' | 'products' | 'orders';
type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  delivered: 'Yetkazilgan',
  cancelled: 'Bekor qilingan',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#faad14',
  confirmed: '#1890ff',
  delivered: '#52c41a',
  cancelled: '#ff4d4f',
};

const CATEGORIES = ['TV', 'Sovutgich', 'Kir yuvish', 'Smartfon', 'Boshqa'];

const EMPTY_FORM: Omit<Product, 'id' | 'created_at'> = {
  name: '',
  price: 0,
  price_text: '',
  image: '',
  category: 'TV',
};

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('adminToken') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  const [tab, setTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Product form
  const [form, setForm] = useState<Omit<Product, 'id' | 'created_at'>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (failedAttempts >= 3) {
      setIsLocked(true);
      setError("Ko'p xato urinishlar! Tizim 30 soniyaga bloklandi.");
      const timer = setTimeout(() => {
        setIsLocked(false);
        setFailedAttempts(0);
        setError('');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [failedAttempts]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminToken', 'true');
      setError('');
      setFailedAttempts(0);
    } else {
      setFailedAttempts(prev => prev + 1);
      setError("Noto'g'ri parol!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminToken');
  };

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoadingProducts(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadOrders();

      const productsChannel = supabase
        .channel('admin:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          loadProducts();
        })
        .subscribe();

      const ordersChannel = supabase
        .channel('admin:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAuthenticated, loadProducts, loadOrders]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.price || !form.image || !form.price_text) {
      setFormError("Barcha majburiy maydonlarni to'ldiring!");
      return;
    }
    setFormLoading(true);
    if (editingId !== null) {
      const { error } = await supabase.from('products').update(form).eq('id', editingId);
      if (error) {
        setFormError(error.message);
      } else {
        showToast('Mahsulot yangilandi ✅');
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert([form]);
      if (error) {
        setFormError(error.message);
      } else {
        showToast('Mahsulot qo\'shildi ✅');
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadProducts();
      }
    }
    setFormLoading(false);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      price: product.price,
      price_text: product.price_text,
      image: product.image,
      category: product.category,
    });
    setEditingId(product.id as number);
    setShowForm(true);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`"${name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      showToast('Xato: ' + error.message);
    } else {
      showToast('Mahsulot o\'chirildi 🗑️');
      loadProducts();
    }
  };

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      showToast(`Holat yangilandi: ${STATUS_LABELS[status]}`);
      loadOrders();
    }
  };

  const stats = {
    products: products.length,
    orders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0),
  };

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div className="modal-content glass" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '1.5rem' }}>Admin Panelga Kirish</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <input
                type="password"
                placeholder="Admin parolini kiriting"
                className="form-input w-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p style={{ color: '#ff4d4f', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isLocked} style={{ opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
              {isLocked ? 'Bloklangan' : 'Kirish'}
            </button>
            <a href="/" style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '1rem' }}>
              &larr; Bosh sahifaga qaytish
            </a>
          </form>
        </div>
      </div>
    );
  }

  // ─── ADMIN PANEL ───────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--accent-color)', color: '#fff',
          padding: '0.8rem 1.5rem', borderRadius: 12, fontWeight: 600,
          boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      <nav className="navbar glass" style={{ position: 'sticky' }}>
        <div className="logo">Quvonch<span>Admin</span></div>
        <div className="admin-tabs">
          {(['dashboard', 'products', 'orders'] as Tab[]).map(t => (
            <button
              key={t}
              className={`admin-tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'dashboard' ? '📊 Dashboard' : t === 'products' ? '📦 Mahsulotlar' : '🧾 Buyurtmalar'}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline theme-btn" onClick={toggleTheme} title="Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-outline" onClick={handleLogout}>Chiqish</button>
          <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Do'konga &rarr;</a>
        </div>
      </nav>

      <div className="admin-body">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <>
            <h1 className="admin-title">Boshqaruv Paneli</h1>
            <div className="stats-grid">
              <div className="stat-card glass">
                <div className="stat-icon">📦</div>
                <div>
                  <p className="stat-label">Jami Mahsulotlar</p>
                  <p className="stat-value" style={{ color: 'var(--accent-color)' }}>{stats.products}</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon">🧾</div>
                <div>
                  <p className="stat-label">Jami Buyurtmalar</p>
                  <p className="stat-value" style={{ color: '#1890ff' }}>{stats.orders}</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon">⏳</div>
                <div>
                  <p className="stat-label">Kutilmoqda</p>
                  <p className="stat-value" style={{ color: '#faad14' }}>{stats.pending}</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon">💰</div>
                <div>
                  <p className="stat-label">Kirim (Yetkazilgan)</p>
                  <p className="stat-value" style={{ color: '#52c41a' }}>{stats.revenue.toLocaleString()} so'm</p>
                </div>
              </div>
            </div>

            <h2 className="admin-subtitle">So'nggi Buyurtmalar</h2>
            <div className="admin-table-wrap glass">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mijoz</th>
                    <th>Telefon</th>
                    <th>Jami</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.phone}</td>
                      <td>{(order.total || 0).toLocaleString()} so'm</td>
                      <td>
                        <span className="status-badge" style={{ background: STATUS_COLORS[order.status as OrderStatus] + '22', color: STATUS_COLORS[order.status as OrderStatus] }}>
                          {STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>Hali buyurtma yo'q</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="admin-title" style={{ marginBottom: 0 }}>Mahsulotlar</h1>
              <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); setFormError(''); }}>
                {showForm ? '✕ Yopish' : '+ Yangi Mahsulot'}
              </button>
            </div>

            {/* Product Form */}
            {showForm && (
              <form onSubmit={handleFormSubmit} className="admin-form glass">
                <h3 style={{ color: 'var(--accent-color)', marginBottom: '1.5rem' }}>
                  {editingId ? '✏️ Mahsulotni tahrirlash' : '➕ Yangi mahsulot qo\'shish'}
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nomi *</label>
                    <input type="text" className="form-input" placeholder="Samsung Smart TV 55&quot;" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Narxi (so'm) *</label>
                    <input type="number" className="form-input" placeholder="6500000" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label>Muddatli to'lov matni *</label>
                    <input type="text" className="form-input" placeholder="12 oy x 541,600 so'm" value={form.price_text} onChange={e => setForm(p => ({ ...p, price_text: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Kategoriya *</label>
                    <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Rasm URL *</label>
                    <input type="text" className="form-input" placeholder="https://images.unsplash.com/..." value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} />
                  </div>
                </div>
                {formError && <p style={{ color: '#ff4d4f', margin: '0.5rem 0' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Qo\'shish'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}>Bekor qilish</button>
                </div>
              </form>
            )}

            {/* Products Table */}
            {loadingProducts ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>Yuklanmoqda...</p>
            ) : (
              <div className="admin-table-wrap glass" style={{ marginTop: '1.5rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rasm</th>
                      <th>Nomi</th>
                      <th>Kategoriya</th>
                      <th>Narxi</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td><img src={p.image} alt={p.name} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 8 }} /></td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="category-badge">{p.category}</span></td>
                        <td>{p.price.toLocaleString()} so'm</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => handleEdit(p)}>✏️ Tahrir</button>
                            <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: 30 }} onClick={() => handleDelete(p.id as number, p.name)}>🗑️ O'chir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>Mahsulotlar yo'q. Yangi qo'shing!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── ORDERS ── */}
        {tab === 'orders' && (
          <>
            <h1 className="admin-title">Buyurtmalar</h1>
            {loadingOrders ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>Yuklanmoqda...</p>
            ) : (
              <div className="admin-table-wrap glass">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mijoz</th>
                      <th>Telefon</th>
                      <th>Manzil</th>
                      <th>Mahsulotlar</th>
                      <th>Jami</th>
                      <th>Sana</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                        <td>{order.phone}</td>
                        <td>{order.address}</td>
                        <td style={{ maxWidth: 200 }}>
                          {(order.items || []).map((item, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>• {item.name}</div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>{(order.total || 0).toLocaleString()} so'm</td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('uz-UZ') : '—'}
                        </td>
                        <td>
                          <select
                            className="form-input"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', color: STATUS_COLORS[order.status as OrderStatus] }}
                            value={order.status}
                            onChange={e => handleStatusChange(order.id as number, e.target.value as OrderStatus)}
                          >
                            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>Hali buyurtma yo'q</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
