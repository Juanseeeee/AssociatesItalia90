import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Lock, User } from 'lucide-react';

import { API_URL as API } from '../../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme] = useState(() => localStorage.getItem('admin_theme') || 'light');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Bienvenido al Panel de Administración');
        navigate('/admin');
      } else {
        throw new Error(data.message || 'Credenciales inválidas');
      }
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container" data-theme={theme}>
      <div className="admin-login-card">
        <div className="text-center mb-8">
          <div className="login-icon-wrapper">
            <ShieldCheck size={32} className="text-[var(--primary-foreground)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Admin Panel</h1>
          <p className="text-[var(--text-muted)]">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="label">Email</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input 
                type="email" 
                required
                className="input input-with-icon" 
                placeholder="admin@italia90.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                required
                className="input input-with-icon" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary btn-block btn-lg"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-footer">
          &copy; {new Date().getFullYear()} Club Social y Deportivo Italia 90
        </div>
      </div>
    </div>
  );
};

export default Login;
