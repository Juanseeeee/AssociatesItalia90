import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BiometricSignature from './BiometricSignature';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const MembershipForm = () => {
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user } = useAuth();
  const [type, setType] = useState('adult'); // 'adult' | 'minor'
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dni: user?.dni || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    birthDate: '',
    guardianName: '',
    guardianDni: '',
    guardianEmail: '',
    guardianRelation: '',
    rec1Name: '',
    rec1Id: '',
    rec2Name: '',
    rec2Id: '',
  });

  const [files, setFiles] = useState({
    photo: null,
    medical_cert: null,
    consent: null,
    image_auth: null
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        dni: user.dni || prev.dni,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, event) => {
    if (event.target.files && event.target.files[0]) {
      setFiles(prev => ({ ...prev, [name]: event.target.files[0] }));
    }
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.dni || !formData.email) {
      alert('Por favor complete los campos obligatorios básicos.');
      return false;
    }
    if (!files.photo) {
      alert('La foto carnet es obligatoria.');
      return false;
    }
    if (!files.medical_cert || !formData.medical_cert_date) {
      alert('El certificado médico y su fecha de emisión son obligatorios.');
      return false;
    }
    if (type === 'minor') {
        if (!formData.guardianName || !formData.guardianDni) {
            alert('Los datos del tutor son obligatorios para menores.');
            return false;
        }
        if (!files.consent || !files.image_auth) {
            alert('La documentación adicional para menores es obligatoria.');
            return false;
        }
    }
    return true;
  };

  const handleSignRequest = () => {
    if (validateForm()) {
      setShowBiometric(true);
    }
  };

  const onBiometricSigned = async () => {
    await submitForm();
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('type', type);
      
      const personalData = {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`
      };
      data.append('personal_data', JSON.stringify(personalData));
      
      const recommendations = [];
      if (formData.rec1Name) recommendations.push({ name: formData.rec1Name, id: formData.rec1Id });
      if (formData.rec2Name) recommendations.push({ name: formData.rec2Name, id: formData.rec2Id });
      
      data.append('recommendations', JSON.stringify(recommendations));
      
      data.append('signature', JSON.stringify({
        method: 'biometric_mobile',
        timestamp: new Date().toISOString(),
        device: navigator.userAgent
      }));

      // Append files
      if (files.photo) data.append('photo', files.photo);
      if (files.medical_cert) {
        data.append('medical_cert', files.medical_cert);
        data.append('medical_cert_date', formData.medical_cert_date);
      }
      if (type === 'minor') {
        if (files.consent) data.append('consent', files.consent);
        if (files.image_auth) data.append('image_auth', files.image_auth);
      }

      const headers = {};
      if (localStorage.getItem('token')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }

      const res = await fetch(`${API_URL}/membership-requests`, {
        method: 'POST',
        headers: headers,
        body: data
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Solicitud enviada exitosamente. ID: ${result.id}\nNos pondremos en contacto pronto.`);
        navigate('/');
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Error al enviar solicitud'));
      }

    } catch (error) {
      console.error('Submission error:', error);
      alert('Error de conexión al enviar la solicitud.');
    } finally {
      setLoading(false);
      setShowBiometric(false);
    }
  };

  const renderInput = (label, name, placeholder, keyboardType = 'default', required = false) => (
    <View style={[styles.inputGroup, isMobile && {width: '100%'}]}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      <TextInput
        style={[styles.input, { minHeight: 44 }]}
        placeholder={placeholder}
        value={formData[name]}
        onChangeText={(text) => handleInputChange(name, text)}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  const renderFileInput = (label, name, accept, required = false) => (
    <View style={[styles.inputGroup, isMobile && {width: '100%'}]}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      {/* React Native Web supports HTML elements via 'createElement' or implicitly in JSX if configured, 
          but usually we use standard HTML inputs for files in web context */}
      <input
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(name, e)}
        style={{...styles.fileInput, minHeight: 44}}
      />
      {files[name] && <Text style={styles.fileSelected}>Archivo seleccionado: {files[name].name}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Solicitud de Ingreso</Text>
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'adult' && styles.toggleBtnActive]} 
          onPress={() => setType('adult')}
        >
          <Text style={[styles.toggleText, type === 'adult' && styles.toggleTextActive]}>Adulto (+18)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'minor' && styles.toggleBtnActive]} 
          onPress={() => setType('minor')}
        >
          <Text style={[styles.toggleText, type === 'minor' && styles.toggleTextActive]}>Menor de Edad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos Personales {type === 'minor' && '(del Menor)'}</Text>
        <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nombre', 'firstName', 'Juan', 'default', true)}</View>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Apellido', 'lastName', 'Pérez', 'default', true)}</View>
        </View>
        <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('DNI', 'dni', '12345678', 'numeric', true)}</View>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha Nacimiento *</Text>
                <input 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  style={{...styles.dateInput, minHeight: 44}}
                />
             </View>
          </View>
        </View>
        <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Email', 'email', 'juan@email.com', 'email-address', true)}</View>
          <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Teléfono', 'phone', '1122334455', 'phone-pad', true)}</View>
        </View>
        {renderInput('Dirección', 'address', 'Calle Falsa 123', 'default', true)}
      </View>

      {type === 'minor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Tutor / Responsable</Text>
          <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nombre Tutor', 'guardianName', 'Nombre Completo', 'default', true)}</View>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('DNI Tutor', 'guardianDni', 'DNI', 'numeric', true)}</View>
          </View>
          <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Email Tutor', 'guardianEmail', 'email@tutor.com', 'email-address')}</View>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Relación', 'guardianRelation', 'Padre/Madre/Tutor', 'default', true)}</View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentación Requerida</Text>
        {renderFileInput('Foto Carnet (Rostro despejado)', 'photo', 'image/*', true)}
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha Emisión Apto Físico *</Text>
            <input 
              type="date" 
              value={formData.medical_cert_date || ''} 
              onChange={(e) => handleInputChange('medical_cert_date', e.target.value)}
              style={{...styles.dateInput, minHeight: 44}}
            />
        </View>
        {renderFileInput('Certificado Médico (Apto Físico)', 'medical_cert', '.pdf,image/*', true)}
        
        {type === 'minor' && (
          <>
            {renderFileInput('Consentimiento Informado (Firmado)', 'consent', '.pdf,image/*', true)}
            {renderFileInput('Autorización Uso de Imagen', 'image_auth', '.pdf,image/*', true)}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recomendaciones (Socios Activos)</Text>
        <Text style={styles.hint}>Si estamos en periodo excepcional, deje estos campos vacíos.</Text>
        <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nombre Socio 1', 'rec1Name', 'Nombre')}</View>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nro Socio / DNI', 'rec1Id', 'Nro Socio')}</View>
        </View>
        <View style={[styles.row, isMobile && {flexDirection: 'column', gap: 16}]}>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nombre Socio 2', 'rec2Name', 'Nombre')}</View>
            <View style={[styles.half, isMobile && {width: '100%', minWidth: 'auto'}]}>{renderInput('Nro Socio / DNI', 'rec2Id', 'Nro Socio')}</View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
        onPress={handleSignRequest}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Firmar Digitalmente y Enviar</Text>}
      </TouchableOpacity>

      <View style={{height: 50}} />

      <BiometricSignature 
        visible={showBiometric} 
        onClose={() => setShowBiometric(false)} 
        onSigned={onBiometricSigned} 
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#070571',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Garet', // Assuming font is available
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#070571',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  toggleBtnActive: {
    backgroundColor: '#070571',
  },
  toggleText: {
    color: '#070571',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
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
  row: {
    flexDirection: 'row', // Will wrap on small screens if not handled, but usually OK for web
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  half: {
    width: '48%',
    minWidth: 300, // Break to full width on mobile
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
  fileInput: {
    marginTop: 5,
  },
  fileSelected: {
    fontSize: 12,
    color: '#049756',
    marginTop: 5,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  submitBtn: {
    backgroundColor: '#049756',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MembershipForm;
