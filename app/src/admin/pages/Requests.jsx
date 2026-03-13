import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Check, 
  X, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';

const API = 'http://localhost:3001/api';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API}/requests`, { headers });
      if (!res.ok) throw new Error('Error al cargar solicitudes');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const isApprove = action === 'approve';
    if (!window.confirm(`¿Estás seguro de ${isApprove ? 'APROBAR' : 'RECHAZAR'} esta solicitud?`)) return;

    const token = localStorage.getItem('admin_token');
    const toastId = toast.loading('Procesando solicitud...');

    try {
      const res = await fetch(`${API}/requests/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId: id })
      });

      if (res.ok) {
        toast.success(`Solicitud ${isApprove ? 'aprobada' : 'rechazada'} correctamente`, { id: toastId });
        setIsModalOpen(false);
        fetchRequests();
      } else {
        throw new Error('Error en la operación');
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud', { id: toastId });
    }
  };

  const openDetails = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const SkeletonRequestCard = () => (
    <div className="card flex flex-col animate-pulse h-64 shadow-none">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-6 w-32 bg-[var(--border)] opacity-50 rounded mb-2"></div>
            <div className="h-4 w-24 bg-[var(--border)] opacity-30 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-[var(--border)] opacity-30 rounded-full"></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-4 w-full bg-[var(--border)] opacity-30 rounded"></div>
          <div className="h-4 w-2/3 bg-[var(--border)] opacity-30 rounded"></div>
          <div className="h-4 w-3/4 bg-[var(--border)] opacity-30 rounded"></div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] p-3 bg-[var(--background)] flex gap-3">
        <div className="h-[44px] flex-1 bg-[var(--border)] opacity-50 rounded"></div>
        <div className="h-[44px] flex-1 bg-[var(--border)] opacity-50 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Solicitudes de Ingreso</h1>
          <p className="text-[var(--text-muted)] mt-1">Revisa y aprueba nuevos socios</p>
        </div>
        <div className="badge badge-info text-sm py-2 px-4 gap-2 h-auto">
          <UserPlus size={18} />
          {requests.length} Pendientes
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SkeletonRequestCard />
          <SkeletonRequestCard />
          <SkeletonRequestCard />
        </div>
      ) : requests.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed animate-fade-in">
          <div className="w-16 h-16 bg-[var(--background)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
            <Check size={32} />
          </div>
          <h3 className="text-lg font-medium text-[var(--text)] mb-1">Todo al día</h3>
          <p className="text-[var(--text-muted)]">No hay solicitudes de ingreso pendientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((req, index) => (
            <div 
              key={req.id} 
              className="card flex flex-col hover-card animate-slide-up p-0 overflow-hidden group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">{req.name} {req.lastname}</h3>
                    <p className="text-sm text-[var(--text-muted)]">DNI: {req.dni}</p>
                  </div>
                  <span className="badge badge-warning">Pendiente</span>
                </div>
                
                <div className="space-y-3 text-sm text-[var(--text-muted)] mb-4">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-[var(--text-muted)] shrink-0" />
                    <span>{req.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{req.address}, {req.city}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => openDetails(req)}
                    className="btn btn-outline flex-1 text-sm h-[44px] flex items-center justify-center"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  onClick={() => handleAction(req.id, 'approve')}
                  className="flex-1 btn btn-accent text-sm h-[44px] flex items-center justify-center shadow-sm"
                >
                  <Check size={16} className="mr-1" /> Aprobar
                </button>
                <button 
                  onClick={() => handleAction(req.id, 'reject')}
                  className="flex-1 btn btn-destructive text-sm h-[44px] flex items-center justify-center shadow-sm"
                >
                  <X size={16} className="mr-1" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Solicitud"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">Nombre Completo</label>
                <p className="text-[var(--text)] font-medium">{selectedRequest.name} {selectedRequest.lastname}</p>
              </div>
              <div>
                <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">DNI</label>
                <p className="text-[var(--text)] font-medium">{selectedRequest.dni}</p>
              </div>
              <div>
                <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">Fecha Nacimiento</label>
                <p className="text-[var(--text)] font-medium">{new Date(selectedRequest.dob).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">Teléfono</label>
                <p className="text-[var(--text)] font-medium">{selectedRequest.phone}</p>
              </div>
            </div>

            <div>
              <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">Email</label>
              <p className="text-[var(--text)] font-medium">{selectedRequest.email}</p>
            </div>

            <div>
              <label className="label text-xs font-bold text-[var(--text-muted)] uppercase">Dirección</label>
              <p className="text-[var(--text)] font-medium">{selectedRequest.address}, {selectedRequest.city}</p>
            </div>

            <div>
              <label className="label text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Documentación Adjunta</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRequest.dni_front && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-muted)]">DNI Frente</span>
                    <div className="img-preview aspect-video mt-0">
                      <img 
                        src={selectedRequest.dni_front.startsWith('http') ? selectedRequest.dni_front : `${API.replace('/api', '')}${selectedRequest.dni_front}`}
                        alt="DNI Frente" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(selectedRequest.dni_front.startsWith('http') ? selectedRequest.dni_front : `${API.replace('/api', '')}${selectedRequest.dni_front}`, '_blank')}
                      />
                    </div>
                  </div>
                )}
                {selectedRequest.dni_back && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-muted)]">DNI Dorso</span>
                    <div className="img-preview aspect-video mt-0">
                      <img 
                        src={selectedRequest.dni_back.startsWith('http') ? selectedRequest.dni_back : `${API.replace('/api', '')}${selectedRequest.dni_back}`}
                        alt="DNI Dorso" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(selectedRequest.dni_back.startsWith('http') ? selectedRequest.dni_back : `${API.replace('/api', '')}${selectedRequest.dni_back}`, '_blank')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => handleAction(selectedRequest.id, 'approve')}
                className="flex-1 btn btn-accent h-[44px] flex items-center justify-center"
              >
                Aprobar Solicitud
              </button>
              <button 
                onClick={() => handleAction(selectedRequest.id, 'reject')}
                className="flex-1 btn btn-destructive h-[44px] flex items-center justify-center"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Requests;
