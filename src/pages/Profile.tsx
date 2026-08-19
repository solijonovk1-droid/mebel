import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut } from '../lib/supabase';
import '../App.css';

const BRANCHES = [
  { city: 'Toshkent', address: 'Chilonzor tumani, Bunyodkor ko\'chasi 42', phone: '+998 71 200 00 01', hours: '09:00 – 21:00' },
  { city: 'Toshkent', address: 'Yunusobod tumani, Amir Temur ko\'chasi 108', phone: '+998 71 200 00 02', hours: '09:00 – 21:00' },
  { city: 'Toshkent', address: 'Sergeli tumani, Qo\'yliq bozori yoni', phone: '+998 71 200 00 03', hours: '09:00 – 20:00' },
  { city: 'Samarqand', address: 'Registon ko\'chasi 15', phone: '+998 66 233 00 01', hours: '09:00 – 20:00' },
  { city: 'Buxoro', address: 'Navro\'z ko\'chasi 7', phone: '+998 65 221 00 01', hours: '09:00 – 19:00' },
  { city: 'Namangan', address: 'Mustaqillik ko\'chasi 28', phone: '+998 69 227 00 01', hours: '09:00 – 19:00' },
  { city: 'Andijon', address: 'Bobur ko\'chasi 3', phone: '+998 74 223 00 01', hours: '10:00 – 19:00' },
  { city: 'Farg\'ona', address: 'Al-Farg\'oniy ko\'chasi 56', phone: '+998 73 244 00 01', hours: '10:00 – 19:00' },
];

function Profile() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        navigate('/');
        return;
      }
      setUser(data.session.user);
      fetchOrders(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/');
        return;
      }
      setUser(session.user);
      fetchOrders(session.user.id);
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  const fullName = (user?.user_metadata?.full_name as string) || 'Foydalanuvchi';
  const email = user?.email || '';
  const phone = (user?.user_metadata?.phone as string) || '+998 ...';
  const initials = fullName.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const uniqueCities = [...new Set(BRANCHES.map(b => b.city))];

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="navbar glass">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Quvonch<span>.</span></div>
        <div className="nav-actions">
          <button className="btn btn-outline theme-btn" onClick={toggleTheme} title="Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            ← Bosh sahifa
          </button>
        </div>
      </nav>

      <div className="profile-body">
        {/* ── User Card ── */}
        <section className="profile-user-card">
          <div className="profile-accent-bar" />
          <div className="profile-user-inner">
            <div className="profile-avatar-large">
              {initials}
            </div>
            <div className="profile-user-details">
              <h1 className="profile-user-name">{fullName}</h1>
              <div className="profile-user-meta">
                <span className="profile-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {email}
                </span>
                <span className="profile-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {phone}
                </span>
                <span className="profile-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  A'zo bo'lgan: {joinDate}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Order Tracking ── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-icon" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))', color: 'var(--accent-color)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 16.2A2 2 0 0022 14.5V8a2 2 0 00-2-2h-3.5a2 2 0 00-1.74 1L12 11h-3"/><path d="M3 13V8a2 2 0 012-2h3.5a2 2 0 011.74 1L13 11h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
              </svg>
            </div>
            <div>
              <h2 className="profile-section-title">Mening buyurtmalarim</h2>
              <p className="profile-section-subtitle">Buyurtmalaringiz qayerga kelganini kuzating</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders-state" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📦</span>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Sizda hali buyurtmalar yo'q</h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Katalogdan o'zingizga yoqqan narsani tanlang va buyurtma bering.</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>Katalogga o'tish</button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order, idx) => {
                const isCancelled = order.status === 'cancelled';
                // Define steps
                const steps = [
                  { id: 'pending', label: 'Qabul qilindi / Yig\'ilyapti', icon: '📝' },
                  { id: 'confirmed', label: 'Yo\'lga chiqdi', icon: '🚚' },
                  { id: 'delivered', label: 'Yetkazib berildi', icon: '✅' },
                ];
                
                // Determine current step index
                let currentStepIndex = 0;
                if (order.status === 'confirmed') currentStepIndex = 1;
                if (order.status === 'delivered') currentStepIndex = 2;

                return (
                  <div key={idx} className="order-tracking-card" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary-color)' }}>Buyurtma #{order.id}</strong>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Sana: {new Date(order.created_at).toLocaleString('uz-UZ')}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--accent-color)' }}>{order.total?.toLocaleString()} so'm</strong>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{order.items?.length || 0} ta mahsulot</span>
                      </div>
                    </div>

                    {isCancelled ? (
                      <div style={{ padding: '1rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        🚫 Buyurtma bekor qilingan
                      </div>
                    ) : (
                      <div className="order-stepper" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1rem' }}>
                        {/* Progress Line */}
                        <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', background: 'var(--border-color)', zIndex: 0 }} />
                        <div style={{ position: 'absolute', top: '15px', left: '10%', height: '3px', background: 'var(--accent-color)', zIndex: 0, width: `${(currentStepIndex / 2) * 80}%`, transition: 'width 0.5s ease' }} />

                        {steps.map((step, index) => {
                          const isActive = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          return (
                            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '33%' }}>
                              <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: isActive ? 'var(--accent-color)' : 'var(--bg-color)', 
                                border: `2px solid ${isActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isActive ? '#fff' : 'var(--text-light)',
                                fontSize: '1rem',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none',
                                transition: 'all 0.3s ease'
                              }}>
                                {step.icon}
                              </div>
                              <span style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary-color)' : 'var(--text-light)', textAlign: 'center' }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Manzil: <span style={{ color: 'var(--primary-color)' }}>{order.address}</span></p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {order.items?.map((item: any, i: number) => (
                          <span key={i} style={{ background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-light)', border: '1px solid var(--border-color)' }}>
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Stats Row ── */}
        <section className="profile-stats-row">
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <span className="profile-stat-number">{uniqueCities.length}</span>
              <span className="profile-stat-label">shahar</span>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(56,161,105,0.15), rgba(56,161,105,0.05))' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38a169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <span className="profile-stat-number">{BRANCHES.length}</span>
              <span className="profile-stat-label">filial</span>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(66,133,244,0.05))' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <span className="profile-stat-number">24/7</span>
              <span className="profile-stat-label">qo'llab-quvvatlash</span>
            </div>
          </div>
        </section>

        {/* ── Call Center ── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <h2 className="profile-section-title">Call Markaz</h2>
              <p className="profile-section-subtitle">24/7 mijozlarni qo'llab-quvvatlash</p>
            </div>
          </div>

          <div className="call-center-grid">
            <div className="call-card">
              <div className="call-card-icon call-card-phone">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <h3>Asosiy raqam</h3>
              <a href="tel:+998901234567" className="call-number">+998 90 123 45 67</a>
              <span className="call-label">Har kuni, 24 soat</span>
            </div>
            <div className="call-card">
              <div className="call-card-icon call-card-telegram">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <h3>Telegram</h3>
              <a href="https://t.me/quvonch_shop" target="_blank" rel="noreferrer" className="call-number">@quvonch_shop</a>
              <span className="call-label">Tez javob beramiz</span>
            </div>
            <div className="call-card">
              <div className="call-card-icon call-card-email">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>Email</h3>
              <a href="mailto:info@quvonch.uz" className="call-number">info@quvonch.uz</a>
              <span className="call-label">24 soat ichida javob</span>
            </div>
          </div>
        </section>

        {/* ── Filiallar ── */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h2 className="profile-section-title">Filiallarimiz</h2>
              <p className="profile-section-subtitle">{uniqueCities.length} ta shaharda {BRANCHES.length} ta filial</p>
            </div>
          </div>

          <div className="branches-grid">
            {BRANCHES.map((branch, i) => (
              <div key={i} className="branch-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="branch-city-badge">{branch.city}</div>
                <div className="branch-details">
                  <div className="branch-row">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{branch.address}</span>
                  </div>
                  <div className="branch-row">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81"/>
                    </svg>
                    <a href={`tel:${branch.phone.replace(/\s/g, '')}`}>{branch.phone}</a>
                  </div>
                  <div className="branch-row">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <section className="profile-logout-section">
          <button className="profile-logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Tizimdan chiqish
          </button>
        </section>
      </div>
    </div>
  );
}

export default Profile;
