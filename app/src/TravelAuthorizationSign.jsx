import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useParams, useNavigate } from 'react-router-dom';
import BiometricSignature from './BiometricSignature';

import { API_URL } from './config/api';

export default function TravelAuthorizationSign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authData, setAuthData] = useState(null);
  const [parent2Data, setParent2Data] = useState({
    name: '',
    dni: '',
    email: ''
  });
  const [signature, setSignature] = useState(null);
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/travel-authorizations/${id}`)
      .then(async res => {
        if (!res.ok) {
             let errorMessage = 'Autorización no encontrada';
             try {
                const err = await res.json();
                errorMessage = err.error || errorMessage;
             } catch (e) {}
             throw new Error(errorMessage);
        }
        return res.json();
      })
      .then(data => {
        setAuthData(data);
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        navigate('/');
      });
  }, [id, navigate]);

  const initiateSignature = () => {
    if (!parent2Data.name || !parent2Data.dni) {
      alert('Por favor complete sus datos antes de firmar.');
      return;
    }
    setShowBiometric(true);
  };

  const onSigned = () => {
    const timestamp = new Date().toISOString();
    setSignature({
        signed: true,
        timestamp,
        method: 'biometric_mobile'
    });
    setShowBiometric(false);
  };

  const handleSubmit = async () => {
    if (!parent2Data.name || !parent2Data.dni || !signature) {
      alert('Por favor complete todos los datos y firme.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/travel-authorizations/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent2_data: parent2Data,
          signature
        })
      });

      if (!res.ok) {
        let errorMessage = 'Error al firmar';
        try {
            const err = await res.json();
            errorMessage = err.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      alert('¡Autorización completada exitosamente!');
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Error al procesar la firma');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 50}} />;

  if (authData?.status === 'approved') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Autorización Completada</Text>
          <Text style={styles.text}>Esta autorización ya ha sido firmada por ambos padres/tutores.</Text>
          <TouchableOpacity onPress={() => navigate('/')} style={styles.btn}>
            <Text style={styles.btnText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Firma de Autorización de Viaje</Text>
        <Text style={styles.subtitle}>Datos de la Solicitud</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Menor:</Text>
          <Text style={styles.value}>{authData.minor_name} (DNI: {authData.minor_dni})</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Destino:</Text>
          <Text style={styles.value}>{authData.destination}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Fechas:</Text>
          <Text style={styles.value}>{authData.start_date} al {authData.end_date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Iniciado por:</Text>
          <Text style={styles.value}>{authData.parent1_data?.name}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Sus Datos (Padre/Tutor 2)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre Completo" 
          value={parent2Data.name}
          onChangeText={t => setParent2Data({...parent2Data, name: t})}
        />
        <TextInput 
          style={styles.input} 
          placeholder="DNI" 
          value={parent2Data.dni}
          onChangeText={t => setParent2Data({...parent2Data, dni: t})}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email (Opcional)" 
          value={parent2Data.email}
          onChangeText={t => setParent2Data({...parent2Data, email: t})}
        />

        <Text style={styles.label}>Firma Digital</Text>
        
        {signature ? (
          <View style={styles.signedBox}>
            <Text style={styles.signedText}>✓ Firmado digitalmente</Text>
            <Text style={styles.signedDate}>{new Date(signature.timestamp).toLocaleString()}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.signBtn} onPress={initiateSignature}>
              <Text style={styles.signBtnText}>Firmar (Biometría)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleSubmit} style={[styles.submitBtn, !signature && styles.disabledBtn]} disabled={!signature}>
          <Text style={styles.submitText}>Firmar y Finalizar</Text>
        </TouchableOpacity>
      </View>

      <BiometricSignature 
        visible={showBiometric} 
        onClose={() => setShowBiometric(false)} 
        onSigned={onSigned} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#070571' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#333' },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  label: { fontWeight: 'bold', marginRight: 10, width: 100 },
  value: { flex: 1 },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 10, fontSize: 16 },
  signBtn: {
    backgroundColor: '#049756',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  signBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  signedBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    alignItems: 'center',
    marginVertical: 15,
  },
  signedText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 16 },
  signedDate: { color: '#666', fontSize: 12, marginTop: 5 },
  submitBtn: {
    backgroundColor: '#070571',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBtn: { backgroundColor: '#ccc' },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  clearBtn: { padding: 10, alignItems: 'center' },
  clearText: { color: '#f42b29' },
  btn: { backgroundColor: '#070571', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  btnText: { color: 'white', fontWeight: 'bold' },
});
