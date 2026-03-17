import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Platform, useWindowDimensions, Animated, 
  ImageBackground, Pressable, TextInput, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DigitalID from '../components/DigitalID';

// Imagen cuidadosamente seleccionada de Freepik para complementar la estética deportiva y profesional del club
const HERO_BG = 'https://img.freepik.com/free-photo/soccer-stadium-night-with-bright-lights-green-grass_181624-58586.jpg';

const TABS = [
    { id: 'overview', label: 'Resumen', icon: '🏠' },
    { id: 'id', label: 'Mi Carnet', icon: '🆔' },
    { id: 'payments', label: 'Mis Pagos', icon: '💳' },
    { id: 'activities', label: 'Actividades', icon: '⚽' },
    { id: 'family', label: 'Grupo Familiar', icon: '👨‍👩‍👧‍👦' },
  ];

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [memberData, setMemberData] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [family, setFamily] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals state
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [newFamilyMember, setNewFamilyMember] = useState({ firstName: '', lastName: '', dni: '', relation: 'Hijo/a', birthDate: '', medicalInfo: '' });
  const [enrollMemberId, setEnrollMemberId] = useState(user?.id);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const skeletonPulseAnim = useRef(new Animated.Value(0.5)).current;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  const getUserName = () => {
    if (!user) return 'Usuario';
    return user.firstName || user.first_name || 'Usuario';
  };

  useEffect(() => {
    const status = searchParams.get('payment_status') || searchParams.get('collection_status');
    if (status) {
      if (status === 'approved') {
        alert('¡Pago exitoso! Tu estado se ha actualizado.');
      } else if (status === 'failure' || status === 'rejected') {
        alert('El pago fue rechazado. Por favor intentá nuevamente.');
      } else if (status === 'pending' || status === 'in_process') {
        alert('El pago está en proceso. Te avisaremos cuando se confirme.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const enrollActivityName = searchParams.get('enroll');
    if (enrollActivityName && activities.length > 0) {
      const activity = activities.find(a => a.name.toLowerCase() === enrollActivityName.toLowerCase());
      if (activity) {
        setSelectedActivity(activity);
        setShowEnrollModal(true);
        // Clear the param so it doesn't reopen on every render if the user closes it
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('enroll');
        navigate({ search: newParams.toString() }, { replace: true });
      }
    }
  }, [searchParams, activities, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchMemberData();
      fetchPaymentHistory();
      fetchFamily();
      fetchActivities();
      fetchEnrollments();
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for skeletons
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    
    pulseAnim.start();

    return () => {
      pulseAnim.stop();
    };
  }, []);

  const changeTab = (tabId) => {
    if (activeTab === tabId) return;
    Animated.sequence([
      Animated.timing(contentFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
    setTimeout(() => setActiveTab(tabId), 150);
  };

  const fetchMemberData = async () => {
    try {
      setLoadingMember(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/members/${user.id}/card`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback for name if backend returns empty but we have user data
        if (!data.name && user) {
          const firstName = user.firstName || user.first_name || '';
          const lastName = user.lastName || user.last_name || '';
          data.name = `${firstName} ${lastName}`.trim() || 'Socio';
        }
        setMemberData(data);
      } else {
        const firstName = user.firstName || user.first_name || '';
        const lastName = user.lastName || user.last_name || '';
        setMemberData({
          id: user.id,
          name: `${firstName} ${lastName}`.trim() || 'Usuario',
          category: 'Socio',
          status: user.membershipStatus || 'pending_payment',
          joinedAt: new Date().toISOString(),
          expiration: new Date().toISOString(),
          photo: user.photoUrl,
          qr_data: `MEMBER:${user.id}`,
          lastPayment: null,
          dni: user.dni
        });
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      // Set fallback data to prevent crash
      const firstName = user.firstName || user.first_name || '';
      const lastName = user.lastName || user.last_name || '';
      setMemberData({
        id: user.id,
        name: `${firstName} ${lastName}`.trim() || 'Usuario',
        category: 'Socio',
        status: 'pending_payment',
        joinedAt: new Date().toISOString(),
        expiration: new Date().toISOString(),
        photo: user.photoUrl,
        qr_data: `MEMBER:${user.id}`,
        lastPayment: null,
        dni: user.dni || ''
      });
    } finally {
      setLoadingMember(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/members/${user.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchFamily = async () => {
    setLoadingFamily(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/family`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoadingFamily(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`${API_URL}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/activities/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleAddFamily = async () => {
    if (!newFamilyMember.firstName || !newFamilyMember.lastName || !newFamilyMember.dni) {
      alert('Por favor completá los campos obligatorios');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      // Using FormData if we were uploading files, but for simplicity here JSON if API supports it.
      // The API endpoint expects FormData because of upload.fields middleware.
      // So we must use FormData.
      
      const formData = new FormData();
      formData.append('firstName', newFamilyMember.firstName);
      formData.append('lastName', newFamilyMember.lastName);
      formData.append('dni', newFamilyMember.dni);
      formData.append('relation', newFamilyMember.relation);
      formData.append('birthDate', newFamilyMember.birthDate || new Date().toISOString().split('T')[0]);
      formData.append('medicalInfo', newFamilyMember.medicalInfo || '');

      const res = await fetch(`${API_URL}/user/family`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert('Familiar agregado correctamente');
        setShowFamilyModal(false);
        setNewFamilyMember({ firstName: '', lastName: '', dni: '', relation: 'Hijo/a', birthDate: '', medicalInfo: '' });
        fetchFamily();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agregar familiar');
      }
    } catch (error) {
      console.error('Error adding family:', error);
      alert('Error de conexión');
    }
  };

  const handleEnroll = async () => {
    if (!selectedActivity || !enrollMemberId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/activities/${selectedActivity.id}/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ memberId: enrollMemberId })
      });

      if (res.ok) {
        alert('Inscripción exitosa!');
        setShowEnrollModal(false);
        fetchEnrollments();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al inscribirse');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Error de conexión');
    }
  };

  const handleMercadoPagoPayment = async () => {
    setPaymentProcessing(true);
    try {
      const response = await fetch(`${API_URL}/payments/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: 'Cuota Social Mensual - Club Italia 90',
          quantity: 1,
          price: 12000,
          email: user.email,
          userId: user.id
        })
      });

      if (!response.ok) throw new Error('Error al iniciar el pago');

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('No se pudo generar el link de pago');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al conectar con Mercado Pago');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!user || loadingMember) {
    return (
      <View style={[styles.container, { padding: 24 }]} accessible={true} accessibilityLabel="Cargando panel de usuario">
        <Animated.View style={[styles.skeletonHero, { opacity: skeletonPulseAnim }]} />
        <View style={styles.contentWrapper}>
          <Animated.View style={[styles.skeletonNav, { opacity: skeletonPulseAnim }]} />
          <View style={styles.tabContentGrid}>
            <View style={styles.mainCol}>
              <Animated.View style={[styles.skeletonCard, { opacity: skeletonPulseAnim }]} />
              <Animated.View style={[styles.skeletonCard, { opacity: skeletonPulseAnim }]} />
            </View>
            <View style={styles.sideCol}>
              <Animated.View style={[styles.skeletonCard, { height: 400, opacity: skeletonPulseAnim }]} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const isMemberActive = memberData?.status === 'active';
  const isExpired = new Date(memberData?.expiration) < new Date();
  const isPaymentFailed = memberData?.payment_status === 'failure';
  const isPaymentPending = memberData?.payment_status === 'pending';
  
  const showPayButton = !isMemberActive || isExpired || isPaymentFailed;

  const getPaymentButtonText = () => {
    if (paymentProcessing) return 'Procesando...';
    if (isPaymentFailed) return 'Reintentar Pago ($12.000)';
    if (isPaymentPending) return 'Completar Pago ($12.000)';
    return 'Abonar Cuota ($12.000)';
  };

  const getStatusInfo = () => {
    if (isMemberActive && !isExpired) return { text: 'AL DÍA', color: '#15803d', bg: '#dcfce7', icon: '✅' };
    if (isPaymentPending) return { text: 'PENDIENTE', color: '#c2410c', bg: '#ffedd5', icon: '⏳' };
    if (isPaymentFailed) return { text: 'FALLIDO', color: '#b91c1c', bg: '#fee2e2', icon: '❌' };
    return { text: 'VENCIDO', color: '#b91c1c', bg: '#fee2e2', icon: '⚠️' };
  };

  const statusInfo = getStatusInfo();

  // --- Render Functions ---

  const getMemberName = (id) => {
    if (id === user.id) return 'Tú';
    const fam = family.find(f => f.id === id);
    if (fam) return `${fam.first_name || fam.firstName} (${fam.relation})`;
    return 'Miembro desconocido';
  };

  const renderHero = () => (
    <ImageBackground source={{ uri: HERO_BG }} style={styles.heroBackground} imageStyle={{ opacity: 0.8 }}>
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.logoText}>Club Italia 90</Text>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Text style={styles.logoutIcon}>⏻</Text>
            {!isMobile && <Text style={styles.logoutText}>Salir</Text>}
          </TouchableOpacity>
        </View>
        
        <View style={styles.heroProfileRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getUserName().charAt(0)}</Text>
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.welcomeText}>¡Hola, {getUserName()}!</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
                <Text style={styles.badgeIcon}>{statusInfo.icon}</Text>
                <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
              </View>
              <View style={styles.badgeDark}>
                <Text style={styles.badgeDarkText}>Socio #{memberData?.id ? memberData.id.substring(0,6).toUpperCase() : '---'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );

  const renderNavTabs = () => (
    <View style={styles.navWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}
            onPress={() => changeTab(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.id }}
          >
            <Text style={styles.navTabIcon}>{tab.icon}</Text>
            <Text style={[styles.navTabText, activeTab === tab.id && styles.navTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverview = () => {
    if (!memberData) return null;
    const expirationDate = memberData.expiration ? new Date(memberData.expiration).toLocaleDateString() : 'N/A';
    
    return (
    <View style={styles.tabContentGrid}>
      <View style={styles.mainCol}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado de Cuenta</Text>
          <Text style={styles.cardSubtitle}>
            Vencimiento de cuota: <Text style={styles.boldText}>{expirationDate}</Text>
          </Text>
          
          {showPayButton ? (
            <View style={styles.actionBox}>
              <View style={[styles.alertRow, isPaymentFailed && styles.alertRowError]}>
                <Text style={styles.alertIcon}>{isPaymentFailed ? '❌' : '⚠️'}</Text>
                <Text style={styles.alertText}>
                  {isPaymentFailed ? 'Tu último pago fue rechazado. Por favor intentá con otro medio.' : 
                   isPaymentPending ? 'Tenés un pago en proceso.' : 
                   'Tu cuota está vencida o pendiente. Regularizá tu situación.'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.primaryBtn, isPaymentFailed && styles.primaryBtnError]}
                onPress={handleMercadoPagoPayment}
                disabled={paymentProcessing}
                accessibilityRole="button"
                accessibilityLabel={getPaymentButtonText()}
              >
                {paymentProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{getPaymentButtonText()}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✨</Text>
              <Text style={styles.successText}>¡Estás al día! Gracias por ser parte del club.</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Accesos Rápidos</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.actionTile} onPress={() => navigate('/activities')} accessibilityRole="button" accessibilityLabel="Ir a Actividades">
              <View style={[styles.actionIconBg, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.actionTileIcon}>⚽</Text>
              </View>
              <Text style={styles.actionTileLabel}>Actividades</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => changeTab('id')} accessibilityRole="button" accessibilityLabel="Ver mi carnet">
              <View style={[styles.actionIconBg, { backgroundColor: '#f5f3ff' }]}>
                <Text style={styles.actionTileIcon}>📱</Text>
              </View>
              <Text style={styles.actionTileLabel}>Ver Carnet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => alert('Próximamente: Reservas')} accessibilityRole="button" accessibilityLabel="Ir a Canchas">
              <View style={[styles.actionIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.actionTileIcon}>🏟️</Text>
              </View>
              <Text style={styles.actionTileLabel}>Canchas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => alert('Próximamente: Tienda')} accessibilityRole="button" accessibilityLabel="Ir a Tienda">
              <View style={[styles.actionIconBg, { backgroundColor: '#fffbeb' }]}>
                <Text style={styles.actionTileIcon}>👕</Text>
              </View>
              <Text style={styles.actionTileLabel}>Tienda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sideCol}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mi Carnet Digital</Text>
          <Text style={styles.cardSubtitle}>Presentalo en la entrada</Text>
          <View style={styles.miniIdWrapper}>
            <DigitalID member={memberData} />
          </View>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => changeTab('id')} accessibilityRole="button" accessibilityLabel="Ver carnet en detalle">
            <Text style={styles.outlineBtnText}>Ver en detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  };

  const renderDigitalID = () => {
    if (!memberData) return null;
    return (
    <View style={styles.centerContainer}>
      <View style={styles.idFullWrapper}>
        <View style={styles.liveBadgeFull}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTextFull}>SISTEMA EN VIVO</Text>
        </View>
        <DigitalID member={memberData} />
        <View style={styles.idActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => alert('Descargando carnet...')} accessibilityRole="button" accessibilityLabel="Guardar carnet como imagen">
            <Text style={styles.outlineBtnText}>⬇️ Guardar como imagen</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>Este carnet es personal e intransferible.</Text>
        </View>
      </View>
    </View>
    );
  };

  const renderPayments = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Historial de Pagos</Text>
        <View style={styles.badgeDark}>
          <Text style={styles.badgeDarkText}>Total: {paymentHistory.length}</Text>
        </View>
      </View>
      
      {paymentHistory.length > 0 ? (
        <View style={styles.listContainer}>
          {paymentHistory.map((payment) => (
            <View key={payment.id} style={styles.listItem}>
              <View style={styles.listIconBox}>
                <Text style={styles.listIcon}>🧾</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{payment.concept || 'Cuota Social'}</Text>
                <Text style={styles.listSubtitle}>
                  {new Date(payment.date).toLocaleDateString()} • {payment.method === 'credit_card' ? 'Tarjeta' : 'Efectivo'}
                </Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listAmount}>${payment.amount.toLocaleString()}</Text>
                <View style={styles.statusPillSmall}>
                  <Text style={styles.statusPillText}>APROBADO</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Sin movimientos</Text>
          <Text style={styles.emptyText}>Aún no tenés pagos registrados en el sistema.</Text>
        </View>
      )}
    </View>
  );

  const renderActivities = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Actividades Disponibles</Text>
        <View style={styles.badgeDark}>
          <Text style={styles.badgeDarkText}>Total: {activities.length}</Text>
        </View>
      </View>
      
      {loadingActivities ? (
        <ActivityIndicator color="#070571" style={{ marginVertical: 40 }} />
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚽</Text>
          <Text style={styles.emptyTitle}>Sin actividades</Text>
          <Text style={styles.emptyText}>No hay actividades disponibles en este momento.</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {activities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <ImageBackground 
                source={{ uri: activity.image || 'https://via.placeholder.com/400x200?text=Actividad' }} 
                style={styles.activityImage}
                imageStyle={{ borderRadius: 12 }}
              >
                <View style={styles.activityOverlay}>
                  <Text style={styles.activityTitle}>{activity.name}</Text>
                </View>
              </ImageBackground>
              <View style={styles.activityContent}>
                <Text style={styles.activitySchedule}>🕒 {activity.schedule || 'A confirmar'}</Text>
                <Text style={styles.activityPrice}>
                  {activity.cost > 0 ? `$${activity.cost}/mes` : 'Gratuito'}
                </Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
                <TouchableOpacity 
                  style={styles.primaryBtnSmall} 
                  onPress={() => {
                    setSelectedActivity(activity);
                    setShowEnrollModal(true);
                  }}
                >
                  <Text style={styles.primaryBtnSmallText}>Inscribirse</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Enrollments Section */}
      <View style={[styles.cardHeaderRow, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>Mis Inscripciones</Text>
      </View>
      {enrollments.length > 0 ? (
        <View style={styles.listContainer}>
          {enrollments.map((enrollment) => (
            <View key={enrollment.id} style={styles.listItem}>
               <View style={styles.listIconBox}>
                <Text style={styles.listIcon}>✅</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{enrollment.activities?.name}</Text>
                <Text style={styles.listSubtitle}>
                  Inscrito el {new Date(enrollment.enrolled_at).toLocaleDateString()} • {getMemberName(enrollment.member_id)}
                </Text>
              </View>
              <View style={styles.statusPillSmall}>
                  <Text style={styles.statusPillText}>{enrollment.status.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.helperText}>No estás inscrito en ninguna actividad.</Text>
      )}
    </View>
  );

  const renderFamily = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>Grupo Familiar</Text>
          <Text style={styles.cardSubtitle}>Gestioná los carnets de tu familia</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowFamilyModal(true)} accessibilityRole="button" accessibilityLabel="Agregar familiar">
          <Text style={styles.primaryBtnSmallText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loadingFamily ? (
        <ActivityIndicator color="#070571" style={{ marginVertical: 40 }} />
      ) : family.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>Sin familiares</Text>
          <Text style={styles.emptyText}>Agregá a tu familia para que también tengan sus carnets digitales.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {family.map((member) => (
            <View key={member.id} style={styles.listItem}>
              <View style={styles.avatarMedium}>
                <Text style={styles.avatarMediumText}>{member.first_name?.[0] || member.firstName?.[0] || 'F'}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{member.first_name || member.firstName} {member.last_name || member.lastName}</Text>
                <Text style={styles.listSubtitle}>{member.relation}</Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setSelectedFamilyMember(member)} accessibilityLabel="Ver carnet familiar">
                <Text style={styles.iconBtnText}>🆔</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderHero()}
          
          <View style={styles.contentWrapper}>
            {renderNavTabs()}
            
            <Animated.View style={[styles.tabContentArea, { opacity: contentFadeAnim }]}>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'id' && renderDigitalID()}
              {activeTab === 'payments' && renderPayments()}
              {activeTab === 'activities' && renderActivities()}
              {activeTab === 'family' && renderFamily()}
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Family Member Modal */}
      <Modal
        visible={showFamilyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFamilyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Familiar</Text>
            
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput 
              style={styles.input}
              value={newFamilyMember.firstName}
              onChangeText={(t) => setNewFamilyMember({...newFamilyMember, firstName: t})}
            />

            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput 
              style={styles.input}
              value={newFamilyMember.lastName}
              onChangeText={(t) => setNewFamilyMember({...newFamilyMember, lastName: t})}
            />

            <Text style={styles.inputLabel}>DNI</Text>
            <TextInput 
              style={styles.input}
              value={newFamilyMember.dni}
              keyboardType="numeric"
              onChangeText={(t) => setNewFamilyMember({...newFamilyMember, dni: t})}
            />

            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TextInput 
              style={styles.input}
              value={newFamilyMember.birthDate}
              placeholder="YYYY-MM-DD"
              onChangeText={(t) => setNewFamilyMember({...newFamilyMember, birthDate: t})}
            />

            <Text style={styles.inputLabel}>Relación</Text>
            <View style={styles.relationOptions}>
              {['Hijo/a', 'Cónyuge', 'Padre/Madre'].map((rel) => (
                <TouchableOpacity 
                  key={rel}
                  style={[styles.relationChip, newFamilyMember.relation === rel && styles.relationChipActive]}
                  onPress={() => setNewFamilyMember({...newFamilyMember, relation: rel})}
                >
                  <Text style={[styles.relationChipText, newFamilyMember.relation === rel && styles.relationChipTextActive]}>{rel}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Información Médica (Opcional)</Text>
            <TextInput 
              style={styles.input}
              value={newFamilyMember.medicalInfo}
              placeholder="Alergias, condiciones, etc."
              onChangeText={(t) => setNewFamilyMember({...newFamilyMember, medicalInfo: t})}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowFamilyModal(false)}>
                <Text style={styles.outlineBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddFamily}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enroll Modal */}
      <Modal
        visible={showEnrollModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEnrollModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inscribirse a Actividad</Text>
            <Text style={styles.modalSubtitle}>
              {selectedActivity?.name}
            </Text>

            <Text style={styles.inputLabel}>¿Quién asistirá?</Text>
            <View style={styles.memberSelectContainer}>
              <TouchableOpacity 
                style={[styles.memberOption, enrollMemberId === user?.id && styles.memberOptionActive]}
                onPress={() => setEnrollMemberId(user?.id)}
              >
                <Text style={styles.memberOptionText}>Yo ({user?.firstName})</Text>
              </TouchableOpacity>
              
              {family.map(f => (
                <TouchableOpacity 
                  key={f.id}
                  style={[styles.memberOption, enrollMemberId === f.id && styles.memberOptionActive]}
                  onPress={() => setEnrollMemberId(f.id)}
                >
                  <Text style={styles.memberOptionText}>
                    {f.first_name || f.firstName} ({f.relation})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowEnrollModal(false)}>
                <Text style={styles.outlineBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleEnroll}>
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Family Digital ID Modal */}
      <Modal
        visible={!!selectedFamilyMember}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedFamilyMember(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 }} 
            onPress={() => setSelectedFamilyMember(null)}
          >
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
          
          <View style={{ width: '90%', maxWidth: 400 }}>
            {selectedFamilyMember && (
              <DigitalID member={{
                id: selectedFamilyMember.id,
                name: `${selectedFamilyMember.first_name || selectedFamilyMember.firstName} ${selectedFamilyMember.last_name || selectedFamilyMember.lastName}`,
                category: selectedFamilyMember.relation,
                status: selectedFamilyMember.membership_status === 'pending' ? 'pending' : (memberData?.status || 'active'),
                expiration: memberData?.expiration || new Date().toISOString(),
                photo: selectedFamilyMember.photo_url || selectedFamilyMember.photo,
                qr_data: `FAMILY:${selectedFamilyMember.id}`,
                lastPayment: memberData?.lastPayment,
                dni: selectedFamilyMember.dni
              }} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Hero Section
  heroBackground: {
    width: '100%',
    height: 280,
    backgroundColor: '#070571',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 5, 113, 0.75)',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 92 : 72,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  logoutIcon: { color: '#fff', fontSize: 14 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#070571',
  },
  heroTextContainer: { flex: 1 },
  welcomeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  badgeDark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeDarkText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Content Layout
  contentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: -30,
  },
  navWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navTabActive: {
    backgroundColor: '#eff6ff',
  },
  navTabIcon: { fontSize: 16 },
  navTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  navTabTextActive: {
    color: '#070571',
    fontWeight: '700',
  },

  tabContentArea: {
    paddingBottom: 60,
  },
  tabContentGrid: {
    flexDirection: Platform.OS === 'web' && window.innerWidth >= 1024 ? 'row' : 'column',
    gap: 24,
  },
  mainCol: { flex: 1.5, gap: 24 },
  sideCol: { flex: 1, gap: 24 },

  // Generic Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  boldText: { fontWeight: '700', color: '#334155' },

  // Alerts & Boxes
  actionBox: { marginTop: 24 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  alertRowError: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  alertIcon: { fontSize: 18 },
  alertText: { flex: 1, fontSize: 13, color: '#9a3412', fontWeight: '500', lineHeight: 20 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successIcon: { fontSize: 20 },
  successText: { color: '#166534', fontWeight: '600', fontSize: 14 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#070571',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#070571',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryBtnError: { backgroundColor: '#b91c1c', shadowColor: '#b91c1c' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  primaryBtnSmall: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnSmallText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginTop: 16,
  },
  outlineBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBtnText: { fontSize: 16 },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  actionTile: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTileIcon: { fontSize: 20 },
  actionTileLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },

  // Lists
  listContainer: { marginTop: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listIcon: { fontSize: 20 },
  avatarMedium: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMediumText: { color: '#4338ca', fontSize: 20, fontWeight: '800' },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  listSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  listRight: { alignItems: 'flex-end', gap: 6 },
  listAmount: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  statusPillSmall: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPillText: { color: '#15803d', fontSize: 10, fontWeight: '800' },

  // Empty States
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

  // Full ID View
  centerContainer: { alignItems: 'center', width: '100%' },
  idFullWrapper: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#070571',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
    width: '100%',
    maxWidth: 400,
  },
  liveBadgeFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' },
  liveTextFull: { color: '#16a34a', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  miniIdWrapper: {
    marginTop: 16,
    transform: [{ scale: 0.9 }],
    alignItems: 'center',
  },
  idActions: { marginTop: 32, width: '100%', gap: 16 },
  helperText: { textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: '500' },
  
  // Skeleton Loaders
  skeletonHero: {
    height: 280,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
    marginBottom: 24,
  },
  skeletonNav: {
    height: 60,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 24,
  },
  skeletonCard: {
    height: 200,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
  },
  skeletonAnim: {
    opacity: 0.7,
  },

  // Activities Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 16,
  },
  activityCard: {
    width: Platform.OS === 'web' && window.innerWidth >= 768 ? '48%' : '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  activityImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  activityOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  activityTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  activityContent: {
    padding: 16,
    gap: 8,
  },
  activitySchedule: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  activityPrice: {
    fontSize: 16,
    color: '#070571',
    fontWeight: '800',
  },
  activityDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  relationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  relationChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  relationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  relationChipTextActive: {
    color: '#2563eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    justifyContent: 'flex-end',
  },
  memberSelectContainer: {
    gap: 12,
  },
  memberOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  memberOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  memberOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  }
});

export default UserDashboard;