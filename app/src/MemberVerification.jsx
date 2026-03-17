import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useParams } from 'react-router-dom';

import { API_URL } from './config/api';

export default function MemberVerification() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/members/${id}/verify`)
      .then(res => {
        if (!res.ok) throw new Error('Socio no encontrado o código inválido');
        return res.json();
      })
      .then(data => {
        setMember(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#070571" /></View>;
  
  if (error) return (
    <View style={styles.container}>
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.errorTitle}>❌ Verificación Fallida</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    </View>
  );

  const isActive = member.status === 'Al día' || member.status === 'active';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Image source={{uri: '/logo-italia90.png'}} style={styles.logo} />
          <Text style={styles.clubName}>ITALIA 90</Text>
          <Text style={styles.clubSubtitle}>CLUB SOCIAL DEPORTIVO</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.profileSection}>
          <Image 
            source={{uri: member.photo || 'https://via.placeholder.com/150'}} 
            style={styles.photo} 
          />
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.category}>{member.category?.toUpperCase()}</Text>
        </View>

        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{isActive ? 'SOCIO ACTIVO' : 'SOCIO INACTIVO'}</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>Socio N°: {member.id.slice(0,8).toUpperCase()}</Text>
          <Text style={styles.detailText}>Estado: {member.status}</Text>
          <Text style={styles.detailText}>Desde: {new Date(member.joinedAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Documento válido para ingreso al club</Text>
          <Text style={styles.footerDate}>{new Date().toLocaleString()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardError: {
    borderLeftWidth: 5,
    borderLeftColor: '#f42b29',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  clubName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#070571',
    letterSpacing: 1,
  },
  clubSubtitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#049756',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 25,
  },
  statusActive: {
    backgroundColor: '#049756',
  },
  statusInactive: {
    backgroundColor: '#f42b29',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  details: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f42b29',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  footerDate: {
    fontSize: 10,
    color: '#ccc',
  }
});
