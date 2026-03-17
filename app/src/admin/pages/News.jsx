import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Calendar, 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { compressImage } from '../../utils/imageUtils';
import { useFormWithScroll } from '../../hooks/useFormWithScroll';

import { API_URL as API } from '../../config/api';

const validateNews = (values) => {
  const errors = {};
  if (!values.title || values.title.length < 5) {
    errors.title = 'El título debe tener al menos 5 caracteres';
  }
  if (!values.content || values.content.length < 20) {
    errors.content = 'El contenido es demasiado corto (mínimo 20 caracteres)';
  }
  return errors;
};

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  
  const {
    formData,
    errors,
    handleChange,
    setFieldValue,
    handleSubmit: handleFormSubmit,
    resetForm,
    formRef
  } = useFormWithScroll({
    title: '',
    content: '',
    image: null,
    previewUrl: null
  }, validateNews);

  // Persist draft for new news
  useEffect(() => {
    if (!editingNews && isModalOpen) {
      const draft = {
        title: formData.title,
        content: formData.content,
        // We cannot persist file objects in localStorage, only text
      };
      localStorage.setItem('news_draft', JSON.stringify(draft));
    }
  }, [formData, editingNews, isModalOpen]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/news`);
      if (!res.ok) throw new Error('Error al cargar noticias');
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('No se pudieron cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingNews(item);
      resetForm({
        title: item.title,
        content: item.content,
        image: null,
        previewUrl: item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API.replace('/api', '')}${item.image_url}`) : null
      });
    } else {
      setEditingNews(null);
      // Try to load draft
      const savedDraft = localStorage.getItem('news_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          resetForm({
            ...parsed,
            image: null,
            previewUrl: null
          });
        } catch (e) {
          resetForm({ title: '', content: '', image: null, previewUrl: null });
        }
      } else {
        resetForm({
          title: '',
          content: '',
          image: null,
          previewUrl: null
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('news_draft');
    resetForm({ title: '', content: '', image: null, previewUrl: null });
    toast.info('Borrador descartado');
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
    if (!window.confirm('¿Estás seguro de eliminar esta noticia?')) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Noticia eliminada');
        fetchNews();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la noticia');
    }
  };

  const onSubmit = async (values) => {
    const token = localStorage.getItem('admin_token');
    
    const data = new FormData();
    data.append('title', values.title);
    data.append('content', values.content);
    if (values.image) {
      data.append('image', values.image);
    }

    const toastId = toast.loading(editingNews ? 'Actualizando...' : 'Publicando...');

    try {
      const url = editingNews 
        ? `${API}/news/${editingNews.id}`
        : `${API}/news`;
      
      const method = editingNews ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (res.ok) {
        toast.success(editingNews ? 'Noticia actualizada' : 'Noticia publicada', { id: toastId });
        setIsModalOpen(false);
        fetchNews();
      } else {
        throw new Error('Error en la operación');
      }
    } catch (error) {
      toast.error('Error al guardar la noticia', { id: toastId });
    }
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(filter.toLowerCase())
  );

  const SkeletonCard = () => (
    <div className="card overflow-hidden flex flex-col h-full animate-pulse shadow-none">
      <div className="h-48 bg-[var(--border)] opacity-30"></div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="h-6 w-3/4 bg-[var(--border)] opacity-50 rounded mb-2"></div>
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-4 w-full bg-[var(--border)] opacity-30 rounded"></div>
          <div className="h-4 w-full bg-[var(--border)] opacity-30 rounded"></div>
          <div className="h-4 w-2/3 bg-[var(--border)] opacity-30 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header flex-col md:flex-row gap-4 md:items-center items-start">
        <div>
          <h1 className="admin-title">Noticias</h1>
          <p className="text-[var(--text-muted)] mt-1">Gestiona las novedades y comunicados del club</p>
        </div>
        <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto justify-center" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Nueva Noticia
        </button>
      </div>

      <div className="card">
        <div className="search-wrapper w-full">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="input w-full" 
            placeholder="Buscar noticia..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, index) => (
            <div 
              key={item.id} 
              className="card overflow-hidden flex flex-col h-full hover-card animate-slide-up group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative h-48 overflow-hidden group">
                <img 
                  src={item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API.replace('/api', '')}${item.image_url}`) : '/placeholder-news.jpg'} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Noticia'; }}
                />
                <div className="absolute top-3 right-3">
                  <span className="badge badge-neutral shadow-sm backdrop-blur-md border border-[var(--border)]">
                    {new Date(item.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-[var(--text)] line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
                  {item.content}
                </p>
                
                <div className="card-footer text-xs border-none p-0 pt-2 mt-0">
                   <div className="flex items-center gap-1 text-[var(--text-muted)]">
                     <Eye size={14} />
                     <span>Visto por socios</span>
                   </div>
                </div>
              </div>

              <div className="card-actions flex gap-2 mt-auto">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 btn btn-outline text-sm min-h-[44px] flex items-center justify-center shadow-sm"
                >
                  <Edit size={18} className="mr-1" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 btn btn-destructive text-sm min-h-[44px] flex items-center justify-center shadow-sm"
                >
                  <Trash2 size={18} className="mr-1" /> Eliminar
                </button>
              </div>
            </div>
          ))}
          
          {filteredNews.length === 0 && (
            <div className="col-span-full py-16 text-center bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed animate-fade-in">
              <div className="w-16 h-16 bg-[var(--background)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                <Newspaper size={32} />
              </div>
              <h3 className="text-lg font-medium text-[var(--text)] mb-1">No hay noticias</h3>
              <p className="text-[var(--text-muted)]">No se encontraron noticias con los filtros actuales</p>
            </div>
          )}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingNews ? "Editar Noticia" : "Nueva Noticia"}
        footer={
          <>
            {!editingNews && (formData.title || formData.content) && (
              <button 
                type="button" 
                onClick={handleDiscardDraft}
                className="btn btn-ghost text-red-500 hover:bg-red-50 mr-auto"
              >
                Descartar borrador
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="news-form"
              className="btn btn-primary"
            >
              {editingNews ? 'Guardar Cambios' : 'Publicar Noticia'}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Progreso</span>
            <span>{Math.round((Object.values({t: formData.title, c: formData.content}).filter(Boolean).length / 2) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${(Object.values({t: formData.title, c: formData.content}).filter(Boolean).length / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        <form id="news-form" ref={formRef} onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="label">Título <span className="text-red-500">*</span></label>
            <input 
              id="title"
              type="text" 
              name="title"
              className={`input w-full ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="Título de la noticia"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && <p id="title-error" className="text-red-500 text-xs mt-1" role="alert">{errors.title}</p>}
          </div>
          
          <div>
            <label htmlFor="content" className="label">Contenido <span className="text-red-500">*</span></label>
            <textarea 
              id="content"
              name="content"
              className={`input w-full h-40 resize-none ${errors.content ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.content}
              onChange={handleChange}
              placeholder="Escribe el contenido de la noticia..."
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? "content-error" : undefined}
            />
            {errors.content && <p id="content-error" className="text-red-500 text-xs mt-1" role="alert">{errors.content}</p>}
          </div>

          <div>
            <label htmlFor="image" className="label">Imagen (Opcional)</label>
            <input 
              id="image"
              type="file" 
              accept="image/*"
              className="input w-full input-file" 
              onChange={handleImageChange}
            />
            {formData.previewUrl && (
              <div className="img-preview h-48 mt-2">
                <img src={formData.previewUrl} alt="Preview" className="w-full h-full object-contain rounded-md border border-[var(--border)]" />
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default News;
