import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../PaymentForm';
import DigitalID from '../components/DigitalID';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]); // New state for history
  const [family, setFamily] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  
  // Animation value
  const fadeAnim = useState(new Animated.Value(0))[0];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    if (user?.id) {
      fetchMemberData();
      fetchPaymentHistory(); // Fetch history
      fetchFamily();
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchMemberData = async () => {
    try {
      setLoadingMember(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/members/${user.id}/card`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMemberData(data);
      } else {
        // Fallback for new users without membership record
        setMemberData({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          category: 'Socio',
          status: user.membershipStatus || 'pending_payment',
          joinedAt: new Date().toISOString(),
          expiration: new Date().toISOString(), // Expired by default if new
          photo: user.photoUrl,
          qr_data: `MEMBER:${user.id}`,
          lastPayment: null,
          dni: user.dni
        });
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
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

  if (!user || loadingMember) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#070571" />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  const isMemberActive = memberData?.status === 'active';
  const isExpired = new Date(memberData?.expiration) < new Date();
  const showPayButton = !isMemberActive || isExpired;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomePrefix}>Bienvenido,</Text>
            <Text style={styles.welcomeName}>{user.firstName}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>⏻</Text>
            {!isMobile && <Text style={styles.logoutText}>Cerrar Sesión</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.grid, isMobile && styles.gridMobile]}>
          
          {/* Main Column: Digital ID & Status */}
          <View style={styles.columnMain}>
            
            {/* Digital ID Section */}
            <View style={styles.idSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Carnet Digital</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN VIVO</Text>
                </View>
              </View>
              
              <View style={styles.idCardWrapper}>
                <DigitalID member={memberData} />
              </View>
              
              <View style={styles.idActions}>
                <TouchableOpacity style={styles.downloadBtn} onPress={() => alert('Descargando carnet...')}>
                  <Text style={styles.downloadText}>Descargar Imagen</Text>
                  <Text style={styles.downloadIcon}>⬇️</Text>
                </TouchableOpacity>
                <Text style={styles.idFooterText}>
                  Este carnet es personal e intransferible. Presentalo desde tu celular.
                </Text>
              </View>
            </View>

            {/* Membership Status & Payment */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={styles.cardTitle}>Estado de Membresía</Text>
                  <Text style={styles.cardSubtitle}>Vencimiento: {new Date(memberData.expiration).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, isMemberActive && !isExpired ? styles.statusActive : styles.statusPending]}>
                  <Text style={[styles.statusText, isMemberActive && !isExpired ? styles.textActive : styles.textPending]}>
                    {isMemberActive && !isExpired ? 'AL DÍA' : 'VENCIDO'}
                  </Text>
                </View>
              </View>
              
              {showPayButton && (
                <View style={styles.actionArea}>
                  <View style={styles.alertBox}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                    <Text style={styles.alertText}>
                      Tu cuota está vencida. Regularizá tu situación para acceder a las instalaciones.
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.payBtn}
                    onPress={() => setShowPayment(!showPayment)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payBtnText}>
                      {showPayment ? 'Cancelar' : 'Pagar Cuota Social ($5.000)'}
                    </Text>
                    <Text style={styles.payBtnIcon}>→</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showPayment && (
                <View style={styles.paymentContainer}>
                  <PaymentForm 
                    initialAmount={5000} 
                    concept="Cuota Social Mensual" 
                    onSuccess={async (paymentData) => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_URL}/members/${user.id}/pay`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ amount: 5000, method: 'credit_card' })
                        });
                        
                        if (res.ok) {
                          alert('¡Pago exitoso! Tu carnet se ha actualizado.');
                          setShowPayment(false);
                          fetchMemberData(); // Refresh data immediately
                          fetchPaymentHistory(); // Refresh history
                        } else {
                          alert('Hubo un problema al procesar el pago.');
                        }
                      } catch (e) {
                        console.error(e);
                        alert('Error de conexión');
                      }
                    }}
                  />
                </View>
              )}

              {/* Payment History */}
              <View style={styles.historySection}>
                  <Text style={styles.historyHeader}>ÚLTIMOS MOVIMIENTOS</Text>
                  {paymentHistory.length > 0 ? (
                    paymentHistory.slice(0, 5).map((payment) => (
                       <View key={payment.id} style={styles.historyItem}>
                          <View style={styles.historyIconBox}>
                            <Text style={styles.historyIcon}>💳</Text>
                          </View>
                          <View style={styles.historyInfo}>
                            <Text style={styles.historyConcept}>{payment.concept || 'Cuota Social'}</Text>
                            <Text style={styles.historyDate}>
                                {new Date(payment.date).toLocaleDateString()} • {payment.method === 'credit_card' ? 'Tarjeta' : 'Efectivo'}
                            </Text>
                          </View>
                          <View style={styles.amountContainer}>
                             <Text style={styles.historyAmount}>-${payment.amount.toLocaleString()}</Text>
                             <View style={styles.paymentStatusBadge}>
                                <Text style={styles.paymentStatusText}>APROBADO</Text>
                             </View>
                          </View>
                       </View>
                    ))
                  ) : (
                      <Text style={styles.emptyText}>No hay pagos registrados recientemente.</Text>
                  )}
              </View>
            </View>
          </View>

          {/* Side Column: Family & Extras */}
          <View style={styles.columnSide}>
            
            {/* Family Group */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Grupo Familiar</Text>
                <TouchableOpacity onPress={() => navigate('/family/add')} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>+ Nuevo</Text>
                </TouchableOpacity>
              </View>

              {loadingFamily ? (
                <ActivityIndicator color="#070571" />
              ) : family.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
                  <Text style={styles.emptyTitle}>Sin familiares</Text>
                  <Text style={styles.emptyText}>Agregá a tu familia para gestionar sus carnets.</Text>
                </View>
              ) : (
                <View style={styles.familyList}>
                  {family.map((member) => (
                    <View key={member.id} style={styles.familyItem}>
                      <View style={styles.familyAvatar}>
                          <Text style={styles.avatarText}>{member.firstName[0]}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.familyName}>{member.firstName} {member.lastName}</Text>
                        <Text style={styles.familyRelation}>{member.relation}</Text>
                      </View>
                      <TouchableOpacity 
                          style={styles.iconBtn}
                          onPress={() => alert('Próximamente: Carnet familiar')}
                      >
                          <Text style={styles.iconBtnText}>🆔</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Accesos Rápidos</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('/activities')}>
                  <Text style={styles.actionEmoji}>⚽</Text>
                  <Text style={styles.actionLabel}>Deportes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Próximamente')}>
                  <Text style={styles.actionEmoji}>🎟️</Text>
                  <Text style={styles.actionLabel}>Entradas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Próximamente')}>
                  <Text style={styles.actionEmoji}>👕</Text>
                  <Text style={styles.actionLabel}>Tienda</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Lighter background
    paddingTop: 100,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  mainWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomePrefix: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 44,
  },
  logoutIcon: {
    fontSize: 16,
    color: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  columnMain: {
    flex: 1.4,
    gap: 32,
    minWidth: '50%',
  },
  columnSide: {
    flex: 0.8,
    gap: 24,
    minWidth: '100%',
    width: '100%',
  },

  // Digital ID Section
  idSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  idCardWrapper: {
    shadowColor: '#070571',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
    transform: [{ scale: 1 }], // Base scale
  },
  idActions: {
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  downloadIcon: { fontSize: 14 },
  idFooterText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 300,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusActive: { 
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  statusPending: { 
    backgroundColor: '#ffedd5',
    borderColor: '#fed7aa',
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  textActive: { color: '#15803d' },
  textPending: { color: '#c2410c' },

  // Actions
  actionArea: {
    marginBottom: 24,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#fff7ed',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  alertIcon: { fontSize: 20 },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#9a3412',
    lineHeight: 22,
    fontWeight: '500',
  },
  payBtn: {
    backgroundColor: '#070571',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#070571',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  payBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  payBtnIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentContainer: {
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // History
  historySection: {
    marginTop: 8,
  },
  historyHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIcon: { fontSize: 20 },
  historyInfo: { flex: 1 },
  historyConcept: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.5,
  },

  // Side Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  addBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Family List
  familyList: { gap: 16 },
  familyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  familyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#4338ca',
    fontWeight: '700',
    fontSize: 18,
  },
  familyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  familyRelation: {
    fontSize: 12,
    color: '#64748b',
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBtnText: { fontSize: 14 },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 8,
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});

export default UserDashboard;
