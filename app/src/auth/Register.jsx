import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Image, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateLuhn, validateExpiryDate, validateCVV, validateCardName, formatExpiryDate, formatCardNumber, getCardType, isValidEmail } from '../utils/validation';
import { compressImage } from '../utils/imageUtils';
import { argentinaData } from '../utils/argentinaData';
import { validatePersonAPI, validateAddressAPI } from '../utils/apiValidation';
import CameraCapture from '../CameraCapture';
import AutocompleteSelect from '../components/AutocompleteSelect';

const STEPS = [
  { id: 1, title: 'Datos Personales' },
  { id: 2, title: 'Domicilio' },
  { id: 3, title: 'Documentación' },
  { id: 4, title: 'Pago' }
];

const Register = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const responsiveRow = [styles.row, isMobile && { flexDirection: 'column' }];
  const responsiveCol = [styles.col, isMobile && { width: '100%' }];
  const responsiveColFlex2 = [styles.colFlex2, isMobile && { width: '100%' }];
  const responsiveUploadGrid = [styles.uploadGrid, isMobile && { flexDirection: 'column' }];
  const responsivePaymentMethods = [styles.paymentMethods, isMobile && { flexDirection: 'column' }];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showCamera, setShowCamera] = useState(false); // New state for camera modal

  // Form State
  const [formData, setFormData] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('registerFormData');
    return saved ? JSON.parse(saved) : {
      // Step 1
      firstName: '',
      lastName: '',
      dni: '',
      birthDate: '',
      email: '',
      phone: '',
      password: '',
      // Step 2
      country: 'Argentina',
      province: '',
      city: '',
      zipCode: '',
      address: '',
      // Step 3
      frontDni: null,
      backDni: null,
      photo: null,
      // Step 4
      paymentMethod: 'visa', // New field
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      installments: 1
    };
  });

  const [registeredUser, setRegisteredUser] = useState(null);

  const [previews, setPreviews] = useState({
    frontDni: null,
    backDni: null,
    photo: null
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  // Debounced Validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && isValidEmail(formData.email)) {
        checkDuplicate(formData.email, ''); 
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.dni && formData.dni.length >= 7) {
        checkDuplicate('', formData.dni);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.dni]);

  const citiesData = React.useMemo(() => {
    return argentinaData.flatMap(prov => 
      prov.cities.map(city => ({
        label: city,
        value: city,
        group: prov.name,
        provinceId: prov.id
      }))
    );
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // --- Step 1 Validation ---
  const validateStep1 = async () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = 'Requerido';
    if (!formData.lastName) errors.lastName = 'Requerido';
    if (!formData.dni) errors.dni = 'Requerido';
    
    if (!formData.birthDate) {
      errors.birthDate = 'Requerido';
    } else if (formData.birthDate.length !== 10) {
      errors.birthDate = 'Formato inválido (DD/MM/AAAA)';
    } else {
      const [day, month, year] = formData.birthDate.split('/').map(Number);
      const birth = new Date(year, month - 1, day);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) errors.birthDate = 'Debes ser mayor de 18 años';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }

    // API Check for Duplicates
    if (formData.email && formData.dni) {
      const isDuplicate = await checkDuplicate(formData.email, formData.dni);
      if (isDuplicate) return false;
    }

    setGlobalError('');
    return true;
  };

  const checkDuplicate = async (email, dni) => {
    setIsChecking(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (dni) params.append('dni', dni);
      
      const res = await fetch(`${API_URL}/auth/check-duplicate?${params.toString()}`);
      const check = await res.json();
      
      setIsChecking(false);
      
      if (check.exists) {
        // Set specific field error if available
        if (check.field) {
            setValidationErrors(prev => ({ ...prev, [check.field]: check.message }));
        } else {
            setGlobalError(check.message);
        }
        return true;
      }
    } catch (e) {
      console.error('Validation error:', e);
      // Fallback to mock if API fails
      if (dni) {
          const apiCheck = await validatePersonAPI(dni);
          if (!apiCheck.valid) {
            setValidationErrors(prev => ({ ...prev, dni: apiCheck.message }));
            setIsChecking(false);
            return true;
          }
      }
    }
    setIsChecking(false);
    return false;
  };

  // Helper for numeric inputs
  const handleNumericChange = (field, text, maxLength) => {
    const cleaned = text.replace(/\D/g, '');
    if (maxLength && cleaned.length > maxLength) return;
    updateField(field, cleaned);
  };

  // Helper for date formatting
  const handleDateChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${formatted.slice(0,5)}/${cleaned.slice(4,8)}`;
    updateField('birthDate', formatted.slice(0, 10));
  };

  // --- Step 2 Validation ---
  const validateStep2 = async () => {
    const errors = {};
    if (!formData.city) errors.city = 'Seleccione localidad';
    if (!formData.zipCode) errors.zipCode = 'Requerido';
    if (!formData.address) errors.address = 'Requerido';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }
    return true;
  };

  // --- Step 3 Validation ---
  const validateStep3 = () => {
    const errors = {};
    if (!formData.frontDni) errors.frontDni = 'Suba el frente del DNI';
    if (!formData.backDni) errors.backDni = 'Suba el dorso del DNI';
    if (!formData.photo) errors.photo = 'Suba su foto carnet';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }
    return true;
  };

  // --- Step 4 Validation ---
  const validateStep4 = () => {
    return true; // No validation needed as payment is external
  };

  // Real-time validation for button state
  const [isStepValid, setIsStepValid] = useState(false);

  useEffect(() => {
    const checkValidity = () => {
      if (currentStep === 1) {
        return !!(formData.firstName && formData.lastName && formData.dni && formData.dni.length >= 7 && formData.birthDate && formData.birthDate.length === 10 && formData.email && formData.password && formData.phone);
      }
      if (currentStep === 2) {
        return !!(formData.province && formData.city && formData.zipCode && formData.address);
      }
      if (currentStep === 3) {
        return !!(formData.frontDni && formData.backDni && formData.photo);
      }
      if (currentStep === 4) {
        return true;
      }
      return false;
    };
    setIsStepValid(checkValidity());
  }, [formData, currentStep]);

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await validateStep1();
    if (currentStep === 2) isValid = await validateStep2();
    if (currentStep === 3) isValid = validateStep3();
    
    if (isValid) {
      if (currentStep === 3 && !registeredUser) {
        setLoading(true);
        setGlobalError('');
        try {
          const regData = await registerUser();
          setRegisteredUser(regData.user);
          // Opcionalmente guardar el token en localStorage para que cuando redirija al pago o dashboard ya esté logueado
          if (regData.token) {
            localStorage.setItem('token', regData.token);
            localStorage.setItem('user', JSON.stringify(regData.user));
          }
        } catch (err) {
          console.error(err);
          setGlobalError(err.message || 'Error en el proceso de registro');
          setLoading(false);
          return; // Detener avance si falla el registro
        }
        setLoading(false);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const [activeCameraField, setActiveCameraField] = useState(null);

  const handleCameraCapture = async (file) => {
    try {
      const field = activeCameraField || 'photo';
      await handleImageUpload(field, file);
      setActiveCameraField(null);
      setShowCamera(false);
    } catch (e) {
      console.error(e);
    }
  };

  const encryptData = (data) => {
    // Mock encryption logic
    return btoa(JSON.stringify(data)); 
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;

    setLoading(true);
    try {
      // Encrypt sensitive data (mock)
      const encryptedCard = encryptData({
        number: formData.cardNumber,
        cvv: formData.cvv,
        expiry: formData.expiryDate
      });

      const data = new FormData();
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (['frontDni', 'backDni', 'photo'].includes(key)) {
          if (formData[key]) data.append(key, formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      });

      // Add extra fields
      data.append('encryptedData', encryptedCard);
      data.append('role', 'member');
      // Override sensitive data
      data.set('cardNumber', '****');
      data.set('cvv', '***');

      await register(data);
      
      // Clear storage on success
      localStorage.removeItem('registerFormData');
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (field, file) => {
    try {
      setLoading(true);
      const { file: compressedFile, preview } = await compressImage(file);
      setFormData(prev => ({ ...prev, [field]: compressedFile }));
      setPreviews(prev => ({ ...prev, [field]: preview }));
    } catch (e) {
      console.error(e);
      setGlobalError('Error al procesar imagen');
    } finally {
      setLoading(false);
    }
  };



  // Renderers
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={responsiveRow}>
        <View style={responsiveCol}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={formData.firstName} onChangeText={t => updateField('firstName', t)} placeholder="Juan" />
          {validationErrors.firstName && <Text style={styles.errorText}>{validationErrors.firstName}</Text>}
        </View>
        <View style={responsiveCol}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={formData.lastName} onChangeText={t => updateField('lastName', t)} placeholder="Pérez" />
          {validationErrors.lastName && <Text style={styles.errorText}>{validationErrors.lastName}</Text>}
        </View>
      </View>

      <View style={responsiveRow}>
        <View style={responsiveCol}>
          <Text style={styles.label}>DNI</Text>
          <TextInput 
            style={styles.input} 
            value={formData.dni} 
            onChangeText={t => handleNumericChange('dni', t, 8)} 
            keyboardType="numeric" 
            placeholder="12345678" 
            maxLength={8}
            onBlur={() => {
              if (formData.dni.length >= 7) checkDuplicate(formData.email, formData.dni);
            }}
          />
          {validationErrors.dni && <Text style={styles.errorText}>{validationErrors.dni}</Text>}
        </View>
        <View style={responsiveCol}>
          <Text style={styles.label}>F. Nacimiento</Text>
          <TextInput 
             style={styles.input} 
             value={formData.birthDate} 
             onChangeText={handleDateChange} 
             placeholder="DD/MM/AAAA" 
             keyboardType="numeric"
             maxLength={10}
          />
          {validationErrors.birthDate && <Text style={styles.errorText}>{validationErrors.birthDate}</Text>}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput 
          style={styles.input} 
          value={formData.phone} 
          onChangeText={t => handleNumericChange('phone', t, 15)} 
          keyboardType="phone-pad" 
          placeholder="11 1234 5678" 
        />
        {validationErrors.phone && <Text style={styles.errorText}>{validationErrors.phone}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input} 
          value={formData.email} 
          onChangeText={t => updateField('email', t)} 
          keyboardType="email-address" 
          autoCapitalize="none" 
          placeholder="tu@email.com" 
          onBlur={() => {
            if (formData.email && formData.email.includes('@')) checkDuplicate(formData.email, formData.dni);
          }}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} value={formData.password} onChangeText={t => updateField('password', t)} secureTextEntry placeholder="••••••" />
      </View>
    </View>
  );

  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>País</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={{ color: '#64748b' }}>Argentina</Text>
          </View>
        </View>

        <View style={[responsiveRow, { zIndex: 20, position: 'relative' }]}>
          <View style={responsiveColFlex2}>
            <AutocompleteSelect 
                label="Localidad (CABA / GBA)"
                placeholder="Escribí tu localidad..."
                data={citiesData}
                value={formData.city}
                onChange={(item) => {
                    if (item) {
                        updateField('city', item.value);
                        updateField('province', item.provinceId);
                    } else {
                        updateField('city', '');
                        updateField('province', '');
                    }
                }}
                error={validationErrors.city}
            />
          </View>
        </View>

        <View style={responsiveRow}>
          <View style={responsiveCol}>
            <Text style={styles.label}>Código Postal</Text>
            <TextInput 
              style={styles.input} 
              value={formData.zipCode} 
              onChangeText={t => handleNumericChange('zipCode', t, 4)} 
              placeholder="1234" 
              keyboardType="numeric"
              maxLength={4}
              onBlur={() => validateAddressAPI(formData.zipCode)}
            />
            {validationErrors.zipCode && <Text style={styles.errorText}>{validationErrors.zipCode}</Text>}
          </View>
          <View style={responsiveColFlex2}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput style={styles.input} value={formData.address} onChangeText={t => updateField('address', t)} placeholder="Calle 123" />
            {validationErrors.address && <Text style={styles.errorText}>{validationErrors.address}</Text>}
          </View>
        </View>
      </View>
    );
  };

  const fileInputRef = useRef({});

  const FileUploadBtn = ({ label, field, preview, isCamera = false, allowBoth = false }) => {
    const handleUploadClick = () => fileInputRef.current[field]?.click();
    const handleCameraClick = () => {
      setActiveCameraField(field);
      setShowCamera(true);
    };

    return (
    <View style={[styles.uploadBtn, { padding: 10, justifyContent: 'center' }]}>
      {preview ? (
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: preview }} style={styles.previewImg} />
            <View style={{ position: 'absolute', flexDirection: 'row', gap: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 20 }}>
                <TouchableOpacity onPress={handleUploadClick} style={{ padding: 8, backgroundColor: 'white', borderRadius: 20 }}>
                    <Text>📁</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCameraClick} style={{ padding: 8, backgroundColor: 'white', borderRadius: 20 }}>
                    <Text>📸</Text>
                </TouchableOpacity>
            </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.uploadText}>{label}</Text>
          {allowBoth ? (
              <View style={{ flexDirection: 'row', gap: 15, marginTop: 15 }}>
                <TouchableOpacity onPress={handleUploadClick} style={{ alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                    <Text style={{ fontSize: 24 }}>📁</Text>
                    <Text style={{ fontSize: 10 }}>Subir</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCameraClick} style={{ alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                    <Text style={{ fontSize: 24 }}>📸</Text>
                    <Text style={{ fontSize: 10 }}>Foto</Text>
                </TouchableOpacity>
              </View>
          ) : (
            <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 10 }}
                onPress={() => isCamera ? handleCameraClick() : handleUploadClick()}
            >
                <Text style={styles.uploadIcon}>{isCamera ? '📸' : '📁'}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                    {isCamera ? 'Tomar Foto' : 'Seleccionar Archivo'}
                </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <input
        type="file"
        ref={el => fileInputRef.current[field] = el}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files[0]) handleImageUpload(field, e.target.files[0]);
        }}
      />
      {validationErrors[field] && <Text style={styles.errorTextCenter}>{validationErrors[field]}</Text>}
    </View>
  )};

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.helperText}>Subí fotos claras. Podés subir archivo o tomar foto.</Text>
      <View style={responsiveUploadGrid}>
        <FileUploadBtn label="Frente DNI" field="frontDni" preview={previews.frontDni} allowBoth={true} />
        <FileUploadBtn label="Dorso DNI" field="backDni" preview={previews.backDni} allowBoth={true} />
        <FileUploadBtn label="Foto Carnet" field="photo" preview={previews.photo} isCamera={true} allowBoth={true} />
      </View>
      
      {showCamera && (
        <CameraCapture 
          onCancel={() => setShowCamera(false)} 
          onCapture={handleCameraCapture}
          facingMode={activeCameraField === 'photo' ? 'user' : 'environment'}
        />
      )}
    </View>
  );

  const registerUser = async () => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (['frontDni', 'backDni', 'photo'].includes(key)) {
        if (formData[key]) data.append(key, formData[key]);
      } else {
        data.append(key, formData[key]);
      }
    });
    data.append('role', 'member');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      body: data
    });
    
    const regData = await regRes.json();

    if (!regRes.ok) {
      throw new Error(regData.error || 'Error al registrar usuario');
    }
    
    return regData;
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setGlobalError('');
    try {
      const userId = registeredUser?.id;
      const userEmail = registeredUser?.email || formData.email;

      if (!userId) {
        throw new Error('Usuario no registrado. Por favor, vuelva al paso anterior e intente de nuevo.');
      }

      // 2. Crear preferencia de pago MP (Checkout Redirect)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
      const prefRes = await fetch(`${API_URL}/payments/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Suscripción Mensual - Club Italia 90',
          quantity: 1,
          price: 12000,
          email: userEmail,
          userId: userId
        })
      });

      if (!prefRes.ok) {
        const err = await prefRes.json();
        const detailMsg = err.details ? (typeof err.details === 'object' ? JSON.stringify(err.details) : err.details) : '';
        throw new Error(`${err.error || 'Error al crear preferencia de pago'} ${detailMsg}`);
      }

      const { init_point } = await prefRes.json();
      
      // 3. Limpiar storage y redirigir a Mercado Pago
      localStorage.removeItem('registerFormData');
      window.location.href = init_point;

    } catch (err) {
      console.error(err);
      setGlobalError(err.message || 'Error en el proceso de pago');
      setLoading(false);
    }
  };

  const handleCardSubscription = async () => {
    setLoading(true);
    setGlobalError('');
    try {
      const userId = registeredUser?.id;
      const userEmail = registeredUser?.email || formData.email;

      if (!userId) {
        throw new Error('Usuario no registrado. Por favor, vuelva al paso anterior e intente de nuevo.');
      }

      // 2. Redirigir a formulario de tarjeta
      localStorage.removeItem('registerFormData');
      navigate('/pagos', { 
        state: { 
          concept: 'Suscripción Mensual - Club Italia 90', 
          amount: 12000, 
          enrollment_id: userId,
          email: userEmail
        } 
      });

    } catch (err) {
      console.error(err);
      setGlobalError(err.message || 'Error en el proceso de registro');
      setLoading(false);
    }
  };

  const renderStep4 = () => {
    const amount = 12000;

    return (
      <View style={styles.stepContainer}>
        <ScrollView style={{ maxHeight: '60vh' }} showsVerticalScrollIndicator={true}>
        <View style={styles.calculator}>
          <Text style={styles.calcTitle}>Suscripción Mensual</Text>
          <Text style={styles.calcAmount}>${amount.toLocaleString()}</Text>
          <Text style={styles.helperText}>Acceso total a instalaciones y actividades</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seleccioná tu método de pago seguro</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 15 }}>
            Serás redirigido a la plataforma segura de Mercado Pago para completar la suscripción.
            Podrás usar dinero en cuenta, tarjetas de crédito o débito.
          </Text>
          
          <View style={{ gap: 15 }}>
             <TouchableOpacity 
               style={[styles.methodBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderColor: '#009ee3', backgroundColor: '#f0f9ff' }]}
               onPress={handleSubscribe}
             >
               <Text style={{ fontSize: 24 }}>Ⓜ️</Text>
               <View>
                 <Text style={{ fontWeight: 'bold', color: '#009ee3' }}>Mercado Pago</Text>
                 <Text style={{ fontSize: 10, color: '#666' }}>Dinero en cuenta / Tarjetas guardadas</Text>
               </View>
             </TouchableOpacity>

             <TouchableOpacity 
               style={[styles.methodBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15 }]}
               onPress={handleCardSubscription}
             >
               <Text style={{ fontSize: 24 }}>💳</Text>
               <View>
                 <Text style={{ fontWeight: 'bold', color: '#333' }}>Tarjeta de Crédito / Débito</Text>
                 <Text style={{ fontSize: 10, color: '#666' }}>Visa, Mastercard, Amex, Cabal</Text>
               </View>
             </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 5 }}>🔒 Pago Seguro</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>
                Tus datos están protegidos. Cumplimos con los estándares de seguridad PCI DSS. 
                La suscripción se debita automáticamente cada mes. Podés cancelar en cualquier momento.
            </Text>
        </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ImageBackground source={{ uri: '/assets/fondo-celebracion.jpg' }} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={{ uri: '/logo-italia90.png' }} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Alta de Socio</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <View style={[styles.stepDot, currentStep >= s.id && styles.stepDotActive]}>
                  <Text style={[styles.stepNum, currentStep >= s.id && styles.stepNumActive]}>{s.id}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={[styles.stepLine, currentStep > s.id && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>

          {/* Error Global */}
          {globalError ? <Text style={styles.globalError}>{globalError}</Text> : null}

          {/* Form Content */}
          <View style={styles.content}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {currentStep > 1 ? (
              <TouchableOpacity onPress={handlePrev} style={styles.btnSecondary}>
                <Text style={styles.btnTextSecondary}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigate('/login')} style={styles.btnGhost}>
                 <Text style={styles.btnTextGhost}>Cancelar</Text>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.btnPrimary, (!isStepValid || loading) && { opacity: 0.5 }]} 
                disabled={!isStepValid || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextPrimary}>Continuar</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 5, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    paddingTop: 100, // Header spacer
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    padding: 20,
    maxHeight: '95vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  logo: { width: 30, height: 30 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#070571' },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center', zIndex: 2
  },
  stepDotActive: { backgroundColor: '#070571' },
  stepNum: { fontSize: 12, color: '#6b7280' },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: -5, zIndex: 1 },
  stepLineActive: { backgroundColor: '#070571' },
  stepTitle: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 15 },
  
  content: { flex: 1, zIndex: 10 }, // Scrollable if needed, but trying to fit
  stepContainer: { gap: 10 },
  
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  colFlex2: { flex: 2 },
  
  label: { fontSize: 12, fontWeight: '600', color: '#4b5563', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6,
    paddingHorizontal: 10, minHeight: 48, fontSize: 16, backgroundColor: '#f9fafb'
  },
  inputGroup: { marginBottom: 15 },
  
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  errorTextCenter: { color: '#dc2626', fontSize: 12, marginTop: 4, textAlign: 'center' },
  globalError: { color: '#dc2626', textAlign: 'center', marginBottom: 10, backgroundColor: '#fee2e2', padding: 8, borderRadius: 4 },
  
  // Custom Select
  selectContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  disabledSelect: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  htmlSelect: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: 'transparent',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#334155',
    appearance: 'none', // Hide default arrow
    zIndex: 2,
    cursor: 'pointer',
  },
  selectArrow: {
    position: 'absolute',
    right: 12,
    top: 14,
    color: '#64748b',
    fontSize: 12,
    pointerEvents: 'none',
    zIndex: 1,
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
  },
  uploadGrid: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  uploadBtn: { 
    flex: 1, minHeight: 140, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', 
    borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb'
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadIcon: { fontSize: 24, marginBottom: 5 },
  uploadText: { fontSize: 10, color: '#6b7280', textAlign: 'center' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  helperText: { textAlign: 'center', fontSize: 12, color: '#6b7280', marginBottom: 10 },
  
  calculator: {
    backgroundColor: '#f3f4f6', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#e5e7eb'
  },
  calcTitle: { fontSize: 14, color: '#4b5563', marginBottom: 5 },
  calcAmount: { fontSize: 24, fontWeight: 'bold', color: '#070571' },
  calcDiscount: { fontSize: 12, color: '#049756', fontWeight: 'bold', marginTop: 5 },

  paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  methodBtn: { 
    flex: 1, padding: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, 
    alignItems: 'center', backgroundColor: '#fff', minHeight: 48, justifyContent: 'center'
  },
  methodBtnActive: { borderColor: '#070571', backgroundColor: '#e0e7ff' },
  methodText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  methodTextActive: { color: '#070571' },

  btnPrimary: { flex: 1, backgroundColor: '#070571', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Legacy select support for Step 2
  select: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, minHeight: 48, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#e5e7eb' },
  selectText: { color: '#6b7280', fontSize: 14 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20, zIndex: 1 },
  btnSuccess: { flex: 1, backgroundColor: '#059669', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnSecondary: { backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnGhost: { padding: 12, minWidth: 80, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  
  btnTextSecondary: { color: '#374151', fontSize: 14, fontWeight: '600' },
  btnTextGhost: { color: '#6b7280', fontSize: 14 },
});

export default Register;
