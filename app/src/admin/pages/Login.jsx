import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Lock, User } from 'lucide-react';

const API = 'http://localhost:3001/api';

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
      const res = await fetch(`${API}/admin/login`, {
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
    <div className="admin-wrapper min-h-screen flex items-center justify-center p-4" data-theme={theme}>
      <div className="bg-[var(--surface)] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="bg-[var(--primary)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={32} className="text-[var(--primary-foreground)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Admin Panel</h1>
          <p className="text-[var(--text-muted)]">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                type="email" 
                required
                className="input pl-10 w-full min-h-[48px]" 
                placeholder="admin@italia90.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                type="password" 
                required
                className="input pl-10 w-full min-h-[48px]" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full justify-center py-3 text-base min-h-[48px]"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Club Social y Deportivo Italia 90
        </div>
      </div>
    </div>
  );
};

export default Login;
