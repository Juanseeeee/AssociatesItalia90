import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

import { API_URL } from './config/api';

const DigitalID = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (id === 'demo') {
      setMember({
        id: '12345678',
        name: 'Juan Pérez',
        type: 'Socio Activo',
        status: 'Al día',
        joinedAt: '2020-03-15',
        expiration: '2026-04-01',
        photo: 'https://randomuser.me/api/portraits/men/1.jpg',
        qr_data: 'DEMO-123'
      });
      setLoading(false);
    } else {
      fetch(`${API_URL}/members/${id}/card`)
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('No se encontró el socio');
        })
        .then(data => {
            setMember({
                id: data.id,
                name: data.name,
                type: data.category,
                status: data.status,
                joinedAt: data.joinedAt || new Date().toISOString(), // Fallback if not provided
                expiration: data.expiration ? new Date(data.expiration).toLocaleDateString() : '---',
                photo: data.photo,
                qr_data: data.qr_data
            });
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setError('No se pudo cargar el carnet. Puede que la solicitud esté pendiente o no exista.');
            setLoading(false);
        });
    }
  }, [id]);

  const handleDownload = async () => {
    try {
        const element = document.getElementById('digital-card-view');
        if (!element) return;
        
        const canvas = await html2canvas(element, { 
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true 
        });
        
        const link = document.createElement('a');
        link.download = `carnet-${member.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error('Download failed', e);
        alert('Error al descargar el carnet. Intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#070571" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigate('/')}>
          <Text style={styles.btnText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View nativeID="digital-card-view" ref={cardRef} style={styles.card}>
        <View style={styles.header}>
          <Image source={{ uri: '/logo-italia90.png' }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.clubName}>CLUB ITALIA 90</Text>
        </View>
        
        <View style={styles.body}>
          <View style={styles.photoContainer}>
             {member.photo ? (
                <Image source={{ uri: member.photo }} style={styles.photo} />
             ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderText}>{member.name.charAt(0)}</Text>
                </View>
             )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberType}>{member.type}</Text>
            <Text style={styles.memberId}>Socio #{member.id.slice(0, 8)}</Text>
            
            <View style={styles.statusBadge}>
               <View style={[styles.statusDot, { backgroundColor: member.status === 'Al día' || member.status === 'Activo' ? '#049756' : '#f42b29' }]} />
               <Text style={styles.statusText}>{member.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.qrContainer}>
             <QRCodeCanvas value={`${window.location.origin}/verificar-socio/${member.id}`} size={100} />
          </View>
          <View style={styles.dates}>
             <Text style={styles.dateLabel}>Válido hasta: {member.expiration}</Text>
             <Text style={styles.dateLabel}>Miembro desde: {new Date(member.joinedAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <View style={styles.watermark}>
            <Text style={styles.watermarkText}>ITALIA 90</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
        <Text style={styles.downloadBtnText}>Descargar Carnet</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigate('/')}>
        <Text style={styles.backBtnText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  card: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  header: {
    backgroundColor: '#070571',
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  clubName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Garet', // Assuming font
    letterSpacing: 1,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 15,
    marginTop: -50, // Pull up to overlap header
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#e1e1e1',
  },
  photoPlaceholderText: {
    fontSize: 40,
    color: '#999',
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  memberType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  memberId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 8,
  },
  dates: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.03,
    transform: [{ rotate: '-45deg' }],
    zIndex: -1,
    pointerEvents: 'none',
  },
  watermarkText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#000',
  },
  downloadBtn: {
    marginTop: 30,
    backgroundColor: '#049756',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#049756',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
  },
  backBtnText: {
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    fontSize: 18,
    color: '#f42b29',
    marginBottom: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#070571',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DigitalID;
