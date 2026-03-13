import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dni: '',
    status: 'active',
    plan: 'standard'
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API}/members`, { headers });
      if (!response.ok) throw new Error('Error al cargar socios');
      
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los socios');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const matchesSearch = (
        (member.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(filter.toLowerCase()) ||
        (member.phone || '').includes(filter) ||
        (member.dni || '').includes(filter)
      );
      
      const matchesStatus = status === 'all' || member.status === status;
      
      return matchesSearch && matchesStatus;
    });
  }, [members, filter, status]);

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.warning('No hay socios para exportar');
      return;
    }

    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'DNI', 'Estado', 'Tipo', 'Último Pago'];
    const csvContent = [
      headers.join(','),
      ...filteredMembers.map(m => [
        m.id,
        `"${m.name || ''}"`,
        m.email,
        m.phone || '',
        m.dni || '',
        m.status,
        m.memberType || 'Standard',
        m.last_payment_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `socios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Lista de socios exportada');
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        dni: member.dni || '',
        status: member.status || 'active',
        plan: member.plan || member.memberType || 'standard'
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        dni: '',
        status: 'active',
        plan: 'standard'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Email inválido');
        return;
    }
    if (formData.dni && !/^\d+$/.test(formData.dni)) {
        toast.error('El DNI debe contener solo números');
        return;
    }
    if (formData.phone && !/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
        toast.error('Número de teléfono inválido');
        return;
    }

    const token = localStorage.getItem('admin_token');
    const toastId = toast.loading(editingMember ? 'Actualizando...' : 'Creando...');

    try {
      const url = editingMember 
        ? `${API}/members/${editingMember.id}`
        : `${API}/members`;
      
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingMember ? 'Socio actualizado' : 'Socio creado', { id: toastId });
        setIsModalOpen(false);
        fetchMembers();
      } else {
        throw new Error('Error en la operación');
      }
    } catch (error) {
      toast.error('Error al guardar socio', { id: toastId });
    }
  };

  const handleNotifyDebt = async (member) => {
    if (!window.confirm(`¿Enviar notificación de deuda a ${member.email}?`)) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Sesión expirada');
      return;
    }

    const toastId = toast.loading('Enviando notificación...');

    try {
      const res = await fetch(`${API}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId: member.id, type: 'debt_reminder' })
      });

      if (res.ok) {
        toast.success(`Notificación enviada a ${member.email}`, { id: toastId });
      } else {
        throw new Error('Error en el envío');
      }
    } catch (error) {
      toast.error('Error al enviar la notificación', { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este socio? Esta acción no se puede deshacer.')) return;

    const token = localStorage.getItem('admin_token');
    const toastId = toast.loading('Eliminando socio...');

    try {
        const res = await fetch(`${API}/members/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            toast.success('Socio eliminado correctamente', { id: toastId });
            setMembers(members.filter(m => m.id !== id));
        } else {
            throw new Error('Error al eliminar');
        }
    } catch (error) {
        toast.error('Error al eliminar socio', { id: toastId });
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success flex items-center gap-1"><CheckCircle size={12} /> Al día</span>;
      case 'debt':
        return <span className="badge badge-error flex items-center gap-1"><ShieldAlert size={12} /> Deuda</span>;
      case 'inactive':
        return <span className="badge badge-neutral flex items-center gap-1"><XCircle size={12} /> Inactivo</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-4 w-4 bg-[var(--border)] rounded"></div></td>
      <td className="p-4">
        <div className="h-4 w-32 bg-[var(--border)] rounded mb-2"></div>
        <div className="h-3 w-24 bg-[var(--border)]/50 rounded"></div>
      </td>
      <td className="p-4"><div className="h-6 w-16 bg-[var(--border)] rounded-full"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-4 w-20 bg-[var(--border)] rounded"></div></td>
      <td className="p-4"><div className="h-8 w-24 bg-[var(--border)] rounded ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Gestión de Socios</h1>
          <p className="text-[var(--text-muted)] mt-1">Administra la base de datos de miembros del club</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={18} />
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nuevo Socio
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input" 
              placeholder="Buscar por nombre, email o teléfono..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-[var(--text-muted)]" />
            <select 
              className="input w-full md:w-48"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Al día</option>
              <option value="debt">Con Deuda</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

      <div className="table-container shadow-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Socio</th>
                <th>Estado</th>
                <th>Contacto</th>
                <th>Plan</th>
                <th className="text-right">Acciones</th>
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
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[var(--text-muted)]">
                    No se encontraron socios con los filtros actuales.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className="group animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="font-mono text-xs text-[var(--text-muted)]">#{member.id}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--text)]">{member.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{member.dni}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                          <Mail size={12} /> {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                            <span className="text-xs">📞</span> {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium capitalize text-[var(--text)]">
                        {member.memberType || member.plan || 'Standard'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          className="btn-icon btn-icon-primary"
                          onClick={() => handleNotifyDebt(member)}
                          title="Enviar recordatorio"
                        >
                          <Mail size={16} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-accent"
                          onClick={() => handleOpenModal(member)}
                          title="Editar socio"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-destructive"
                          onClick={() => handleDelete(member.id)}
                          title="Eliminar socio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="card-footer">
            <span className="text-sm text-[var(--text-muted)]">
              Mostrando {paginatedMembers.length} de {filteredMembers.length} socios
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-outline py-1 px-3 text-sm disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex items-center px-2 text-sm font-medium">
                Página {page} de {totalPages || 1}
              </span>
              <button 
                className="btn btn-outline py-1 px-3 text-sm disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? "Editar Socio" : "Nuevo Socio"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre Completo</label>
            <input 
              type="text" 
              className="input w-full" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input 
                type="email" 
                className="input w-full" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input 
                type="tel" 
                className="input w-full" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">DNI</label>
              <input 
                type="text" 
                className="input w-full" 
                value={formData.dni}
                onChange={e => setFormData({...formData, dni: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Plan</label>
              <select 
                className="input w-full"
                value={formData.plan}
                onChange={e => setFormData({...formData, plan: e.target.value})}
              >
                <option value="standard">Estándar</option>
                <option value="premium">Premium</option>
                <option value="familiar">Familiar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Estado</label>
            <select 
              className="input w-full"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Al día</option>
              <option value="debt">Con Deuda</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {editingMember ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Members;
