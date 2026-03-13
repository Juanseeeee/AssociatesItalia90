import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FamilyManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    birthDate: '',
    relation: 'child', // child, spouse, other
    medicalInfo: ''
  });
  const [files, setFiles] = useState({
    photo: null,
    dni_copy: null,
    school_cert: null,
    auth_parents: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, event) => {
    if (event.target.files && event.target.files[0]) {
      setFiles(prev => ({ ...prev, [name]: event.target.files[0] }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.dni) {
      alert('Complete los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/family`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) throw new Error('Error al agregar familiar');

      alert('Familiar agregado exitosamente');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Error al guardar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Agregar Menor / Familiar</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput style={styles.input} value={formData.firstName} onChangeText={t => handleInputChange('firstName', t)} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Apellido *</Text>
        <TextInput style={styles.input} value={formData.lastName} onChangeText={t => handleInputChange('lastName', t)} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>DNI *</Text>
        <TextInput style={styles.input} value={formData.dni} onChangeText={t => handleInputChange('dni', t)} keyboardType="numeric" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fecha de Nacimiento (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={formData.birthDate} onChangeText={t => handleInputChange('birthDate', t)} placeholder="2015-05-20" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Relación</Text>
        <View style={styles.pickerContainer}>
             <TouchableOpacity style={[styles.option, formData.relation === 'child' && styles.optionSelected]} onPress={() => handleInputChange('relation', 'child')}>
                <Text style={[styles.optionText, formData.relation === 'child' && styles.optionTextSelected]}>Hijo/a</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.option, formData.relation === 'spouse' && styles.optionSelected]} onPress={() => handleInputChange('relation', 'spouse')}>
                <Text style={[styles.optionText, formData.relation === 'spouse' && styles.optionTextSelected]}>Cónyuge</Text>
             </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Información Médica Relevante</Text>
        <TextInput style={[styles.input, {height: 80}]} multiline value={formData.medicalInfo} onChangeText={t => handleInputChange('medicalInfo', t)} />
      </View>

      <Text style={styles.sectionTitle}>Documentación</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Foto Carnet</Text>
        <input type="file" onChange={e => handleFileChange('photo', e)} style={styles.fileInput} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fotocopia DNI</Text>
        <input type="file" onChange={e => handleFileChange('dni_copy', e)} style={styles.fileInput} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Certificado Escolar</Text>
        <input type="file" onChange={e => handleFileChange('school_cert', e)} style={styles.fileInput} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Autorización Padres</Text>
        <input type="file" onChange={e => handleFileChange('auth_parents', e)} style={styles.fileInput} />
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>GUARDAR</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 100, // Header spacer
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#374151',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#049756',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fileInput: {
    marginTop: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#049756',
    borderColor: '#049756',
  },
  optionText: {
    color: '#374151',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FamilyManager;
