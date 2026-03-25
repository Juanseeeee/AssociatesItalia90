import React from 'react';
import { View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { QRCodeCanvas } from 'qrcode.react';
import { API_URL } from '../config/api';

const DigitalID = ({ member }) => {
  if (!member) return null;

  const isExpired = new Date(member.expiration) < new Date();
  const isActive = member.status === 'active' && !isExpired;
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${API_URL.replace('/api', '')}${photo}`;
  };

  const photoUrl = getPhotoUrl(member.photo);

  return (
    <View style={styles.cardContainer}>
      {/* Background Pattern */}
      <View style={styles.bgPatternCircle} />
      <View style={styles.bgPatternRect} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>I90</Text>
            </View>
            <Text style={styles.clubName}>ITALIA 90</Text>
        </View>
        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
            {isActive ? 'ACTIVO' : 'INACTIVO'}
          </Text>
        </View>
      </View>

      {/* Main Content Row */}
      <View style={styles.content}>
        
        {/* Left: Photo & Category */}
        <View style={styles.leftCol}>
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image 
                source={{ uri: photoUrl }} 
                style={styles.photo} 
                accessibilityLabel={`Foto de perfil de ${member.name}`}
              />
            ) : (
              <Text style={{fontSize: 40}} accessibilityLabel="Sin foto de perfil">👤</Text>
            )}
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{member.category || 'SOCIO'}</Text>
          </View>
        </View>

        {/* Right: Data Fields */}
        <View style={styles.rightCol}>
          <View style={styles.nameContainer} accessible={true} accessibilityLabel={`Nombre y apellido: ${member.name}`}>
            <Text style={styles.nameLabel}>NOMBRE Y APELLIDO</Text>
            <Text style={styles.name} numberOfLines={2}>{member.name}</Text>
          </View>
          
          <View style={styles.dataGrid}>
            <View style={styles.dataItem} accessible={true} accessibilityLabel={`Número de socio: ${member.id.slice(0, 8).toUpperCase()}`}>
              <Text style={styles.label}>N° SOCIO</Text>
              <Text style={styles.valueMono}>{member.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.dataItem} accessible={true} accessibilityLabel={`DNI: ${member.dni || 'No registrado'}`}>
              <Text style={styles.label}>DNI</Text>
              <Text style={styles.valueMono}>{member.dni || '-'}</Text>
            </View>
            <View style={styles.dataItem} accessible={true} accessibilityLabel={`Vencimiento: ${formatDate(member.expiration)}`}>
              <Text style={styles.label}>VENCIMIENTO</Text>
              <Text style={[styles.valueMono, isExpired && styles.expiredText]}>
                {formatDate(member.expiration)}
              </Text>
            </View>
            <View style={styles.dataItem} accessible={true} accessibilityLabel={`Último pago: ${member.lastPayment ? formatDate(member.lastPayment) : 'No registrado'}`}>
              <Text style={styles.label}>ÚLTIMO PAGO</Text>
              <Text style={styles.valueMono}>
                {member.lastPayment ? formatDate(member.lastPayment) : '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer: QR Code & Validation */}
      <View style={styles.footer}>
        <View 
          style={styles.qrWrapper}
          accessible={true}
          accessibilityLabel={`Código QR para validación del socio ${member.name}`}
          accessibilityRole="image"
        >
          <QRCodeCanvas 
            value={member.qr_data || `MEMBER:${member.id}`} 
            size={64}
            level={"M"}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            marginSize={0}
          />
        </View>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>VALIDACIÓN DIGITAL</Text>
          <Text style={styles.footerHash}>{member.id.slice(-12).toUpperCase()}</Text>
          <Text style={styles.footerNote}>Presentar este carnet al ingresar a las instalaciones.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#070571', // Brand Blue fallback
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #070571 0%, #040c26 100%)',
      }
    }),
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    boxShadow: '0px 10px 20px rgba(7, 5, 113, 0.3)',
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 260,
  },
  // Background Deco
  bgPatternCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bgPatternRect: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(4, 151, 86, 0.1)', // Brand Green hint
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#070571',
    fontSize: 12,
    fontWeight: '900',
  },
  clubName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeBadge: {
    backgroundColor: 'rgba(4, 151, 86, 0.2)',
    borderColor: '#049756',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(244, 43, 41, 0.2)', // Brand Red
    borderColor: '#f42b29',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeText: { color: '#4ade80' },
  inactiveText: { color: '#fca5a5' },

  content: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    zIndex: 1,
  },
  leftCol: {
    alignItems: 'center',
    gap: 8,
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
    elevation: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    backgroundColor: '#f42b29', // Brand Red
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  rightCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nameContainer: {
    marginBottom: 12,
  },
  nameLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  dataGrid: {
    gap: 10,
  },
  dataItem: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 1,
  },
  valueMono: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.5,
  },
  expiredText: {
    color: '#fca5a5',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  qrWrapper: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerHash: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
});

export default DigitalID;
