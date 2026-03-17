import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import BiometricSignature from './BiometricSignature';

import { API_URL } from './config/api';

const TravelAuthorization = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    minorName: '',
    minorDni: '',
    destination: '',
    startDate: '',
    endDate: '',
    parent1Name: '',
    parent1Dni: '',
    parent1Email: '',
  });

  const [parent1Signature, setParent1Signature] = useState(null);
  const [showBiometric, setShowBiometric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const initiateSignature = () => {
    if (!formData.parent1Name || !formData.parent1Dni) {
      alert('Por favor complete sus datos (Padre/Tutor 1) antes de firmar.');
      return;
    }
    setShowBiometric(true);
  };

  const onSigned = () => {
    const timestamp = new Date().toISOString();
    setParent1Signature({
      signed: true,
      timestamp,
      method: 'biometric_mobile'
    });
    setShowBiometric(false);
  };

  const submitAuthorization = async () => {
    if (!parent1Signature) {
      alert('Debe firmar la solicitud para continuar.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: 'travel_auth',
        data: formData,
        signatures: {
          parent1: parent1Signature,
          parent2: null
        }
      };

      const res = await fetch(`${API_URL}/travel-authorizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMessage = 'Error al procesar la solicitud';
        try {
          const err = await res.json();
          errorMessage = err.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      setCreatedId(result.id);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={formData[name]}
        onChangeText={(text) => handleInputChange(name, text)}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  if (createdId) {
    const link = `${window.location.origin}/autorizacion-viaje/${createdId}`;
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>¡Solicitud Iniciada!</Text>
            <Text style={styles.successText}>
              Ha firmado correctamente como primer tutor. Ahora debe compartir el siguiente enlace con el segundo padre/tutor para que complete su firma.
            </Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText}>{link}</Text>
            </View>
            <TouchableOpacity 
              style={styles.copyBtn}
              onPress={() => {
                navigator.clipboard.writeText(link);
                alert('Enlace copiado al portapapeles');
              }}
            >
              <Text style={styles.copyBtnText}>COPIAR ENLACE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigate('/')} style={styles.homeBtn}>
              <Text style={styles.homeBtnText}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Autorización de Viaje (Menores)</Text>
      <Text style={styles.subtitle}>
        Paso 1: Inicie el trámite completando los datos del viaje y su firma. Luego recibirá un enlace para el segundo tutor.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Menor y Viaje</Text>
        {renderInput('Nombre Completo del Menor', 'minorName', 'Nombre y Apellido')}
        {renderInput('DNI del Menor', 'minorDni', 'DNI', 'numeric')}
        {renderInput('Destino', 'destination', 'Ciudad / País')}
        <View style={styles.row}>
          <View style={styles.half}>
             <Text style={styles.label}>Fecha Salida</Text>
             <input 
               type="date" 
               value={formData.startDate} 
               onChange={e => handleInputChange('startDate', e.target.value)} 
               style={styles.dateInput} 
             />
          </View>
          <View style={styles.half}>
             <Text style={styles.label}>Fecha Regreso</Text>
             <input 
               type="date" 
               value={formData.endDate} 
               onChange={e => handleInputChange('endDate', e.target.value)} 
               style={styles.dateInput} 
             />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sus Datos (Padre/Tutor 1)</Text>
        {renderInput('Nombre Completo', 'parent1Name', 'Nombre')}
        {renderInput('DNI', 'parent1Dni', 'DNI', 'numeric')}
        {renderInput('Email (para recibir copia)', 'parent1Email', 'email@ejemplo.com', 'email-address')}
        
        {parent1Signature ? (
          <View style={styles.signedBox}>
            <Text style={styles.signedText}>✓ Firmado digitalmente</Text>
            <Text style={styles.signedDate}>{new Date(parent1Signature.timestamp).toLocaleString()}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.signBtn} onPress={initiateSignature}>
              <Text style={styles.signBtnText}>Firmar (Biometría)</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
          style={[styles.submitBtn, (!parent1Signature || loading) && styles.disabledBtn]} 
          onPress={submitAuthorization}
          disabled={!parent1Signature || loading}
      >
          {loading ? <ActivityIndicator color="#fff" /> : 
              <Text style={styles.submitBtnText}>Generar Enlace de Firma</Text>
          }
      </TouchableOpacity>
      
      <View style={{height: 50}} />

      <BiometricSignature 
        visible={showBiometric} 
        onClose={() => setShowBiometric(false)} 
        onSigned={onSigned} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#070571',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f42b29',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
    width: '100%',
    fontFamily: 'inherit',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '48%',
  },
  signBtn: {
    backgroundColor: '#070571',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signedBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4caf50',
    marginTop: 10,
  },
  signedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signedDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  submitBtn: {
    backgroundColor: '#049756',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#049756',
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  linkBox: {
    backgroundColor: '#f0f2f5',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkText: {
    color: '#070571',
    fontSize: 14,
    textAlign: 'center',
  },
  copyBtn: {
    backgroundColor: '#070571',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  copyBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  homeBtn: {
    padding: 10,
  },
  homeBtnText: {
    color: '#666',
  }
});

export default TravelAuthorization;
