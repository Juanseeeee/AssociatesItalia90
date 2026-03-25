import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const FamilyManager = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
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

  useEffect(() => {
    if (id) {
      const fetchMember = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/user/family/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setFormData({
              firstName: data.first_name || data.firstName || '',
              lastName: data.last_name || data.lastName || '',
              dni: data.dni || '',
              birthDate: data.birth_date || data.birthDate || '',
              relation: data.relation || 'child',
              medicalInfo: data.medical_info || data.medicalInfo || ''
            });
          }
        } catch (error) {
          console.error('Error fetching family member:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchMember();
    }
  }, [id]);

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
      const url = id ? `${API_URL}/user/family/${id}` : `${API_URL}/user/family`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) throw new Error(`Error al ${id ? 'actualizar' : 'agregar'} familiar`);

      alert(`Familiar ${id ? 'actualizado' : 'agregado'} exitosamente`);
      navigate('/dashboard?tab=family');
    } catch (error) {
      console.error(error);
      alert('Error al guardar datos');
    } finally {
      setLoading(false);
    }
  };

  const fileInputRefs = {
    photo: React.useRef(null),
    dni_copy: React.useRef(null),
    school_cert: React.useRef(null),
    auth_parents: React.useRef(null)
  };

  const handleFileClick = (name) => {
    if (fileInputRefs[name].current) {
      fileInputRefs[name].current.click();
    }
  };

  const renderFileInput = (label, name) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.fileUploadBtn} 
        onPress={() => handleFileClick(name)}
        activeOpacity={0.7}
      >
        <Text style={styles.fileUploadText}>
          {files[name] ? `📄 ${files[name].name}` : '📂 Seleccionar Archivo'}
        </Text>
      </TouchableOpacity>
      <input 
        type="file" 
        ref={fileInputRefs[name]}
        onChange={e => handleFileChange(name, e)} 
        style={{ display: 'none' }} 
        accept="image/*,.pdf"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>
      <View style={[styles.formWrapper, !isMobile && styles.formWrapperDesktop]}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>Agregar Menor / Familiar</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.firstName} 
            onChangeText={t => handleInputChange('firstName', t)}
            placeholder="Nombre"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.lastName} 
            onChangeText={t => handleInputChange('lastName', t)}
            placeholder="Apellido"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DNI *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.dni} 
            onChangeText={t => handleInputChange('dni', t)} 
            keyboardType="numeric"
            placeholder="Número de documento"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha de Nacimiento (YYYY-MM-DD) *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.birthDate} 
            onChangeText={t => handleInputChange('birthDate', t)} 
            placeholder="2015-05-20"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Relación</Text>
          <View style={[styles.pickerContainer, isMobile && styles.pickerContainerMobile]}>
               <TouchableOpacity 
                 style={[styles.option, formData.relation === 'child' && styles.optionSelected, isMobile && styles.optionMobile]} 
                 onPress={() => handleInputChange('relation', 'child')}
                 activeOpacity={0.7}
               >
                  <Text style={[styles.optionText, formData.relation === 'child' && styles.optionTextSelected]}>Hijo/a</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.option, formData.relation === 'spouse' && styles.optionSelected, isMobile && styles.optionMobile]} 
                 onPress={() => handleInputChange('relation', 'spouse')}
                 activeOpacity={0.7}
               >
                  <Text style={[styles.optionText, formData.relation === 'spouse' && styles.optionTextSelected]}>Cónyuge</Text>
               </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Información Médica Relevante</Text>
          <TextInput 
            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
            multiline 
            value={formData.medicalInfo} 
            onChangeText={t => handleInputChange('medicalInfo', t)}
            placeholder="Alergias, condiciones, etc."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Text style={styles.sectionTitle}>Documentación</Text>
        
        {renderFileInput('Foto Carnet', 'photo')}
        {renderFileInput('Fotocopia DNI', 'dni_copy')}
        {renderFileInput('Certificado Escolar', 'school_cert')}
        {renderFileInput('Autorización Padres', 'auth_parents')}

        <TouchableOpacity 
          style={[styles.submitBtn, isMobile && styles.submitBtnMobile]} 
          onPress={handleSubmit} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>GUARDAR</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 100, // Header spacer
    alignItems: 'center',
  },
  contentContainerMobile: {
    padding: 16,
    paddingTop: 80,
  },
  formWrapper: {
    width: '100%',
  },
  formWrapperDesktop: {
    maxWidth: 600,
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  titleMobile: {
    fontSize: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48, // Touch target size
    color: '#1f2937',
  },
  submitBtn: {
    backgroundColor: '#049756',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 40,
    minHeight: 48,
    boxShadow: '0px 2px 4px rgba(4,151,86,0.2)',
    elevation: 2,
  },
  submitBtnMobile: {
    marginTop: 24,
    marginBottom: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  fileUploadBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fileUploadText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerContainerMobile: {
    flexDirection: 'column', // Stack on mobile
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  optionMobile: {
    width: '100%',
  },
  optionSelected: {
    backgroundColor: '#049756',
    borderColor: '#049756',
  },
  optionText: {
    color: '#4b5563',
    fontWeight: '500',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FamilyManager;
