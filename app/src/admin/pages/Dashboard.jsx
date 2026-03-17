import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Calendar, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingRequests: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [membersRes, requestsRes, paymentsRes] = await Promise.all([
        fetch(`${API}/members`, { headers }),
        fetch(`${API}/requests`, { headers }),
        fetch(`${API}/payments`, { headers })
      ]);

      if (membersRes.ok && requestsRes.ok && paymentsRes.ok) {
        const members = await membersRes.json();
        const requests = await requestsRes.json();
        const payments = await paymentsRes.json();

        const totalMembers = Array.isArray(members) ? members.length : 0;
        const activeMembers = Array.isArray(members) ? members.filter(m => m.status === 'active').length : 0;
        const pendingRequests = Array.isArray(requests) ? requests.length : 0;
        
        // Sum payments from current month
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = Array.isArray(payments) 
          ? payments
              .filter(p => new Date(p.created_at).getMonth() === currentMonth)
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
          : 0;

        setStats({
          totalMembers,
          activeMembers,
          pendingRequests,
          monthlyRevenue
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExpirations = async () => {
    setChecking(true);
    const toastId = toast.loading('Verificando vencimientos y documentación...');
    
    try {
        const token = localStorage.getItem('admin_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API}/admin/check-expirations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        });
        
        if (!res.ok) throw new Error('Error en la petición');
        
        const data = await res.json();
        toast.success(
            `Verificación completada:
            - Revisados: ${data.checked}
            - Cert. Vencidos: ${data.expired_medical}
            - Docs Faltantes (Menores): ${data.missing_docs_minor}
            - Notificaciones enviadas: ${data.notifications_sent}`,
            { id: toastId, duration: 5000 }
        );
    } catch (e) {
        toast.error('Error al verificar: ' + e.message, { id: toastId });
    } finally {
        setChecking(false);
    }
  };

  const statCards = [
    { 
      label: 'Socios Totales', 
      value: stats.totalMembers, 
      icon: Users, 
      variant: 'blue',
      change: '+12% vs mes anterior',
      textClass: 'text-brand-blue'
    },
    { 
      label: 'Socios Activos', 
      value: stats.activeMembers, 
      icon: Activity, 
      variant: 'green',
      change: '85% tasa de actividad',
      textClass: 'text-brand-green'
    },
    { 
      label: 'Solicitudes Pendientes', 
      value: stats.pendingRequests, 
      icon: AlertCircle, 
      variant: 'orange',
      change: 'Requiere atención',
      textClass: 'text-brand-orange'
    },
    { 
      label: 'Ingresos Mensuales', 
      value: `$${stats.monthlyRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      variant: 'red',
      change: 'Actualizado hoy',
      textClass: 'text-brand-red'
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle mt-1">Bienvenido al panel de administración de Italia 90</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="card dashboard-stat-card hover-card animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="stat-card-header">
              <div>
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
              <div className={`stat-icon-wrapper stat-${stat.variant}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="card-footer">
              <span className={`font-medium ${stat.textClass}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <h2 className="card-title">Acciones Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            <button 
              className="btn btn-primary action-btn flex items-center justify-center gap-2 min-h-[44px]"
              onClick={() => navigate('/admin/members')}
            >
              <Users size={20} />
              Nuevo Socio
            </button>
            <button 
              className="btn btn-secondary action-btn flex items-center justify-center gap-2 min-h-[44px]"
              onClick={() => navigate('/admin/payments')}
            >
              <CreditCard size={20} />
              Registrar Pago
            </button>
            <button 
                onClick={handleCheckExpirations} 
                disabled={checking}
                className="btn btn-accent action-btn-full col-span-1 sm:col-span-2 flex items-center justify-center gap-2 min-h-[44px]"
            >
                {checking ? <Activity className="animate-spin" size={20} /> : <AlertCircle size={20} />}
                {checking ? 'Verificando...' : 'Verificar Vencimientos'}
            </button>
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h2 className="card-title">Actividad Reciente</h2>
          </div>
          <div className="activity-list">
            <div className="activity-item group">
              <div className="stat-icon-wrapper stat-blue group-hover-scale">
                <Users size={20} />
              </div>
              <div>
                <p className="activity-text">Nuevo socio registrado</p>
                <p className="activity-time">Hace 2 horas</p>
              </div>
            </div>
            <div className="activity-item group">
              <div className="stat-icon-wrapper stat-green">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="activity-text">Pago de cuota recibido</p>
                <p className="activity-time">Hace 5 horas</p>
              </div>
            </div>
            <div className="activity-item group">
                <div className="stat-icon-wrapper stat-red">
                    <Activity size={20} />
                </div>
                <div>
                    <p className="activity-text">Actividad creada</p>
                    <p className="activity-time">Ayer</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
