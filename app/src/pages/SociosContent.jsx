import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Image, useWindowDimensions, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export default function SociosContent() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('planes');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (activeTab === 'actividades') {
      fetch(`${API_URL}/activities`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setActivities(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [activeTab]);

  const tabs = [
    { key: 'planes', label: 'Planes' },
    { key: 'beneficios', label: 'Beneficios' },
    { key: 'actividades', label: 'Actividades' }
  ];

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <ImageBackground source={{uri: '/assets/hero-campania2.jpeg'}} style={[styles.pageHero, isMobile && {minHeight: '40vh'}]}>
        <View style={styles.pageHeroOverlay}>
          <View style={styles.wrapper}>
            <Text style={[styles.pageHeroTitle, isMobile && {fontSize: 32}]}>HAZTE SOCIO</Text>
            <Text style={[styles.pageHeroSubtitle, isMobile && {fontSize: 16}]}>Sé parte de la pasión. Elegí el plan que mejor se adapte a vos.</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab.key} 
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.wrapper}>
          
          {/* Planes Tab */}
          {activeTab === 'planes' && (
            <View style={[styles.pricingGrid, isMobile && {gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', gap: 24}]}>
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>MENOR</Text>
                <Text style={styles.pricingPrice}>$8.000<Text style={styles.pricingPeriod}>/mes</Text></Text>
                <View style={styles.divider}/>
                <Text style={styles.pricingFeature}>✓ Acceso al club</Text>
                <Text style={styles.pricingFeature}>✓ Escuela deportiva</Text>
                <Text style={styles.pricingFeature}>✓ Descuentos en indumentaria</Text>
                <TouchableOpacity style={styles.btnOutline} onPress={()=>navigate('/asociate')}><Text style={styles.btnTextOutline}>ASOCIARME</Text></TouchableOpacity>
              </View>

              <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
                <View style={styles.popularTag}><Text style={styles.popularTagText}>MÁS ELEGIDO</Text></View>
                <Text style={[styles.pricingTitle, styles.textWhite]}>INDIVIDUAL</Text>
                <Text style={[styles.pricingPrice, styles.textWhite]}>$12.000<Text style={[styles.pricingPeriod, styles.textWhiteOpt]}>/mes</Text></Text>
                <View style={[styles.divider, {borderColor:'rgba(255,255,255,0.2)'}]}/>
                <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Acceso total al club</Text>
                <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Gimnasio incluido</Text>
                <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Voz y voto en asambleas</Text>
                <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Sorteos exclusivos</Text>
                <TouchableOpacity style={styles.btnWhite} onPress={()=>navigate('/asociate')}><Text style={styles.btnTextPrimary}>QUIERO ESTE PLAN</Text></TouchableOpacity>
              </View>

              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>FAMILIAR</Text>
                <Text style={styles.pricingPrice}>$24.000<Text style={styles.pricingPeriod}>/mes</Text></Text>
                <View style={styles.divider}/>
                <Text style={styles.pricingFeature}>✓ Grupo familiar directo</Text>
                <Text style={styles.pricingFeature}>✓ Acceso para todos</Text>
                <Text style={styles.pricingFeature}>✓ Escuelas deportivas bonificadas</Text>
                <TouchableOpacity style={styles.btnOutline} onPress={()=>navigate('/register')}><Text style={styles.btnTextOutline}>ASOCIARME</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {/* Beneficios Tab */}
          {activeTab === 'beneficios' && (
             <View style={[styles.benefitsGrid, isMobile && {gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', gap: 24}]}>
                <View style={styles.benefitItem}>
                   <Text style={styles.benefitIcon}>🏟️</Text>
                   <Text style={styles.benefitTitle}>Prioridad en Entradas</Text>
                   <Text style={styles.benefitDesc}>Acceso anticipado a la compra de tickets para partidos importantes.</Text>
                </View>
                <View style={styles.benefitItem}>
                   <Text style={styles.benefitIcon}>👕</Text>
                   <Text style={styles.benefitTitle}>Descuentos en Tienda</Text>
                   <Text style={styles.benefitDesc}>20% off en indumentaria oficial y merchandising del club.</Text>
                </View>
                <View style={styles.benefitItem}>
                   <Text style={styles.benefitIcon}>🎉</Text>
                   <Text style={styles.benefitTitle}>Eventos Privados</Text>
                   <Text style={styles.benefitDesc}>Invitaciones a cenas, sorteos y encuentros con jugadores.</Text>
                </View>
                <View style={styles.benefitItem}>
                   <Text style={styles.benefitIcon}>💪</Text>
                   <Text style={styles.benefitTitle}>Gimnasio Sin Cargo</Text>
                   <Text style={styles.benefitDesc}>Acceso libre a nuestro gimnasio de última generación.</Text>
                </View>
             </View>
          )}

          {/* Actividades Tab (Independent Section) */}
          {activeTab === 'actividades' && (
            <View>
              <Text style={styles.sectionIntro}>Explorá las actividades disponibles para nuestros socios.</Text>
              <View style={[styles.activitiesGrid, isMobile && {gridTemplateColumns: '1fr', gap: 16}]}>
                {activities.map(a => (
                  <View key={a.id} style={styles.activityCard}>
                    <Image source={{uri: a.image || '/assets/escuelita-4.jpg'}} style={styles.activityImg} />
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityTitle}>{a.name}</Text>
                        <View style={[styles.statusBadge, a.slots > 0 ? styles.statusOpen : styles.statusFull]}>
                           <Text style={[styles.statusText, a.slots > 0 ? styles.statusOpenText : styles.statusFullText]}>
                             {a.slots > 0 ? 'DISPONIBLE' : 'AGOTADO'}
                           </Text>
                        </View>
                      </View>
                      <Text style={styles.activityDesc} numberOfLines={2}>
                        {a.description || 'Actividad recreativa y deportiva para todas las edades.'}
                      </Text>
                      <View style={styles.activityFooter}>
                        <Text style={styles.activitySchedule}>{a.schedule || 'Consultar horarios'}</Text>
                        <TouchableOpacity style={styles.btnSmall} onPress={() => navigate(`/dashboard?tab=activities&enroll=${encodeURIComponent(a.name)}`)}>
                           <Text style={styles.btnSmallText}>Inscribirme</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
                {activities.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Cargando actividades...</Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  pageHero: {
    width: '100%',
    minHeight: '50vh',
    justifyContent: 'center',
    position: 'relative',
  },
  pageHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageHeroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pageHeroSubtitle: {
    fontSize: 20,
    color: '#e2e8f0',
    textAlign: 'center',
    maxWidth: 600,
  },
  wrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  sectionContainer: {
    paddingVertical: 48,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    position: 'sticky',
    top: 70, // Adjust for main header
    zIndex: 800,
  },
  tabScroll: {
    paddingHorizontal: 24,
    gap: 16,
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#049756',
    borderColor: '#049756',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#fff',
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 32,
    alignItems: 'flex-start',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
  },
  pricingCardFeatured: {
    backgroundColor: '#070571',
    borderColor: '#070571',
    transform: [{scale: 1.05}],
    zIndex: 10,
    boxShadow: '0 10px 30px rgba(7,5,113,0.2)',
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pricingPrice: {
    fontSize: 48,
    fontWeight: '900',
    color: '#049756',
    marginBottom: 24,
  },
  pricingPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  textWhite: {
    color: '#fff',
  },
  textWhiteOpt: {
    color: 'rgba(255,255,255,0.7)',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
  },
  pricingFeature: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
    fontWeight: '500',
  },
  popularTag: {
    position: 'absolute',
    top: -16,
    left: '50%',
    transform: [{translateX: '-50%'}],
    backgroundColor: '#f42b29',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  popularTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  btnOutline: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnTextOutline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  btnWhite: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070571',
    textTransform: 'uppercase',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 32,
  },
  benefitItem: {
    padding: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  benefitIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  benefitDesc: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  sectionIntro: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  activitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  activityImg: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
  },
  activityContent: {
    padding: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#dcfce7',
  },
  statusFull: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusOpenText: {
    color: '#166534',
  },
  statusFullText: {
    color: '#991b1b',
  },
  activityDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  activitySchedule: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  btnSmall: {
    backgroundColor: '#049756',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gridColumn: '1 / -1',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  }
});