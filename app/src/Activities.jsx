import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';

import { API_URL } from './config/api';

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [email, setEmail] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/activities`)
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRegister = async () => {
    if (!email) return alert('Por favor ingrese su email de socio');
    
    setRegistering(true);
    try {
      const res = await fetch(`${API_URL}/activities/${selectedActivity.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al inscribirse');
      }
      
      if (data.payment_required) {
        alert(`Inscripción iniciada. El costo es $${data.cost}. Redirigiendo a pagos...`);
        // In a real flow, navigate to payment gateway or payment form
        // navigate(`/pagos?enrollment_id=${data.enrollment.id}`);
        setSelectedActivity(null);
      } else {
        alert('¡Inscripción exitosa!');
        setSelectedActivity(null);
      }
      
    } catch (error) {
      alert(error.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#049756" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actividades y Deportes</Text>
        <Text style={styles.subtitle}>Descubrí todo lo que Italia 90 tiene para vos</Text>
      </View>

      <View style={styles.grid}>
        {activities.map(activity => (
          <View key={activity.id} style={styles.card}>
            <Image 
              source={{ uri: activity.image || '/assets/default-activity.jpg' }} 
              style={styles.cardImage} 
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                 <Text style={styles.cardTitle}>{activity.name}</Text>
                 {activity.cost > 0 ? (
                    <Text style={styles.costBadge}>${activity.cost}</Text>
                 ) : (
                    <Text style={[styles.costBadge, styles.freeBadge]}>GRATIS</Text>
                 )}
              </View>
              
              <Text style={styles.description}>{activity.description}</Text>
              
              <View style={styles.details}>
                <Text style={styles.detailItem}>📅 {activity.schedule}</Text>
                <Text style={styles.detailItem}>👥 Cupos: {activity.slots}</Text>
              </View>

              <TouchableOpacity 
                style={styles.button}
                onPress={() => setSelectedActivity(activity)}
              >
                <Text style={styles.buttonText}>Inscribirme</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={!!selectedActivity} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inscripción a {selectedActivity?.name}</Text>
            <Text style={styles.modalText}>
              Para inscribirte, ingresá tu email de socio. Si la actividad tiene costo, se generará un cupón de pago.
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setSelectedActivity(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleRegister}
                disabled={registering}
              >
                <Text style={styles.confirmBtnText}>
                  {registering ? 'Procesando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  header: {
    padding: 40,
    backgroundColor: '#070571',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  grid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  costBadge: {
    backgroundColor: '#049756',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  freeBadge: {
    backgroundColor: '#3b82f6',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  details: {
    marginBottom: 20,
  },
  detailItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#f42b29',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#049756',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
