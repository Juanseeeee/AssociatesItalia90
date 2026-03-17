import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Image, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function InstitutionalContent() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const [activeSection, setActiveSection] = useState('historia');
  
  // Refs for smooth scrolling
  const historiaRef = useRef(null);
  const misionRef = useRef(null);
  const visionRef = useRef(null);
  const equipoRef = useRef(null);
  const contactoRef = useRef(null);

  const sections = {
    historia: historiaRef,
    mision: misionRef,
    vision: visionRef,
    equipo: equipoRef,
    contacto: contactoRef
  };

  const scrollToSection = (sectionKey) => {
    if (sections[sectionKey] && sections[sectionKey].current) {
      // Use window.scrollTo for better control with offset for sticky headers
      const element = sections[sectionKey].current;
      const offset = 100; // Height of sticky header + padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionKey);

      // Accessibility: Move focus to the section for screen readers
      if (Platform.OS === 'web') {
        element.setAttribute('tabIndex', '-1');
        element.focus({ preventScroll: true });
        // Remove tabIndex after blur to keep DOM clean
        element.addEventListener('blur', () => {
          element.removeAttribute('tabIndex');
        }, { once: true });
      }
    }
  };

  // Handle initial deep link
  useEffect(() => {
    if (sectionParam && sections[sectionParam]) {
      // Small timeout to ensure rendering
      setTimeout(() => scrollToSection(sectionParam), 100);
    }
  }, [sectionParam]);

  // Intersection Observer to update active section on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is near top
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find the key corresponding to the intersecting element
          const sectionKey = Object.keys(sections).find(key => sections[key].current === entry.target);
          if (sectionKey) {
            setActiveSection(sectionKey);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sections).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { key: 'historia', label: 'Historia' },
    { key: 'mision', label: 'Misión' },
    { key: 'vision', label: 'Visión' },
    { key: 'equipo', label: 'Autoridades' },
    { key: 'contacto', label: 'Contacto' }
  ];

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <ImageBackground 
        source={{uri: '/assets/hero-campania2.jpeg'}} 
        style={[styles.pageHero, isMobile && {minHeight: '50vh'}]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel="Vista panorámica del estadio del Club Italia 90"
      >
        <View style={styles.pageHeroOverlay}>
          <View style={styles.wrapper}>
            <Text style={[styles.pageHeroTitle, isMobile && {fontSize: 32}]}>QUIÉNES SOMOS</Text>
            <Text style={[styles.pageHeroSubtitle, isMobile && {fontSize: 16}]}>Conocé la historia y los valores que hacen grande a nuestro club.</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Sticky Navigation */}
      <View style={[styles.stickyNav, isMobile && styles.stickyNavMobile]} accessible={true} accessibilityRole="tablist">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickyNavContent}>
          {navItems.map((item) => (
            <TouchableOpacity 
              key={item.key} 
              onPress={() => scrollToSection(item.key)}
              style={[
                styles.stickyNavItem, 
                activeSection === item.key && styles.stickyNavItemActive
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSection === item.key }}
              accessibilityLabel={`Ir a la sección ${item.label}`}
            >
              <Text style={[
                styles.stickyNavText, 
                activeSection === item.key && styles.stickyNavTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {/* Historia Section */}
        <View ref={sections.historia} style={styles.sectionBlock}>
          <View style={styles.wrapper}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Nuestra Historia</Text>
            <View style={[styles.twoColumnGrid, isMobile && {flexDirection: 'column'}]}>
              <View style={styles.textColumn}>
                <Text style={styles.paragraph}>
                  Fundado en 1990, el Club Social y Deportivo Italia 90 nació del sueño de un grupo de amigos apasionados por el deporte y la comunidad. Lo que comenzó como un pequeño predio de fútbol 5, hoy se ha convertido en una institución modelo en la región.
                </Text>
                <Text style={styles.paragraph}>
                  A lo largo de más de tres décadas, hemos crecido junto a nuestros socios, ampliando nuestras instalaciones para incluir canchas profesionales, gimnasio, salones de eventos y una amplia variedad de disciplinas deportivas.
                </Text>
                <Text style={styles.paragraph}>
                  Nuestro compromiso siempre ha sido el mismo: fomentar el deporte como herramienta de inclusión social y desarrollo personal.
                </Text>
              </View>
              <View style={styles.imageColumn}>
                <Image 
                  source={{uri: '/assets/escuelita-1.jpg'}} 
                  style={styles.sectionImage} 
                  accessibilityLabel="Niños jugando fútbol en la escuelita del club"
                  loading="lazy"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Misión Section */}
        <View ref={sections.mision} style={[styles.sectionBlock, styles.bgLight]}>
          <View style={styles.wrapper}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Nuestra Misión</Text>
            <View style={[styles.twoColumnGrid, isMobile && {flexDirection: 'column-reverse'}]}>
              <View style={styles.imageColumn}>
                <Image 
                  source={{uri: '/assets/escuelita-3.jpg'}} 
                  style={styles.sectionImage} 
                  accessibilityLabel="Entrenamiento deportivo en el club"
                  loading="lazy"
                />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.paragraph}>
                  Brindar un espacio de encuentro, recreación y formación deportiva de calidad para toda la comunidad, promoviendo valores como el respeto, la solidaridad y el trabajo en equipo.
                </Text>
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightText}>"Formar personas a través del deporte"</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Visión Section */}
        <View ref={sections.vision} style={styles.sectionBlock}>
          <View style={styles.wrapper}>
            <Text style={styles.sectionTitle}>Nuestra Visión</Text>
            <Text style={[styles.paragraph, {textAlign: 'center', maxWidth: 800, alignSelf: 'center'}]}>
              Ser reconocidos como el club social y deportivo referente de la región, destacándonos por la excelencia de nuestras instalaciones, la calidad humana de nuestros profesionales y nuestro compromiso inquebrantable con el bienestar de nuestros socios.
            </Text>
            <View style={[styles.valuesGrid, isMobile && {gridTemplateColumns: '1fr'}]}>
              <View style={styles.valueCard}>
                <Text style={styles.valueIcon}>🤝</Text>
                <Text style={styles.valueTitle}>Compromiso Social</Text>
                <Text style={styles.valueDesc}>Trabajamos activamente para integrar a la comunidad.</Text>
              </View>
              <View style={styles.valueCard}>
                <Text style={styles.valueIcon}>🏆</Text>
                <Text style={styles.valueTitle}>Excelencia Deportiva</Text>
                <Text style={styles.valueDesc}>Buscamos el máximo rendimiento en cada disciplina.</Text>
              </View>
              <View style={styles.valueCard}>
                <Text style={styles.valueIcon}>🌱</Text>
                <Text style={styles.valueTitle}>Sostenibilidad</Text>
                <Text style={styles.valueDesc}>Cuidamos nuestras instalaciones y el medio ambiente.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Equipo Section */}
        <View ref={sections.equipo} style={[styles.sectionBlock, styles.bgLight]}>
          <View style={styles.wrapper}>
            <Text style={styles.sectionTitle}>Comisión Directiva</Text>
            <View style={[styles.teamGrid, isMobile && {gridTemplateColumns: '1fr', gap: 24}]}>
              <View style={styles.teamCard}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>JP</Text></View>
                <Text style={styles.teamName}>Juan Pérez</Text>
                <Text style={styles.teamRole}>Presidente</Text>
              </View>
              <View style={styles.teamCard}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>MG</Text></View>
                <Text style={styles.teamName}>María González</Text>
                <Text style={styles.teamRole}>Vicepresidenta</Text>
              </View>
              <View style={styles.teamCard}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>RL</Text></View>
                <Text style={styles.teamName}>Roberto López</Text>
                <Text style={styles.teamRole}>Secretario</Text>
              </View>
              <View style={styles.teamCard}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>AS</Text></View>
                <Text style={styles.teamName}>Ana Silva</Text>
                <Text style={styles.teamRole}>Tesorera</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contacto Section */}
        <View ref={sections.contacto} style={styles.sectionBlock}>
          <View style={styles.wrapper}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={[styles.contactContainer, isMobile && {flexDirection: 'column'}]}>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>DIRECCIÓN</Text>
                  <Text style={styles.contactValue}>Av. Principal 123, Buenos Aires</Text>
                </View>
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>TELÉFONO</Text>
                  <Text style={styles.contactValue}>+54 11 1234-5678</Text>
                </View>
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>EMAIL</Text>
                  <Text style={styles.contactValue}>info@italia90.com.ar</Text>
                </View>
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>HORARIOS</Text>
                  <Text style={styles.contactValue}>Lunes a Viernes: 08:00 - 23:00</Text>
                  <Text style={styles.contactValue}>Sábados y Domingos: 09:00 - 20:00</Text>
                </View>
              </View>
              <View style={styles.mapContainer}>
                {/* Map Link */}
                <TouchableOpacity 
                  style={styles.mapPlaceholder} 
                  onPress={() => window.open('https://www.google.com/maps/search/?api=1&query=Club+Social+y+Deportivo+Italia+90', '_blank')}
                  accessibilityRole="link"
                  accessibilityLabel="Abrir ubicación en Google Maps"
                >
                  <Text style={styles.mapIcon}>📍</Text>
                  <Text style={styles.mapText}>Ver en Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: '100vh', // Ensure full height
  },
  pageHero: {
    width: '100%',
    minHeight: '60vh',
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
  stickyNav: {
    position: 'sticky',
    top: 100, // Adjusted to sit below the fixed main header
    backgroundColor: '#fff',
    zIndex: 900,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  stickyNavMobile: {
    top: 60, // Adjust for mobile header
  },
  stickyNavContent: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  stickyNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  stickyNavItemActive: {
    backgroundColor: '#049756',
  },
  stickyNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  stickyNavTextActive: {
    color: '#fff',
  },
  contentContainer: {
    paddingBottom: 80,
  },
  sectionBlock: {
    paddingVertical: 80,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  bgLight: {
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 40,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 28,
    color: '#475569',
    marginBottom: 24,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  imageColumn: {
    flex: 1,
  },
  sectionImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    objectFit: 'cover',
  },
  highlightBox: {
    borderLeftWidth: 4,
    borderColor: '#049756',
    paddingLeft: 24,
    marginTop: 24,
  },
  highlightText: {
    fontSize: 24,
    fontStyle: 'italic',
    color: '#049756',
    fontWeight: '600',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 32,
    marginTop: 48,
  },
  valueCard: {
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  valueIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  valueDesc: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 32,
  },
  teamCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#64748b',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  teamRole: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  contactContainer: {
    flexDirection: 'row',
    gap: 48,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 48,
    overflow: 'hidden',
  },
  contactInfo: {
    flex: 1,
    gap: 32,
  },
  contactItem: {
    marginBottom: 16,
  },
  contactLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  contactValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
  }
});