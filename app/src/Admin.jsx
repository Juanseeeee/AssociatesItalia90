import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image } from 'react-native';
import supabaseClient from './supabaseClient';

const API = 'http://localhost:3001/api';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="activities" element={<AdminActivities />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="trash" element={<AdminTrash />} />
        <Route path="audit" element={<AdminAudit />} />
      </Route>
    </Routes>
  );
}

function RequireAdmin({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabaseClient) {
        // En desarrollo sin Supabase, permitir acceso
        if (mounted) {
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        if (mounted) {
          setLoading(false);
          navigate('/admin/login');
        }
        return;
      }
      // Verificar rol admin en tabla admins
      const { data } = await supabaseClient
        .from('admins')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('enabled', true)
        .single();
      
      if (mounted) {
        if (data) {
          setIsAdmin(true);
        } else {
          // Si no es admin, quizás redirigir o mostrar error
          // Por ahora mostramos acceso denegado
        }
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  if (loading) return <View style={styles.center}><Text style={styles.p}>Verificando acceso...</Text></View>;
  
  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={[styles.h1, { color: '#ef4444' }]}>Acceso Denegado</Text>
        <Text style={styles.p}>No tienes permisos de administrador.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigate('/')}>
          <Text style={styles.btnTextPrimary}>Volver al inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnGhost, { marginTop: 10 }]} onPress={async () => {
          await supabaseClient.auth.signOut();
          navigate('/admin/login');
        }}>
          <Text style={styles.btnTextGhost}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    if (!supabaseClient) {
      // Mock login for dev without Supabase
      navigate('/admin');
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <View style={styles.center}>
      <View style={styles.card}>
        <Text style={styles.h1}>Admin Login</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          value={pass} 
          onChangeText={setPass} 
          secureTextEntry
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnTextPrimary}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/news', label: 'Noticias', icon: '📰' },
    { path: '/admin/activities', label: 'Actividades', icon: '⚽' },
    { path: '/admin/services', label: 'Servicios', icon: '🛠️' },
    { path: '/admin/members', label: 'Socios', icon: '👥' },
    { path: '/admin/payments', label: 'Pagos', icon: '💳' },
    { path: '/admin/trash', label: 'Papelera', icon: '🗑️' },
    { path: '/admin/audit', label: 'Auditoría', icon: '📋' },
  ];

  const logout = async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Admin Panel</Text>
        <View style={styles.nav}>
          {items.map(i => {
            const isActive = location.pathname === i.path || (i.path !== '/admin' && location.pathname.startsWith(i.path));
            return (
              <TouchableOpacity 
                key={i.path} 
                style={[styles.navItem, isActive && styles.navItemActive]} 
                onPress={() => navigate(i.path)}
              >
                <Text style={[styles.navText, isActive && styles.navTextActive]}>{i.icon} {i.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Outlet />
      </View>
    </View>
  );
}

export function AdminDashboard() {
  const [kpis, setKpis] = useState({ memberships: 0, payments: 0, activities: 0 });
  
  useEffect(() => {
    fetch(`${API}/kpi`).then(r => r.json()).then(setKpis).catch(() => {});
  }, []);

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Dashboard</Text>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{kpis.memberships}</Text>
          <Text style={styles.statLabel}>Socios Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{kpis.activities}</Text>
          <Text style={styles.statLabel}>Inscripciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{kpis.payments}</Text>
          <Text style={styles.statLabel}>Pagos este mes</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export function AdminNews() {
  const [news, setNews] = useState([]);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchNews = () => fetch(`${API}/news`).then(r => r.json()).then(setNews).catch(() => []);

  useEffect(() => { fetchNews(); }, []);

  const saveNews = async () => {
    if (!title) return;
    setLoading(true);
    let imageUrl = '';
    
    // Auth headers
    let headers = { 'Content-Type': 'application/json' };
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }

      if (file) {
        const path = `news/${Date.now()}-${file.name}`;
        const { error } = await supabaseClient.storage.from('news-images').upload(path, file);
        if (!error) {
          const { data: publicUrlData } = supabaseClient.storage.from('news-images').getPublicUrl(path);
          imageUrl = publicUrlData.publicUrl;
        }
      } else if (editingId) {
        // Keep existing image if not changed
        const existing = news.find(n => n.id === editingId);
        if (existing) imageUrl = existing.image;
      }
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/news/${editingId}` : `${API}/news`;

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ title, excerpt, image: imageUrl })
    });
    
    resetForm();
    setLoading(false);
    fetchNews();
  };

  const deleteNews = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia? Se moverá a la papelera.')) return;
    
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    await fetch(`${API}/news/${id}`, { method: 'DELETE', headers });
    setNews(ls => ls.filter(x => x.id !== id));
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setTitle(n.title);
    setExcerpt(n.excerpt);
    setFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setExcerpt('');
    setFile(null);
  };

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Gestión de Noticias</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId ? 'Editar Noticia' : 'Nueva Noticia'}</Text>
        <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Bajada" value={excerpt} onChangeText={setExcerpt} />
        <View style={{ marginBottom: 10 }}>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          {editingId && !file && <Text style={{ fontSize: 12, color: '#666' }}>Dejar vacío para mantener la imagen actual</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveNews} disabled={loading}>
            <Text style={styles.btnTextPrimary}>{loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Publicar')}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={[styles.btnGhost, { backgroundColor: '#f3f4f6', flex: 1 }]} onPress={resetForm}>
              <Text style={styles.btnTextGhost}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.list}>
        {news.map(n => (
          <View key={n.id} style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{n.title}</Text>
              <Text style={styles.itemSubtitle} numberOfLines={1}>{n.excerpt}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => startEdit(n)}>
                <Text style={[styles.btnTextGhost, { color: '#2563eb' }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost} onPress={() => deleteNews(n.id)}>
                <Text style={styles.btnTextGhost}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [slots, setSlots] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewEnrollments, setViewEnrollments] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  
  // Filtros para inscripciones
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchActivities = () => fetch(`${API}/activities`).then(r => r.json()).then(setActivities).catch(() => []);

  useEffect(() => { fetchActivities(); }, []);

  useEffect(() => {
    if (viewEnrollments) {
      // Fetch enrollments for this activity
      // Need auth headers if using Supabase backend in future, for now simplified
      let headers = {};
      if (supabaseClient) {
         supabaseClient.auth.getSession().then(({ data }) => {
           if (data?.session?.access_token) {
             headers['Authorization'] = `Bearer ${data.session.access_token}`;
           }
           fetch(`${API}/activities/${viewEnrollments}/enrollments`, { headers })
             .then(r => r.json())
             .then(setEnrollments)
             .catch(() => setEnrollments([]));
         });
      } else {
        fetch(`${API}/activities/${viewEnrollments}/enrollments`)
          .then(r => r.json())
          .then(setEnrollments)
          .catch(() => setEnrollments([]));
      }
    }
  }, [viewEnrollments]);

  const saveActivity = async () => {
    if (!name) return;
    setLoading(true);
    let imageUrl = '';
    
    let headers = { 'Content-Type': 'application/json' };
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }

      if (file) {
        const path = `activities/${Date.now()}-${file.name}`;
        const { error } = await supabaseClient.storage.from('activities-images').upload(path, file);
        if (!error) {
          const { data: publicUrlData } = supabaseClient.storage.from('activities-images').getPublicUrl(path);
          imageUrl = publicUrlData.publicUrl;
        }
      } else if (editingId) {
        const existing = activities.find(a => a.id === editingId);
        if (existing) imageUrl = existing.image;
      }
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/activities/${editingId}` : `${API}/activities`;

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ name, description: desc, slots: Number(slots), image: imageUrl })
    });
    
    resetForm();
    setLoading(false);
    fetchActivities();
  };

  const deleteActivity = async (id) => {
    if (!window.confirm('¿Eliminar actividad? Se moverá a la papelera.')) return;
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    await fetch(`${API}/activities/${id}`, { method: 'DELETE', headers });
    setActivities(ls => ls.filter(x => x.id !== id));
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setName(a.name);
    setDesc(a.description);
    setSlots(String(a.slots || 0));
    setFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setSlots('');
    setFile(null);
  };

  const filteredEnrollments = enrollments.filter(e => {
    const matchName = !filterName || (e.member_name || '').toLowerCase().includes(filterName.toLowerCase());
    const paymentDateStr = e.payment_date ? new Date(e.payment_date).toISOString().split('T')[0] : '';
    const matchDate = !filterDate || paymentDateStr === filterDate;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchName && matchDate && matchStatus;
  });

  const exportEnrollments = () => {
    if (!filteredEnrollments.length) return alert('No hay datos filtrados para exportar');
    
    const headers = ['ID', 'Socio', 'Fecha Pago', 'Monto', 'Metodo', 'Estado'];
    const rows = filteredEnrollments.map(e => [
      e.id,
      e.member_name,
      new Date(e.payment_date).toLocaleDateString(),
      e.payment_amount,
      e.payment_method,
      e.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscritos_${viewEnrollments}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewEnrollments) {
    const activity = activities.find(a => a.id === viewEnrollments);
    return (
      <ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => { setViewEnrollments(null); setFilterName(''); setFilterDate(''); setFilterStatus(''); }} style={{ marginRight: 10 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Inscritos: {activity?.name}</Text>
        </View>
        
        {/* Filtros */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>Filtros</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <TextInput 
              style={[styles.input, { flex: 2, minWidth: 200 }]} 
              placeholder="Buscar por nombre..." 
              value={filterName} 
              onChangeText={setFilterName} 
            />
            <View style={{ flex: 1, minWidth: 150 }}>
               <input 
                 type="date" 
                 style={{...styles.input, height: 42, width: '100%'}} 
                 value={filterDate}
                 onChange={e => setFilterDate(e.target.value)}
               />
            </View>
            <View style={{ flex: 1, minWidth: 150 }}>
              <select 
                style={{...styles.input, height: 42, width: '100%'}} 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <TouchableOpacity style={styles.btn} onPress={exportEnrollments}>
            <Text style={styles.btnTextPrimary}>Exportar CSV / Excel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.tableRow}>
             <Text style={[styles.tableHead, { flex: 2 }]}>Socio</Text>
             <Text style={[styles.tableHead, { flex: 1 }]}>Fecha Pago</Text>
             <Text style={[styles.tableHead, { flex: 1 }]}>Monto</Text>
             <Text style={[styles.tableHead, { flex: 1 }]}>Método</Text>
             <Text style={[styles.tableHead, { flex: 1 }]}>Estado</Text>
          </View>
          {filteredEnrollments.map(e => (
            <View key={e.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#eee' }]}>
               <Text style={[styles.tableCell, { flex: 2 }]}>{e.member_name}</Text>
               <Text style={[styles.tableCell, { flex: 1 }]}>{new Date(e.payment_date).toLocaleDateString()}</Text>
               <Text style={[styles.tableCell, { flex: 1 }]}>${e.payment_amount}</Text>
               <Text style={[styles.tableCell, { flex: 1 }]}>{e.payment_method}</Text>
               <Text style={[styles.tableCell, { flex: 1 }]}>
                 <Text style={{ 
                   color: e.status === 'confirmed' ? '#049756' : e.status === 'pending' ? '#d97706' : '#ef4444',
                   fontWeight: '600'
                 }}>
                   {e.status === 'confirmed' ? 'Confirmado' : e.status === 'pending' ? 'Pendiente' : e.status}
                 </Text>
               </Text>
            </View>
          ))}
          {filteredEnrollments.length === 0 && <Text style={{ padding: 20, textAlign: 'center', color: '#666' }}>No hay inscritos que coincidan con los filtros.</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Gestión de Actividades</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId ? 'Editar Actividad' : 'Nueva Actividad'}</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Descripción" value={desc} onChangeText={setDesc} />
        <TextInput style={styles.input} placeholder="Cupos" value={slots} onChangeText={setSlots} keyboardType="numeric" />
        <View style={{ marginBottom: 10 }}>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          {editingId && !file && <Text style={{ fontSize: 12, color: '#666' }}>Dejar vacío para mantener la imagen actual</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveActivity} disabled={loading}>
            <Text style={styles.btnTextPrimary}>{loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={[styles.btnGhost, { backgroundColor: '#f3f4f6', flex: 1 }]} onPress={resetForm}>
              <Text style={styles.btnTextGhost}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.list}>
        {activities.map(a => (
          <View key={a.id} style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{a.name}</Text>
              <Text style={styles.itemSubtitle}>{a.slots} cupos - {a.description}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity style={styles.btnGhost} onPress={() => setViewEnrollments(a.id)}>
                        <Text style={[styles.btnTextGhost, { color: '#049756' }]}>Inscritos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnGhost} onPress={() => startEdit(a)}>
                        <Text style={[styles.btnTextGhost, { color: '#2563eb' }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnGhost} onPress={() => deleteActivity(a.id)}>
                        <Text style={styles.btnTextGhost}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AdminServices() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchServices = () => fetch(`${API}/services`).then(r => r.json()).then(setServices).catch(() => []);

  useEffect(() => { fetchServices(); }, []);

  const saveService = async () => {
    if (!name) return;
    setLoading(true);
    
    let headers = { 'Content-Type': 'application/json' };
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/services/${editingId}` : `${API}/services`;

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ name, description: desc, category })
    });
    
    resetForm();
    setLoading(false);
    fetchServices();
  };

  const deleteService = async (id) => {
    if (!window.confirm('¿Eliminar servicio? Se moverá a la papelera.')) return;
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    await fetch(`${API}/services/${id}`, { method: 'DELETE', headers });
    setServices(ls => ls.filter(x => x.id !== id));
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setName(s.name);
    setDesc(s.description);
    setCategory(s.category || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setCategory('');
  };

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Gestión de Servicios</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Categoría" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Descripción" value={desc} onChangeText={setDesc} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveService} disabled={loading}>
            <Text style={styles.btnTextPrimary}>{loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={[styles.btnGhost, { backgroundColor: '#f3f4f6', flex: 1 }]} onPress={resetForm}>
              <Text style={styles.btnTextGhost}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.list}>
        {services.map(s => (
          <View key={s.id} style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{s.name}</Text>
              <Text style={styles.itemSubtitle}>{s.category} - {s.description}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => startEdit(s)}>
                <Text style={[styles.btnTextGhost, { color: '#2563eb' }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost} onPress={() => deleteService(s.id)}>
                <Text style={styles.btnTextGhost}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filter) query.append('filter', filter);
    if (status) query.append('status', status);
    
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    
    fetch(`${API}/members?${query.toString()}`, { headers })
      .then(r => r.json())
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [filter, status]);

  const notifyDebt = async (m) => {
    if (!window.confirm(`¿Enviar notificación de deuda a ${m.email}?`)) return;
    
    let headers = { 'Content-Type': 'application/json' };
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }

    try {
      const res = await fetch(`${API}/notify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ memberId: m.id, type: 'debt_reminder' })
      });
      if (res.ok) {
        alert(`Notificación enviada a ${m.email} correctamente.`);
      } else {
        alert('Error al enviar la notificación.');
      }
    } catch (error) {
      alert('Error de conexión.');
    }
  };

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Gestión de Socios</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtros</Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <TextInput 
            style={[styles.input, { flex: 2, minWidth: 200 }]} 
            placeholder="Buscar por nombre o email..." 
            value={filter} 
            onChangeText={setFilter} 
          />
          <View style={{ flex: 1, minWidth: 150 }}>
            <select 
              style={{...styles.input, height: 42}} 
              value={status} 
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Al día</option>
              <option value="debt">Con Deuda</option>
              <option value="inactive">Inactivo</option>
            </select>
          </View>
        </View>
      </View>

      <View style={{ height: 20 }} />
      
      <View style={styles.card}>
        <View style={styles.tableRow}>
           <Text style={[styles.tableHead, { flex: 2 }]}>Socio</Text>
           <Text style={[styles.tableHead, { flex: 1 }]}>Estado</Text>
           <Text style={[styles.tableHead, { flex: 1 }]}>Último Pago</Text>
           <Text style={[styles.tableHead, { flex: 1 }]}>Tipo</Text>
           <Text style={[styles.tableHead, { flex: 1 }]}>Acciones</Text>
        </View>

        {loading && <Text style={{ padding: 20 }}>Cargando...</Text>}
        
        {!loading && members.map(m => (
          <View key={m.id} style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' }]}>
             <View style={{ flex: 2 }}>
               <Text style={styles.itemTitle}>{m.name}</Text>
               <Text style={styles.itemSubtitle}>{m.email}</Text>
               <Text style={styles.itemSubtitle}>{m.phone}</Text>
             </View>
             <View style={{ flex: 1 }}>
               <Text style={[
                 styles.badge, 
                 m.status === 'active' ? { backgroundColor: '#dcfce7', color: '#166534' } : 
                 m.status === 'debt' ? { backgroundColor: '#fee2e2', color: '#991b1b' } : 
                 { backgroundColor: '#f3f4f6', color: '#374151' }
               ]}>
                 {m.status === 'active' ? 'Al día' : m.status === 'debt' ? 'Deuda' : m.status}
               </Text>
             </View>
             <Text style={[styles.tableCell, { flex: 1 }]}>
               {m.last_payment_date ? new Date(m.last_payment_date).toLocaleDateString() : '-'}
             </Text>
             <Text style={[styles.tableCell, { flex: 1 }]}>{m.plan || m.memberType}</Text>
             <View style={{ flex: 1 }}>
               {m.status === 'debt' && (
                 <TouchableOpacity style={[styles.btnGhost, { backgroundColor: '#fee2e2' }]} onPress={() => notifyDebt(m)}>
                   <Text style={[styles.btnTextGhost, { color: '#991b1b', fontSize: 12 }]}>Notificar</Text>
                 </TouchableOpacity>
               )}
             </View>
          </View>
        ))}
        {!loading && members.length === 0 && <Text style={{ padding: 20, textAlign: 'center' }}>No se encontraron socios.</Text>}
      </View>
    </ScrollView>
  );
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch(`${API}/payments`).then(r => r.json()).then(setPayments).catch(() => []);
  }, []);

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Últimos Pagos</Text>
      <View style={styles.list}>
        {payments.slice(0, 20).map(p => (
          <View key={p.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{p.concept}</Text>
              <Text style={styles.itemSubtitle}>{p.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.itemText}>${p.amount}</Text>
              <Text style={[styles.itemText, { color: p.status === 'aprobado' ? '#049756' : '#f42b29' }]}>{p.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AdminTrash() {
  const [entity, setEntity] = useState('news');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, [entity]);

  const loadItems = async () => {
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    fetch(`${API}/admin/trash/${entity}`, { headers }).then(r => r.json()).then(setItems).catch(() => []);
  };

  const restore = async (id) => {
    if (!window.confirm('¿Restaurar elemento?')) return;
    setLoading(true);
    let headers = { 'Content-Type': 'application/json' };
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    await fetch(`${API}/admin/restore/${entity}/${id}`, { method: 'POST', headers });
    setLoading(false);
    loadItems();
  };

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Papelera de Reciclaje</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {['news', 'activities', 'services'].map(e => (
          <TouchableOpacity 
            key={e} 
            style={[styles.btnGhost, entity === e && { backgroundColor: '#e5e7eb' }]} 
            onPress={() => setEntity(e)}
          >
            <Text style={[styles.btnTextGhost, entity === e && { color: '#111827' }]}>
              {e === 'news' ? 'Noticias' : e === 'activities' ? 'Actividades' : 'Servicios'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.list}>
        {items.length === 0 && <Text style={styles.p}>No hay elementos eliminados.</Text>}
        {items.map(item => (
          <View key={item.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{item.title || item.name}</Text>
              <Text style={styles.itemSubtitle}>Eliminado: {new Date(item.deleted_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => restore(item.id)} disabled={loading}>
              <Text style={styles.btnTextPrimary}>Restaurar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AdminAudit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    let headers = {};
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    }
    fetch(`${API}/admin/audit`, { headers }).then(r => r.json()).then(setLogs).catch(() => []);
  };

  return (
    <ScrollView>
      <Text style={styles.pageTitle}>Registro de Auditoría</Text>
      <View style={styles.list}>
        {logs.map(log => (
          <View key={log.id} style={[styles.listItem, { flexDirection: 'column', alignItems: 'flex-start', gap: 5 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Text style={[styles.itemTitle, { color: log.action === 'DELETE' ? '#ef4444' : '#049756' }]}>
                {log.action} {log.entity}
              </Text>
              <Text style={styles.itemSubtitle}>{new Date(log.created_at).toLocaleString()}</Text>
            </View>
            <Text style={styles.itemText}>ID: {log.entity_id}</Text>
            <Text style={styles.itemSubtitle}>User: {log.user_id}</Text>
            <Text style={[styles.itemSubtitle, { fontFamily: 'monospace' }]}>
              {JSON.stringify(log.details)}
            </Text>
          </View>
        ))}
        {logs.length === 0 && <Text style={styles.p}>No hay registros.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', minHeight: '100vh', backgroundColor: '#f3f4f6' },
  sidebar: { width: 260, backgroundColor: '#111827', padding: 24, flexDirection: 'column' },
  content: { flex: 1, padding: 32, overflow: 'scroll', maxHeight: '100vh' },
  sidebarTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginBottom: 32 },
  nav: { gap: 8, flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
  navItemActive: { backgroundColor: '#374151' },
  navText: { color: '#9ca3af', fontWeight: '600' },
  navTextActive: { color: '#ffffff' },
  logoutBtn: { padding: 12, borderTopWidth: 1, borderColor: '#374151', marginTop: 16 },
  logoutText: { color: '#f87171', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: '100vh', backgroundColor: '#f3f4f6' },
  card: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 24 },
  h1: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#049756', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnTextPrimary: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  btnGhost: { padding: 12, alignItems: 'center' },
  btnTextGhost: { color: '#6b7280', fontWeight: '600' },
  errorText: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 200, backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 32, fontWeight: '800', color: '#111827' },
  statLabel: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  list: { gap: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  itemTitle: { fontWeight: '700', color: '#111827' },
  itemSubtitle: { color: '#6b7280', fontSize: 12 },
  itemText: { color: '#374151' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  p: { color: '#374151', marginBottom: 16, textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 12, gap: 10 },
  tableHead: { fontWeight: '700', color: '#374151', fontSize: 14 },
  tableCell: { fontSize: 14, color: '#4b5563' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12, fontWeight: '600', overflow: 'hidden', textAlign: 'center' }
});
