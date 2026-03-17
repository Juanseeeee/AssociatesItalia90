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
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { compressImage } from '../../utils/imageUtils';
import { useFormWithScroll } from '../../hooks/useFormWithScroll';

import { API_URL as API } from '../../config/api';

const validateActivity = (values) => {
  const errors = {};
    if (!values.name) errors.name = 'El nombre es obligatorio';
    if (values.is_recurring) {
      if (!values.recurrence_days || values.recurrence_days.length === 0) {
        errors.recurrence_days = 'Seleccione al menos un día';
      }
      if (!values.start_time) errors.start_time = 'Hora de inicio requerida';
      if (!values.end_time) errors.end_time = 'Hora de fin requerida';
    } else {
      // Validaciones para actividad única (si aplica) o genérica
      // Mantener date/time si no es recurrente, o hacerlos opcionales según lógica
      // Para simplificar, si no es recurrente, pedimos date/time o schedule manual
      if (!values.schedule && (!values.date || !values.time)) {
         // errors.schedule = 'Defina un horario o fecha';
      }
    }
    if (values.cost < 0) errors.cost = 'El costo no puede ser negativo';
    if (values.slots && values.slots < 0) errors.slots = 'El cupo no puede ser negativo';
    if (!values.description) errors.description = 'La descripción es obligatoria';
    return errors;
  };

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
    
    const {
      formData,
      errors,
      handleChange,
      setFieldValue,
      handleSubmit: handleFormSubmit,
      resetForm,
      formRef
    } = useFormWithScroll({
      name: '',
      description: '',
      date: '', // Mantenemos para compatibilidad visual o input manual
      time: '',
      schedule: '',
      location: '',
      cost: '',
      slots: '',
      image: null,
      previewUrl: null,
      is_recurring: false,
      recurrence_days: [],
      start_time: '',
      end_time: ''
    }, validateActivity);

    // Persist draft for new activity
    useEffect(() => {
      if (!editingActivity && isModalOpen) {
        const draft = {
          name: formData.name,
          description: formData.description,
          schedule: formData.schedule,
          cost: formData.cost,
          slots: formData.slots,
          is_recurring: formData.is_recurring,
          recurrence_days: formData.recurrence_days
        };
        localStorage.setItem('activity_draft', JSON.stringify(draft));
      }
    }, [formData, editingActivity, isModalOpen]);

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
      resetForm({
        name: activity.name,
        description: activity.description,
        schedule: activity.schedule || '',
        // Try to parse schedule if simple, otherwise leave empty or show string
        date: '', 
        time: '',
        location: activity.location || '', // Backend might not store this yet, but we keep it in form
        cost: activity.cost || '',
        slots: activity.slots || '',
        image: null,
        previewUrl: activity.image ? (activity.image.startsWith('http') ? activity.image : `${API.replace('/api', '')}${activity.image}`) : null,
        is_recurring: activity.is_recurring || false,
        recurrence_days: activity.recurrence_days || [],
        start_time: activity.start_time || '',
        end_time: activity.end_time || ''
      });
    } else {
      setEditingActivity(null);
      // Try to load draft
      const savedDraft = localStorage.getItem('activity_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          resetForm({
            ...parsed,
            image: null,
            previewUrl: null
          });
        } catch (e) {
          resetForm({
            name: '', description: '', date: '', time: '', schedule: '', location: '', cost: '', slots: '', 
            image: null, previewUrl: null, is_recurring: false, recurrence_days: [], start_time: '', end_time: ''
          });
        }
      } else {
        resetForm({
          name: '', description: '', date: '', time: '', schedule: '', location: '', cost: '', slots: '', 
          image: null, previewUrl: null, is_recurring: false, recurrence_days: [], start_time: '', end_time: ''
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('activity_draft');
    resetForm({
      name: '', description: '', date: '', time: '', schedule: '', location: '', cost: '', slots: '', 
      image: null, previewUrl: null, is_recurring: false, recurrence_days: [], start_time: '', end_time: ''
    });
    toast.info('Borrador descartado');
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
          setFieldValue('image', compressedFile);
          setFieldValue('previewUrl', preview);
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

  const onSubmit = async (values) => {
    const token = localStorage.getItem('admin_token');
    
    const data = new FormData();
    data.append('name', values.name);
    data.append('description', values.description);
    // data.append('location', values.location); // Backend needs to support this or append to description
    
    if (values.is_recurring) {
      data.append('is_recurring', 'true');
      values.recurrence_days.forEach(day => data.append('recurrence_days', day));
      data.append('start_time', values.start_time);
      data.append('end_time', values.end_time);
        // Backend auto-generates schedule string
    } else {
        // Construct schedule from date/time or manual input
        const scheduleStr = values.schedule || `${values.date} ${values.time}`;
        data.append('schedule', scheduleStr);
    }

    data.append('cost', values.cost);
    data.append('slots', values.slots);
    
    if (values.image) {
      data.append('image', values.image);
    }

    const toastId = toast.loading(editingActivity ? 'Actualizando...' : 'Creando...');

    try {
      const url = editingActivity 
        ? `${API}/activities/${editingActivity.id}`
        : `${API}/activities`;
      
      const method = editingActivity ? 'PUT' : 'POST';

      // Note: FormData handles array values for recurrence_days automatically with correct server parser
      // Or we might need to JSON stringify it if backend expects JSON body.
      // activityController uses multer which handles FormData.
      // But standard multer might need 'recurrence_days' as multiple fields.
      // Let's verify how we append array. 
      // If we use JSON body it's easier, but we have image file.
      // So we use FormData.
      // Check activityController: it gets req.body.
      // Express urlencoded/json/multer puts fields in req.body.
      // Arrays in FormData usually come as `key` appearing multiple times or `key[]`.
      // Let's send `recurrence_days` as individual items.

      // However, req.body.recurrence_days might be a single string if only 1 day is selected.
      // We should handle that in backend or here.
      // Ideally, send as JSON string for safety if mixed with file.
      // data.append('recurrence_days', JSON.stringify(values.recurrence_days)); 
      // But backend expects array.
      // Let's rely on standard FormData behavior (multiple appends).

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // No Content-Type for FormData, browser sets it with boundary
        },
        body: data
      });

      if (res.ok) {
        toast.success(editingActivity ? 'Actividad actualizada' : 'Actividad creada', { id: toastId });
        setIsModalOpen(false);
        fetchActivities();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Error en la operación');
      }
    } catch (error) {
      toast.error(error.message || 'Error al guardar la actividad', { id: toastId });
    }
  };

  const filteredActivities = activities.filter(a => 
    a.name?.toLowerCase().includes(filter.toLowerCase())
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

  const daysOptions = [
    { value: 'Monday', label: 'Lunes' },
    { value: 'Tuesday', label: 'Martes' },
    { value: 'Wednesday', label: 'Miércoles' },
    { value: 'Thursday', label: 'Jueves' },
    { value: 'Friday', label: 'Viernes' },
    { value: 'Saturday', label: 'Sábado' },
    { value: 'Sunday', label: 'Domingo' }
  ];

  const toggleDay = (day) => {
    const current = formData.recurrence_days || [];
    if (current.includes(day)) {
      setFieldValue('recurrence_days', current.filter(d => d !== day));
    } else {
      setFieldValue('recurrence_days', [...current, day]);
    }
  };

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
            {activity.image || formData.previewUrl ? (
              <img 
                src={activity.image?.startsWith('http') ? activity.image : `${API.replace('/api', '')}${activity.image}`} 
                alt={activity.name} 
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
                ${activity.cost}
              </span>
            </div>
            {activity.is_recurring && (
                <div className="absolute top-3 left-3">
                    <span className="badge badge-primary shadow-sm">Recurrente</span>
                </div>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{activity.name}</h3>
            
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Calendar size={14} className="text-[var(--primary)]" />
                <span>{activity.schedule}</span>
              </div>
              {/* <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <MapPin size={14} className="text-[var(--secondary)]" />
                <span className="truncate">{activity.location || 'Sede Central'}</span>
              </div> */}
            </div>
            
            <div className="card-footer mt-auto border-none p-0 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--background)] px-2 py-1 rounded-md">
                <Users size={14} />
                <span>Cupo: {activity.slots || 'Ilimitado'}</span>
              </div>
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
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}
        footer={
          <>
             {!editingActivity && (formData.name || formData.description) && (
               <button 
                 type="button" 
                 onClick={handleDiscardDraft}
                 className="btn btn-ghost text-red-500 hover:bg-red-50 mr-auto"
               >
                 Descartar borrador
               </button>
             )}
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" form="activity-form" className="btn btn-primary">Guardar</button>
          </>
        }
      >
        <div className="mb-4">
           {/* Progress bar logic could be simplified */}
        </div>

        <form id="activity-form" ref={formRef} onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Nombre <span className="text-red-500">*</span></label>
            <input 
              id="name"
              type="text" 
              name="name"
              className={`input w-full min-h-[48px] ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre de la actividad"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <p id="name-error" className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input 
                type="checkbox" 
                id="is_recurring" 
                name="is_recurring" 
                checked={formData.is_recurring} 
                onChange={(e) => setFieldValue('is_recurring', e.target.checked)}
                className="checkbox"
            />
            <label htmlFor="is_recurring" className="label cursor-pointer mb-0">Es una actividad recurrente (semanal)</label>
          </div>
          
          {formData.is_recurring ? (
              <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)]">
                  <label className="label mb-2">Días de la semana <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2 mb-4">
                      {daysOptions.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`btn btn-sm ${formData.recurrence_days?.includes(day.value) ? 'btn-primary' : 'btn-outline'}`}
                          >
                              {day.label}
                          </button>
                      ))}
                  </div>
                  {errors.recurrence_days && <p className="text-red-500 text-xs mt-1 mb-2">{errors.recurrence_days}</p>}

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="label">Hora Inicio <span className="text-red-500">*</span></label>
                          <input 
                              type="time" 
                              name="start_time" 
                              value={formData.start_time} 
                              onChange={handleChange} 
                              className={`input w-full ${errors.start_time ? 'border-red-500' : ''}`}
                          />
                           {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
                      </div>
                      <div>
                          <label className="label">Hora Fin <span className="text-red-500">*</span></label>
                          <input 
                              type="time" 
                              name="end_time" 
                              value={formData.end_time} 
                              onChange={handleChange} 
                              className={`input w-full ${errors.end_time ? 'border-red-500' : ''}`}
                          />
                           {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                      </div>
                  </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label htmlFor="date" className="label">Fecha</label>
                <input 
                    id="date"
                    type="date" 
                    name="date"
                    className={`input w-full min-h-[48px]`}
                    value={formData.date}
                    onChange={handleChange}
                />
                </div>
                <div>
                <label htmlFor="time" className="label">Hora</label>
                <input 
                    id="time"
                    type="time" 
                    name="time"
                    className={`input w-full min-h-[48px]`}
                    value={formData.time}
                    onChange={handleChange}
                />
                </div>
            </div>
          )}

          <div>
            <label htmlFor="location" className="label">Ubicación</label>
            <input 
              id="location"
              type="text" 
              name="location"
              className={`input w-full min-h-[48px] ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.location}
              onChange={handleChange}
              placeholder="Dirección o lugar"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost" className="label">Precio <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                <input 
                  id="cost"
                  type="number" 
                  name="cost"
                  className={`input w-full pl-8 min-h-[48px] ${errors.cost ? 'border-red-500 focus:ring-red-500' : ''}`}
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  placeholder="0.00"
                  aria-invalid={!!errors.cost}
                  aria-describedby={errors.cost ? "cost-error" : undefined}
                />
              </div>
              {errors.cost && <p id="cost-error" className="text-red-500 text-xs mt-1" role="alert">{errors.cost}</p>}
            </div>
            <div>
              <label htmlFor="slots" className="label">Cupo Máximo</label>
              <input 
                id="slots"
                type="number" 
                name="slots"
                className={`input w-full min-h-[48px] ${errors.slots ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={formData.slots}
                onChange={handleChange}
                min="0"
                placeholder="Ilimitado"
                aria-invalid={!!errors.slots}
                aria-describedby={errors.slots ? "slots-error" : undefined}
              />
              {errors.slots && <p id="slots-error" className="text-red-500 text-xs mt-1" role="alert">{errors.slots}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label">Descripción <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              className={`input w-full min-h-[100px] py-3 ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detalles de la actividad..."
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            ></textarea>
            {errors.description && <p id="description-error" className="text-red-500 text-xs mt-1" role="alert">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="image" className="label">Imagen de Portada</label>
            <input 
              id="image"
              type="file" 
              accept="image/*"
              className="input w-full input-file" 
              onChange={handleImageChange}
            />
            {formData.previewUrl && (
              <div className="img-preview h-32 mt-2">
                <img src={formData.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md border border-[var(--border)]" />
              </div>
            )}
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
