import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { compressImage } from '../../utils/imageUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrollmentsModalOpen, setEnrollmentsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedActivityEnrollments, setSelectedActivityEnrollments] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    quota: '',
    image: null,
    previewUrl: null
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/activities`);
      if (!res.ok) throw new Error('Error al cargar actividades');
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (activityId) => {
      setLoadingEnrollments(true);
      setEnrollments([]);
      try {
          // Assuming endpoint exists: /activities/:id/enrollments
          // If not, we might need to fetch all enrollments and filter (less efficient)
          const token = localStorage.getItem('admin_token');
          const res = await fetch(`${API}/activities/${activityId}/enrollments`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              setEnrollments(data);
          } else {
              // Fallback for demo if endpoint doesn't exist
              setEnrollments([]); 
          }
      } catch (e) {
          console.error(e);
          toast.error("Error al cargar inscriptos");
      } finally {
          setLoadingEnrollments(false);
      }
  };

  const handleOpenModal = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        title: activity.title,
        description: activity.description,
        date: activity.date ? activity.date.split('T')[0] : '',
        time: activity.time || '',
        location: activity.location || '',
        price: activity.price || '',
        quota: activity.quota || '',
        image: null,
        previewUrl: activity.image_url ? (activity.image_url.startsWith('http') ? activity.image_url : `${API.replace('/api', '')}${activity.image_url}`) : null
      });
    } else {
      setEditingActivity(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        price: '',
        quota: '',
        image: null,
        previewUrl: null
      });
    }
    setIsModalOpen(true);
  };

  const handleViewEnrollments = (activity) => {
      setSelectedActivityEnrollments(activity);
      setEnrollmentsModalOpen(true);
      fetchEnrollments(activity.id);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
          const { file: compressedFile, preview } = await compressImage(file, 0.8, 1200);
          setFormData({
            ...formData,
            image: compressedFile,
            previewUrl: preview
          });
      } catch (error) {
          toast.error("Error al procesar la imagen");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta actividad?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success('Actividad eliminada');
        fetchActivities();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la actividad');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (Number(formData.price) < 0) {
        toast.error('El precio no puede ser negativo');
        return;
    }
    if (formData.quota && Number(formData.quota) < 0) {
        toast.error('El cupo no puede ser negativo');
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('date', formData.date);
    data.append('time', formData.time);
    data.append('location', formData.location);
    data.append('price', formData.price);
    data.append('quota', formData.quota);
    if (formData.image) {
      data.append('image', formData.image);
    }

    const toastId = toast.loading(editingActivity ? 'Actualizando...' : 'Creando...');

    try {
      const url = editingActivity 
        ? `${API}/activities/${editingActivity.id}`
        : `${API}/activities`;
      
      const method = editingActivity ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        toast.success(editingActivity ? 'Actividad actualizada' : 'Actividad creada', { id: toastId });
        setIsModalOpen(false);
        fetchActivities();
      } else {
        throw new Error('Error en la operación');
      }
    } catch (error) {
      toast.error('Error al guardar la actividad', { id: toastId });
    }
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(filter.toLowerCase())
  );

  const SkeletonCard = () => (
    <div className="card overflow-hidden flex flex-col h-full animate-pulse shadow-none">
      <div className="h-48 bg-[var(--border)]/30 rounded-t-lg"></div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="h-6 w-3/4 bg-[var(--border)]/50 rounded mb-4"></div>
        <div className="space-y-3 mb-4 flex-1">
          <div className="h-4 w-1/2 bg-[var(--border)]/30 rounded"></div>
          <div className="h-4 w-1/3 bg-[var(--border)]/30 rounded"></div>
          <div className="h-4 w-2/3 bg-[var(--border)]/30 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-container space-y-6 animate-fade-in">
      <div className="admin-header flex-col md:flex-row gap-4 md:items-center items-start">
        <div>
          <h1 className="admin-title">Actividades</h1>
          <p className="text-[var(--text-muted)] mt-1">Gestiona eventos, clases y torneos</p>
        </div>
        <button className="btn btn-primary w-full md:w-auto justify-center min-h-[44px]" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Nueva Actividad
        </button>
      </div>

      <div className="card">
        <div className="search-wrapper w-full">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="input w-full min-h-[48px]" 
            placeholder="Buscar actividad..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredActivities.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed animate-fade-in">
            <div className="w-16 h-16 bg-[var(--background)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-medium text-[var(--text)] mb-1">No hay actividades</h3>
            <p className="text-[var(--text-muted)]">No se encontraron actividades con los filtros actuales</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="card overflow-hidden flex flex-col h-full hover-card p-0 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
          <div className="relative h-48 overflow-hidden group">
            {activity.image_url || formData.previewUrl ? (
              <img 
                src={activity.image_url?.startsWith('http') ? activity.image_url : `${API.replace('/api', '')}${activity.image_url}`} 
                alt={activity.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Actividad'; }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] bg-[var(--background)]">
                <ImageIcon size={48} className="opacity-20" />
              </div>
            )}
            
            <div className="absolute top-3 right-3">
               <span className="badge badge-neutral shadow-sm backdrop-blur-md border border-[var(--border)]">
                ${activity.price}
              </span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{activity.title}</h3>
            
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Calendar size={14} className="text-[var(--primary)]" />
                <span>{new Date(activity.date).toLocaleDateString()} • {activity.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <MapPin size={14} className="text-[var(--secondary)]" />
                <span className="truncate">{activity.location}</span>
              </div>
            </div>
            
            <div className="card-footer mt-auto border-none p-0 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--background)] px-2 py-1 rounded-md">
                <Users size={14} />
                <span>Cupo: {activity.quota || 'Ilimitado'}</span>
              </div>
              <span className={`badge ${
                new Date(activity.date) < new Date() 
                  ? 'badge-neutral' 
                  : 'badge-success'
              }`}>
                {new Date(activity.date) < new Date() ? 'Finalizado' : 'Próximamente'}
              </span>
            </div>
          </div>

          <div className="card-actions flex gap-2">
              <button 
                onClick={() => handleViewEnrollments(activity)}
                className="flex-1 btn btn-outline h-[44px] justify-center p-0"
                title="Ver Inscriptos"
              >
                <Users size={20} />
              </button>
              <button 
                onClick={() => handleOpenModal(activity)}
                className="flex-1 btn btn-outline h-[44px] justify-center p-0"
                title="Editar"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={() => handleDelete(activity.id)}
                className="flex-1 btn btn-destructive h-[44px] justify-center p-0"
                title="Eliminar"
              >
                <Trash2 size={20} />
              </button>
          </div>
        </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input 
              type="text" 
              className="input w-full min-h-[48px]" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input 
                type="date" 
                className="input w-full min-h-[48px]" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Hora</label>
              <input 
                type="time" 
                className="input w-full min-h-[48px]" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Ubicación</label>
            <input 
              type="text" 
              className="input w-full min-h-[48px]" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Precio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                <input 
                  type="number" 
                  className="input w-full pl-8 min-h-[48px]" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="label">Cupo Máximo</label>
              <input 
                type="number" 
                className="input w-full min-h-[48px]" 
                value={formData.quota}
                onChange={e => setFormData({...formData, quota: e.target.value})}
                min="0"
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea 
              className="input w-full min-h-[100px] py-3" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows="4"
            ></textarea>
          </div>

          <div>
            <label className="label">Imagen de Portada</label>
            <input 
              type="file" 
              accept="image/*"
              className="input w-full input-file" 
              onChange={handleImageChange}
            />
            {formData.previewUrl && (
              <div className="img-preview h-32">
                <img src={formData.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Enrollments Modal */}
      <Modal 
        isOpen={enrollmentsModalOpen} 
        onClose={() => setEnrollmentsModalOpen(false)} 
        title={`Inscriptos - ${selectedActivityEnrollments?.title || ''}`}
      >
          {loadingEnrollments ? (
              <div className="text-center py-8 text-[var(--text-muted)]">Cargando inscriptos...</div>
          ) : enrollments.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">No hay inscriptos aún.</div>
          ) : (
              <div className="overflow-y-auto max-h-96 table-container shadow-none border-0">
                  <table className="table">
                      <thead>
                          <tr>
                              <th>Nombre</th>
                              <th>Email</th>
                              <th>Fecha Inscripción</th>
                          </tr>
                      </thead>
                      <tbody>
                          {enrollments.map((enr, idx) => (
                              <tr key={idx}>
                                  <td>{enr.user?.name || 'Usuario'}</td>
                                  <td className="text-sm text-[var(--text-muted)]">{enr.user?.email}</td>
                                  <td className="text-sm">{new Date(enr.created_at).toLocaleDateString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
          <div className="modal-footer">
               <button className="btn btn-primary" onClick={() => setEnrollmentsModalOpen(false)}>Cerrar</button>
          </div>
      </Modal>
    </div>
  );
};

export default Activities;
