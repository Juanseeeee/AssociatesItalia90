import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payments`);
      if (!res.ok) throw new Error('Error al cargar pagos');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.warning('No hay pagos para exportar');
      return;
    }

    const headers = ['ID', 'Concepto', 'Usuario', 'Fecha', 'Monto', 'Estado', 'Método'];
    const csvContent = [
      headers.join(','),
      ...payments.map(p => [
        p.id,
        `"${p.concept || ''}"`,
        p.email,
        p.created_at ? new Date(p.created_at).toISOString() : '',
        p.amount,
        p.status,
        p.method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Historial de pagos exportado');
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return (
          <span className="badge badge-success flex items-center gap-1">
            <CheckCircle size={12} /> Aprobado
          </span>
        );
      case 'rejected':
      case 'rechazado':
        return (
          <span className="badge badge-error flex items-center gap-1">
            <XCircle size={12} /> Rechazado
          </span>
        );
      case 'pending':
      case 'pendiente':
        return (
          <span className="badge badge-warning flex items-center gap-1">
            <Clock size={12} /> Pendiente
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const filteredPayments = React.useMemo(() => {
    return payments.filter(p => {
      const matchesFilter = (p.email || '').toLowerCase().includes(filter.toLowerCase()) || 
                            (p.concept || '').toLowerCase().includes(filter.toLowerCase());
      const matchesStatus = status === 'all' || (p.status || '').toLowerCase() === status.toLowerCase();
      return matchesFilter && matchesStatus;
    });
  }, [payments, filter, status]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-4 w-32 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-4 w-48 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-6 w-20 bg-[var(--border)] rounded-full"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-[var(--border)] rounded"></div></td>
    </tr>
  );

  return (
    <div className="admin-container space-y-6 animate-fade-in">
      <div className="admin-header flex-col md:flex-row gap-4 md:items-center items-start">
        <div>
          <h1 className="admin-title">Historial de Pagos</h1>
          <p className="text-[var(--text-muted)] mt-1">Supervisa las transacciones y cuotas</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="btn btn-outline w-full md:w-auto justify-center min-h-[44px]" onClick={handleExportCSV}>
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="search-wrapper w-full md:w-auto">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input w-full min-h-[48px]" 
              placeholder="Buscar por email o concepto..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
            <div className="hidden md:block">
              <Filter size={18} className="text-[var(--text-muted)]" />
            </div>
            <select 
              className="input w-full md:w-48 min-h-[48px]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="aprobado">Aprobado</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        <div className="table-container shadow-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="hidden sm:table-cell">Usuario</th>
                <th className="hidden md:table-cell">Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th className="hidden lg:table-cell">Método</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[var(--text-muted)]">No se encontraron pagos.</td>
                </tr>
              ) : (
                paginatedPayments.map((payment, index) => (
                  <tr key={payment.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="font-medium text-[var(--text)]">
                      {payment.concept || 'Cuota Social'}
                      <div className="sm:hidden text-xs text-[var(--text-muted)] mt-1 truncate max-w-[100px]">
                        {payment.email}
                      </div>
                    </td>
                    <td className="text-[var(--text-muted)] hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span>{payment.email || '-'}</span>
                        {payment.user_name && <span className="text-xs opacity-70">{payment.user_name}</span>}
                      </div>
                    </td>
                    <td className="text-sm text-[var(--text-muted)] hidden md:table-cell">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="font-bold text-[var(--text)]">
                      ${Number(payment.amount).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td className="text-sm text-[var(--text-muted)] capitalize hidden lg:table-cell">
                      {payment.payment_method || payment.method || 'Tarjeta'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="card-footer">
            <span className="text-sm text-[var(--text-muted)]">
              Mostrando {paginatedPayments.length} de {filteredPayments.length} pagos
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-outline w-[44px] h-[44px] p-0 justify-center disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="flex items-center px-4 text-sm font-medium">
                Página {page} de {totalPages || 1}
              </span>
              <button 
                className="btn btn-outline w-[44px] h-[44px] p-0 justify-center disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
