import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Calendar, Activity, TrendingUp, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { API_URL as API } from '../../config/api';

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
  const [activityFeed, setActivityFeed] = useState([]);
  const [feedType, setFeedType] = useState('all');
  const [feedFrom, setFeedFrom] = useState('');
  const [feedTo, setFeedTo] = useState('');
  const [feedOffset, setFeedOffset] = useState(0);
  const [feedLimit, setFeedLimit] = useState(10);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [paymentsStatusCounts, setPaymentsStatusCounts] = useState({});
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotal, setFeedTotal] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardStats(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchDashboardStats = async (signal) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [membersRes, requestsRes, paymentsRes, feedRes] = await Promise.all([
        fetch(`${API}/members`, { headers, signal }),
        fetch(`${API}/requests`, { headers, signal }),
        fetch(`${API}/payments`, { headers, signal }),
        fetch(`${API}/admin/activity-feed?limit=10`, { headers, signal })
      ]);

      const members = membersRes.ok ? await membersRes.json() : [];
      const requests = requestsRes.ok ? await requestsRes.json() : [];
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];
      const initialFeed = feedRes.ok ? await feedRes.json() : [];

      const totalMembers = Array.isArray(members) ? members.length : 0;
      const activeMembers = Array.isArray(members) ? members.filter(m => (m.status === 'active') || (m.membership_status === 'active')).length : 0;
      const pendingRequests = Array.isArray(requests) ? requests.length : 0;
        
        // Sum payments from current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthlyRevenue = Array.isArray(payments) 
          ? payments
              .filter(p => {
                const d = new Date(p.created_at || p.date);
                const isSameMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                const isApproved = String(p.status || '').toLowerCase() === 'aprobado';
                return isSameMonth && isApproved;
              })
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
          : 0;
      
      let monthlyRevenueFinal = monthlyRevenue;
      try {
        const kpisRes = await fetch(`${API}/admin/kpis`, { headers, signal });
        if (kpisRes.ok) {
          const kpis = await kpisRes.json();
          const kpiRev = kpis?.totals?.monthlyRevenue;
          if (typeof kpiRev === 'number') monthlyRevenueFinal = kpiRev;
          const series = Array.isArray(kpis?.revenueByDay) ? kpis.revenueByDay.map(d => Number(d.amount || 0)) : [];
          setRevenueSeries(series);
          setPaymentsStatusCounts(kpis?.paymentsStatusCounts || {});
        }
      } catch (_) {}

      setStats({
        totalMembers,
        activeMembers,
        pendingRequests,
        monthlyRevenue: monthlyRevenueFinal
      });
      if (Array.isArray(initialFeed.items)) {
        setActivityFeed(initialFeed.items);
        setFeedHasMore(Boolean(initialFeed.has_more));
        setFeedOffset(initialFeed.items.length);
      } else {
        setActivityFeed(initialFeed);
        setFeedHasMore(false);
        setFeedOffset(Array.isArray(initialFeed) ? initialFeed.length : 0);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading dashboard stats:', error);
        toast.error('Error al cargar estadísticas');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const token = localStorage.getItem('admin_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const params = new URLSearchParams();
    params.set('limit', String(feedLimit));
    params.set('offset', String((feedPage - 1) * feedLimit));
    if (feedType !== 'all') params.set('type', feedType);
    if (feedFrom) params.set('from', feedFrom);
    if (feedTo) params.set('to', feedTo);
    fetch(`${API}/admin/activity-feed?${params.toString()}`, { headers, signal })
      .then(res => res.ok ? res.json() : Promise.resolve([]))
      .then(data => {
        if (Array.isArray(data.items)) {
          setActivityFeed(data.items);
          setFeedHasMore(Boolean(data.has_more));
          setFeedOffset(data.items.length);
          setFeedTotal(Number(data.total || 0));
        } else {
          setActivityFeed(data);
          setFeedHasMore(false);
          const len = Array.isArray(data) ? data.length : 0;
          setFeedOffset(len);
          setFeedTotal(len);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [feedType, feedFrom, feedTo, feedLimit, feedPage]);

  useEffect(() => {
    setFeedPage(1);
  }, [feedType, feedFrom, feedTo]);

  const totalPages = Math.max(1, Math.ceil((feedTotal || 0) / feedLimit));
  const goPrevPage = () => setFeedPage(p => Math.max(1, p - 1));
  const goNextPage = () => setFeedPage(p => Math.min(totalPages, p + 1));
  
  const getSparkPath = (series, width, height) => {
    if (!Array.isArray(series) || series.length === 0) return '';
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = series.length > 1 ? width / (series.length - 1) : width;
    let d = '';
    for (let i = 0; i < series.length; i++) {
      const v = Number(series[i] || 0);
      const x = Math.round(i * stepX);
      const y = Math.round(height - ((v - min) / range) * height);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
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
            {stat.label === 'Ingresos Mensuales' && revenueSeries.length > 1 && (
              <div className="p-4 pt-0">
                <svg width="100%" height="48" viewBox="0 0 200 40" preserveAspectRatio="none">
                  <path d={getSparkPath(revenueSeries, 200, 40)} stroke="#f42b29" strokeWidth="2" fill="none" />
                </svg>
              </div>
            )}
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
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="label">Tipo</label>
                <select 
                  className="input w-full min-h-[44px]"
                  value={feedType}
                  onChange={e => setFeedType(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="payment">Pagos</option>
                  <option value="member_created">Socios</option>
                  <option value="enrollment">Inscripciones</option>
                  <option value="activity_created">Actividades</option>
                  <option value="news_published">Noticias</option>
                </select>
              </div>
              <div>
                <label className="label">Desde</label>
                <input 
                  type="date" 
                  className="input w-full min-h-[44px]"
                  value={feedFrom}
                  onChange={e => setFeedFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Hasta</label>
                <input 
                  type="date" 
                  className="input w-full min-h-[44px]"
                  value={feedTo}
                  onChange={e => setFeedTo(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Mostrar</label>
                <select 
                  className="input w-full min-h-[44px]"
                  value={feedLimit}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setFeedLimit(v);
                    setFeedOffset(0);
                    setFeedHasMore(false);
                    setFeedPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
          <div className="activity-list">
            {activityFeed.length === 0 ? (
              <div className="activity-empty">Sin actividad reciente</div>
            ) : (
              activityFeed.map((ev, i) => {
                const t = ev.type;
                const ts = new Date(ev.ts);
                const timeText = ts.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
                const iconInfo = t === 'payment' ? { Icon: CreditCard, variant: 'green' }
                  : t === 'member_created' ? { Icon: Users, variant: 'blue' }
                  : t === 'enrollment' ? { Icon: Activity, variant: 'orange' }
                  : t === 'activity_created' ? { Icon: Activity, variant: 'red' }
                  : { Icon: Calendar, variant: 'blue' };
                const { Icon } = iconInfo;
                const label = t === 'payment' ? `Pago: ${ev.payload?.concept || ''} $${Number(ev.payload?.amount || 0).toLocaleString()}`
                  : t === 'member_created' ? `Nuevo socio: ${(ev.payload?.first_name || '')} ${(ev.payload?.last_name || '')}`.trim()
                  : t === 'enrollment' ? `Inscripción registrada`
                  : t === 'activity_created' ? `Actividad creada: ${ev.payload?.name || ''}`
                  : t === 'news_published' ? `Noticia publicada: ${ev.payload?.title || ''}`
                  : 'Evento';
                return (
                  <div key={i} className="activity-item group">
                    <div className={`stat-icon-wrapper stat-${iconInfo.variant}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="activity-text">{label}</p>
                      <p className="activity-time">{timeText}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="card-footer">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
              <span className="text-sm text-[var(--text-muted)]">
                Mostrando {activityFeed.length} de {feedTotal} eventos
              </span>
              <div className="flex items-center gap-1">
                <button 
                  className="btn-icon"
                  disabled={feedPage === 1}
                  onClick={goPrevPage}
                  title="Página anterior"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium px-2">
                  {feedPage} / {totalPages}
                </span>
                <button 
                  className="btn-icon"
                  disabled={feedPage >= totalPages}
                  onClick={goNextPage}
                  title="Página siguiente"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="card-header">
            <h2 className="card-title">Estado de Pagos (mes)</h2>
          </div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <span className="text-[var(--text-muted)]">Aprobados</span>
                <span className="font-bold">{paymentsStatusCounts.aprobado || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <span className="text-[var(--text-muted)]">Pendientes</span>
                <span className="font-bold">{paymentsStatusCounts.pendiente || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <span className="text-[var(--text-muted)]">Rechazados</span>
                <span className="font-bold">{paymentsStatusCounts.rechazado || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
