import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { supabase, signIn, signUp } from '../lib/supabase';
import type { Product, OrderItem } from '../lib/supabase';

const CATEGORIES = ['Barchasi', 'TV', 'Sovutgich', 'Kir yuvish', 'Smartfon', 'Boshqa'];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: 'Samsung Smart TV 55"', price: 6500000, price_text: "12 oy x 541,600 so'm", image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80', category: 'TV' },
  { id: 2, name: 'LG Inverter Sovutgich', price: 8400000, price_text: "12 oy x 700,000 so'm", image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80', category: 'Sovutgich' },
  { id: 3, name: 'Kir yuvish mashinasi 8kg', price: 4200000, price_text: "12 oy x 350,000 so'm", image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80', category: 'Kir yuvish' },
  { id: 4, name: 'iPhone 15 Pro Max', price: 18500000, price_text: "12 oy x 1,541,600 so'm", image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', category: 'Smartfon' },
  { id: 5, name: 'Samsung Galaxy S24', price: 12000000, price_text: "12 oy x 1,000,000 so'm", image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80', category: 'Smartfon' },
  { id: 6, name: 'LG 65" OLED TV', price: 22000000, price_text: "12 oy x 1,833,000 so'm", image: 'https://images.unsplash.com/photo-1571415060716-baff5f717c37?auto=format&fit=crop&w=800&q=80', category: 'TV' },
];

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

type AuthMode = 'login' | 'register';

function Home() {
  const navigate = useNavigate();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+998');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // ── Products / Cart / Orders ─────────────────────────────────────────────
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('+998');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMonths, setCheckoutMonths] = useState<number>(1);
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+998');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setLoginError('');
    setRegError('');
    setRegSuccess(false);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPhone('+998');
    setRegPassword('');
    setRegPassword2('');
    setRegError('');
    setLoginError('');
    setRegSuccess(false);
  };

  // ── Supabase Auth listener ───────────────────────────────────────────────
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Email va parolni kiriting!");
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
    if (error) {
      setLoginError(error);
    } else {
      showToast('Muvaffaqiyatli kirdingiz! 👋');
      closeAuth();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) { setRegError("Ismingizni kiriting!"); return; }
    if (!regEmail.trim()) { setRegError("Email kiriting!"); return; }
    if (!regPhone.trim()) { setRegError("Telefon raqam kiriting!"); return; }
    if (regPassword.length < 6) { setRegError("Parol kamida 6 ta belgi bo'lishi kerak!"); return; }
    if (regPassword !== regPassword2) { setRegError("Parollar mos kelmadi!"); return; }

    setRegLoading(true);
    const { error } = await signUp(regEmail, regPassword, regName, regPhone);
    setRegLoading(false);

    if (error) {
      setRegError(error);
    } else {
      setRegSuccess(true);
    }
  };

  // ── Scroll + Menu ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    document.addEventListener('scroll', onScroll);
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.navbar')) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // ── Products ─────────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setProducts(DEFAULT_PRODUCTS);
    } else if (data && data.length > 0) {
      setProducts(data);
    } else {
      // Agar baza bo'sh bo'lsa, vaqtincha default mahsulotlarni ko'rsatamiz
      setProducts(DEFAULT_PRODUCTS);
    }
    setLoadingProducts(false);
  }, []);

  useEffect(() => { 
    loadProducts(); 
    
    // Realtime changes for products
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const filteredProducts = selectedCategory === 'Barchasi'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // ── Cart ─────────────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCartItems(prev => [...prev, product]);
    showToast(`${product.name} savatga qo'shildi! 🛒`);
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.price, 0);

  // ── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      showToast("Barcha maydonlarni to'ldiring!", 'error');
      return;
    }
    setCheckoutLoading(true);

    const orderItems: OrderItem[] = cartItems.map(item => ({
      id: item.id as number,
      name: item.name,
      price: item.price,
    }));

    let finalAddress = `${checkoutAddress} (${checkoutMonths > 1 ? checkoutMonths + " oyga bo'lib to'lash" : "To'liq to'lov"})`;
    if (isForSomeoneElse) {
      finalAddress += ` | Qabul qiluvchi: ${recipientName} (${recipientPhone})`;
    }

    const order: any = {
      customer_name: checkoutName,
      phone: checkoutPhone,
      address: finalAddress,
      items: orderItems,
      total: cartTotal,
      status: 'pending',
    };
    if (user?.id) order.user_id = user.id;

    const { error } = await supabase.from('orders').insert([order]);
    setCheckoutLoading(false);

    if (error) {
      console.error('Order error:', error);
      showToast("Xato yuz berdi! Qayta urinib ko'ring.", 'error');
    } else {
      setIsCheckoutOpen(false);
      setCartItems([]);
      setCheckoutName('');
      setCheckoutPhone('+998');
      setCheckoutAddress('');
      setCheckoutMonths(1);
      setIsForSomeoneElse(false);
      setRecipientName('');
      setRecipientPhone('+998');
      showToast("Buyurtmangiz qabul qilindi! Operatorlar siz bilan bog'lanishadi. ✅");
    }
  };

  // ── User display name ─────────────────────────────────────────────────────
  const userName = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ')[0]
    : user?.email?.split('@')[0] ?? '';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* ── Navbar ── */}
      <nav className={`navbar ${scrolled ? 'glass' : ''}`}>
        <div className="logo">Quvonch<span>.</span></div>

        <ul className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <li><a href="#home" onClick={e => { e.preventDefault(); scrollTo('home'); }}>Bosh sahifa</a></li>
          <li><a href="#catalog" onClick={e => { e.preventDefault(); scrollTo('catalog'); }}>Katalog</a></li>
          <li><a href="#installment" onClick={e => { e.preventDefault(); scrollTo('installment'); }}>Muddatli to'lov</a></li>
          <li><a href="#about" onClick={e => { e.preventDefault(); scrollTo('about'); }}>Biz haqimizda</a></li>
        </ul>

        <div className="nav-actions">
          <button className="btn btn-outline theme-btn" onClick={toggleTheme} title="Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {authLoading ? null : user ? (
            <div className="user-menu" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Profilga o'tish">
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{userName}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => openAuth('login')}>Kirish</button>
              <button className="btn btn-primary" onClick={() => openAuth('register')}>Ro'yxat</button>
            </div>
          )}

          <button className="btn cart-btn btn-primary" onClick={() => setIsCartOpen(true)}>
            🛒
            {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
          </button>

          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1 className="hero-title">Eng so'nggi maishiy texnikalar uyingiz uchun</h1>
          <p className="hero-subtitle">
            Katta va kichik maishiy texnikalarni, elektronika va boshqa jihozlarni
            12 oygacha muddatli to'lov asosida xarid qiling. Boshlang'ich to'lovsiz!
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary"
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
              onClick={() => scrollTo('catalog')}
            >
              Katalogni ko'rish
            </button>
            {!user && (
              <button
                className="btn btn-outline"
                style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                onClick={() => openAuth('register')}
              >
                Ro'yxatdan o'tish →
              </button>
            )}
          </div>
        </div>

        <div className="hero-image-container">
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%)',
            zIndex: -1,
            borderRadius: '50%',
            filter: 'blur(40px)',
          }} />
          <img
            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
            alt="Zamonaviy maishiy texnika"
            className="hero-image"
          />
          <div className="floating-badge glass">
            <span className="badge-title">0%</span>
            <span className="badge-subtitle">Boshlang'ich to'lov</span>
          </div>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="section-wrapper catalog-section" id="catalog">
        <h2 className="section-title">Ommabop mahsulotlar</h2>

        <div className="category-filter">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <div className="loading-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-img" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <p style={{ color: 'var(--text-light)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0' }}>
                Bu kategoriyada mahsulot yo'q.
              </p>
            ) : filteredProducts.map(item => (
              <div key={item.id} className="product-card">
                <div className="product-img-wrapper">
                  <img src={item.image} alt={item.name} className="product-img-placeholder" />
                  <span className="category-badge">{item.category}</span>
                </div>
                <h3>{item.name}</h3>
                <p style={{ color: 'var(--text-light)', margin: '0.5rem 0', fontSize: '0.9rem' }}>{item.price_text}</p>
                <button className="btn btn-outline w-100 mt-2 mb-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                  {item.price.toLocaleString()} so'm
                </button>
                <button className="btn btn-primary w-100" onClick={() => addToCart(item)}>
                  Savatga qo'shish
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Installment ── */}
      <section className="section-wrapper installment-section" id="installment">
        <h2 className="section-title">Muddatli to'lov shartlari</h2>
        <div className="features-grid">
          {[
            { icon: '📝', title: "Faqat Pasport", desc: "Hech qanday ortiqcha hujjatlarsiz, faqat pasport orqali rasmiylashtiring." },
            { icon: '🎯', title: "0% Boshlang'ich", desc: "Tovarni bugun oling, to'lovni esa keyingi oydan boshlang." },
            { icon: '⏳', title: "12 Oygacha", desc: "To'lovni o'zingizga qulay bo'lgan 3, 6, 9 yoki 12 oyga bo'lib to'lang." },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section className="section-wrapper about-section" id="about">
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title">Biz haqimizda</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', lineHeight: '1.8' }}>
            <strong>Quvonch Platformasi</strong> — mijozlarga eng zamonaviy maishiy texnikalar,
            smartfonlar va elektronika mahsulotlarini qulay shartlarda xarid qilish imkoniyatini
            beruvchi yirik onlayn do'kon. Samsung, LG, Artel, Haier kabi brendlarning ishonchli
            hamkorimiz.
          </p>
          <br />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '500' }}>
            O'zbekiston bo'ylab bepul yetkazib berish xizmati mavjud! 🚚
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo footer-logo">Quvonch<span>.</span></div>
            <p>Zamonaviy texnikalar, qulay muddatli to'lov bilan.</p>
          </div>
          <div className="footer-links">
            <h4>Sahifalar</h4>
            <ul>
              {['home', 'catalog', 'installment', 'about'].map(id => (
                <li key={id}><a href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id); }}>
                  {{ home: 'Bosh sahifa', catalog: 'Katalog', installment: "Muddatli to'lov", about: 'Biz haqimizda' }[id]}
                </a></li>
              ))}
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Aloqa</h4>
            <ul>
              <li>📞 +998 90 123 45 67</li>
              <li>✉️ info@quvonch.uz</li>
              <li>📍 Toshkent, O'zbekiston</li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Ijtimoiy tarmoqlar</h4>
            <div className="social-links">
              <a href="https://t.me/quvonch_shop" target="_blank" rel="noreferrer" className="social-btn">✈️ Telegram</a>
              <a href="https://instagram.com/quvonch_shop" target="_blank" rel="noreferrer" className="social-btn">📷 Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Quvonch Platformasi. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════
          AUTH MODAL (Login / Register)
      ══════════════════════════════════════════════════════════════════════ */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={closeAuth}>
          <div className="modal-content auth-modal glass" onClick={e => e.stopPropagation()}>

            {/* Auth Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setLoginError(''); setRegError(''); setRegSuccess(false); }}
              >
                Kirish
              </button>
              <button
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setLoginError(''); setRegError(''); setRegSuccess(false); }}
              >
                Ro'yxat
              </button>
            </div>

            {/* ── Login ── */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-icon">🔐</div>
                <h2 className="auth-title">Xush kelibsiz!</h2>
                <p className="auth-subtitle">Hisobingizga kiring</p>

                <div className="form-group">
                  <label className="form-label">📧 Email manzil</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="sizning@email.com"
                    className="form-input"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🔒 Parol</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="form-input"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {loginError && <div className="auth-error">{loginError}</div>}

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loginLoading}
                  style={{ marginTop: '0.5rem', padding: '0.85rem' }}
                >
                  {loginLoading ? (
                    <span className="spinner" />
                  ) : 'Kirish →'}
                </button>

                <p className="auth-switch">
                  Hisobingiz yo'qmi?{' '}
                  <button type="button" className="auth-link" onClick={() => { setAuthMode('register'); setLoginError(''); }}>
                    Ro'yxatdan o'ting
                  </button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                {regSuccess ? (
                  <div className="reg-success">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.75rem' }}>Deyarli tayyor!</h3>
                    <p style={{ color: 'var(--text-light)', lineHeight: 1.7 }}>
                      <strong>{regEmail}</strong> manziliga tasdiqlash xati yuborildi.
                      Pochtangizni oching va havolani bosing.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      style={{ marginTop: '1.5rem' }}
                      onClick={() => { setAuthMode('login'); setRegSuccess(false); }}
                    >
                      Kirish sahifasiga o'tish
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="auth-icon">👤</div>
                    <h2 className="auth-title">Ro'yxatdan o'ting</h2>
                    <p className="auth-subtitle">Yangi hisob yarating</p>

                    <div className="form-group">
                      <label className="form-label">👤 To'liq ism</label>
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Ism Familiya"
                        className="form-input"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">📧 Email manzil</label>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="sizning@email.com"
                        className="form-input"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">📞 Telefon raqam</label>
                      <input
                        id="reg-phone"
                        type="text"
                        placeholder="+998901234567"
                        className="form-input"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🔒 Parol</label>
                      <input
                        id="reg-password"
                        type="password"
                        placeholder="Kamida 6 ta belgi"
                        className="form-input"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🔒 Parolni tasdiqlang</label>
                      <input
                        id="reg-password2"
                        type="password"
                        placeholder="Parolni qayta kiriting"
                        className="form-input"
                        value={regPassword2}
                        onChange={e => setRegPassword2(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    {regError && <div className="auth-error">{regError}</div>}

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={regLoading}
                      style={{ marginTop: '0.5rem', padding: '0.85rem' }}
                    >
                      {regLoading ? <span className="spinner" /> : "Ro'yxatdan o'tish →"}
                    </button>

                    <p className="auth-switch">
                      Hisobingiz bormi?{' '}
                      <button type="button" className="auth-link" onClick={() => { setAuthMode('login'); setRegError(''); }}>
                        Kiring
                      </button>
                    </p>
                  </>
                )}
              </form>
            )}

            <button className="modal-close-x" onClick={closeAuth} aria-label="Yopish">×</button>
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Buyurtmani rasmiylashtirish</h2>
            
            <input type="text" placeholder="Sizning ismingiz" className="form-input" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} />
            <input type="text" placeholder="Sizning telefon raqamingiz (istalgan davlat)" className="form-input" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} />
            <input type="text" placeholder="Yetkazib berish manzili (O'zbekiston bo'ylab)" className="form-input" value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="forSomeoneElse" 
                checked={isForSomeoneElse} 
                onChange={e => setIsForSomeoneElse(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              <label htmlFor="forSomeoneElse" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Boshqa odamga yuborish (Masalan: O'zbekistondagi yaqiningizga)
              </label>
            </div>

            {isForSomeoneElse && (
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'heroFadeInUp 0.3s forwards' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>Qabul qiluvchining ma'lumotlari</label>
                <input type="text" placeholder="Ismi va familiyasi" className="form-input" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                <input type="text" placeholder="O'zbekistondagi telefon raqami (+998...)" className="form-input" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
              </div>
            )}

            <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>To'lov turi va muddati</label>
              <select 
                className="form-input" 
                value={checkoutMonths} 
                onChange={e => setCheckoutMonths(Number(e.target.value))}
              >
                <option value={1}>To'liq to'lov (1 oy)</option>
                <option value={3}>3 oyga bo'lib to'lash</option>
                <option value={6}>6 oyga bo'lib to'lash</option>
                <option value={9}>9 oyga bo'lib to'lash</option>
                <option value={12}>12 oyga bo'lib to'lash</option>
              </select>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Jami narx:</span>
                <strong style={{ color: 'var(--primary-color)' }}>{cartTotal.toLocaleString()} so'm</strong>
              </p>
              {checkoutMonths > 1 && (
                <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Oylik to'lov:</span>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>
                    {Math.round(cartTotal / checkoutMonths).toLocaleString()} so'm/oy
                  </strong>
                </p>
              )}
            </div>

            <input type="text" placeholder="Ismingiz" className="form-input" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} />
            <input type="text" placeholder="+998 telefon raqamingiz" className="form-input" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} />
            <input type="text" placeholder="Manzilingiz (Shahar, tuman)" className="form-input" value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary w-100" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? <span className="spinner" /> : 'Buyurtma berish ✅'}
              </button>
              <button className="btn btn-outline w-100" onClick={() => setIsCheckoutOpen(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ── */}
      <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        {/* Gradient accent bar */}
        <div className="cart-accent-bar" />

        <div className="cart-header">
          <div className="cart-header-left">
            <div className="cart-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <div>
              <h2 className="cart-title">Savat</h2>
              <span className="cart-count">{cartItems.length} ta mahsulot</span>
            </div>
          </div>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Yopish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="55" fill="var(--bg-color)" stroke="var(--border-color)" strokeWidth="2"/>
                  <path d="M35 45h6l3 20h32l4-14H47" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                  <circle cx="52" cy="72" r="3" fill="var(--accent-color)" opacity="0.5"/>
                  <circle cx="72" cy="72" r="3" fill="var(--accent-color)" opacity="0.5"/>
                  <path d="M50 55l20-2" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                  <path d="M48 50l25-1" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </div>
              <h3 className="cart-empty-title">Savat bo'sh</h3>
              <p className="cart-empty-text">Katalogdan o'zingizga yoqqan mahsulotlarni tanlang va savatga qo'shing!</p>
              <button className="btn btn-primary cart-empty-btn" onClick={() => { setIsCartOpen(false); scrollTo('catalog'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Katalogga o'tish
              </button>
            </div>
          ) : cartItems.map((item, index) => (
            <div key={index} className="cart-item" style={{ animationDelay: `${index * 0.06}s` }}>
              <div className="cart-item-img">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p className="cart-item-category">{item.category}</p>
                <p className="cart-item-price">{item.price.toLocaleString()} so'm</p>
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(index)} title="O'chirish">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Mahsulotlar ({cartItems.length})</span>
                <span>{cartTotal.toLocaleString()} so'm</span>
              </div>
              <div className="cart-summary-row">
                <span>Yetkazib berish</span>
                <span className="cart-free-delivery">Bepul 🚚</span>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-total">
                <span>Jami:</span>
                <span>{cartTotal.toLocaleString()} so'm</span>
              </div>
            </div>
            <button className="btn btn-primary cart-checkout-btn" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>
              Rasmiylashtirish
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}</div>
    </div>
  );
}

export default Home;
