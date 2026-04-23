import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initFormValidation } from '../../utils/validation';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Loaders';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'login' && loginFormRef.current) {
      initFormValidation(loginFormRef.current);
    } else if (mode === 'register' && registerFormRef.current) {
      initFormValidation(registerFormRef.current);
    }
  }, [mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Super Admin account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><i className="fa-solid fa-feather-pointed" /></div>
          <h1>HungryBird</h1>
          <p>{mode === 'login' ? 'Sign in to your admin panel' : 'Create Super Admin account'}</p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24 }}>
          {[['login', 'Sign In'], ['register', 'Register']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: mode === id ? 'var(--bg-card)' : 'transparent',
                color: mode === id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === id ? 'var(--shadow)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form ref={loginFormRef} onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-control" type="email" placeholder="Enter your email address"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-control" type="password" placeholder="Enter your password"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <Spinner /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form ref={registerFormRef} onSubmit={handleRegister}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-triangle-exclamation" /> Registration is only allowed once. This creates the Super Admin account.
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" type="text" placeholder="Enter your full name"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-control" type="email" placeholder="Enter your email address"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-control" type="password" placeholder="Minimum 6 characters" minLength="6"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-control" type="password" placeholder="Re-enter your password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <Spinner /> : 'Create Super Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
