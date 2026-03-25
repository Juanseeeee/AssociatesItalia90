import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateLuhn, validateExpiryDate, validateCVV, validateCardName, formatExpiryDate, formatCardNumber, getCardType } from './utils/validation';

import { API_URL } from './config/api';
import { toast } from 'sonner';

export default function PaymentForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { concept, amount, enrollment_id, email: stateEmail, memberName, memberDni } = location.state || { concept: 'Pago General', amount: 0 };
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: memberName || '',
    expiryDate: '',
    cvv: '',
    email: stateEmail || '',
    docType: 'DNI',
    docNumber: memberDni || ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('initial'); // initial, processing, success, error
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, mercadopago

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === 'cardNumber') formattedValue = formatCardNumber(value);
    if (field === 'expiryDate') formattedValue = formatExpiryDate(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    // Clear error when user types
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
    if (!formData.docNumber) newErrors.docNumber = 'Documento requerido';
    
    if (paymentMethod === 'card') {
      if (!validateLuhn(formData.cardNumber)) newErrors.cardNumber = 'Número de tarjeta inválido';
      if (!validateCardName(formData.cardName)) newErrors.cardName = 'Nombre inválido';
      if (!validateExpiryDate(formData.expiryDate)) newErrors.expiryDate = 'Fecha inválida (MM/YY)';
      if (!validateCVV(formData.cvv, getCardType(formData.cardNumber))) newErrors.cvv = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMercadoPago = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setStatus('processing');
    try {
      const response = await fetch(`${API_URL}/payments/create-preference`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: concept,
          quantity: 1,
          price: amount,
          email: formData.email,
          enrollment_id,
          docNumber: formData.docNumber,
          name: formData.cardName
        })
      });

      if (!response.ok) throw new Error('Error al iniciar el pago');

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
      setErrors({ submit: 'Error al conectar con Mercado Pago. Intente nuevamente.' });
      toast.error('Error al conectar con Mercado Pago');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (paymentMethod === 'mercadopago') {
      handleMercadoPago();
      return;
    }

    if (!validate()) return;
    
    setLoading(true);
    setStatus('processing');
    
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          amount,
          card: formData.cardNumber,
          email: formData.email,
          docNumber: formData.docNumber,
          name: formData.cardName,
          enrollment_id
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'aprobado') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrors({ submit: data.error || 'El pago fue rechazado. Verifique los datos.' });
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrors({ submit: 'Error de conexión. Intente nuevamente.' });
      toast.error('Error procesando el pago');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.successIcon}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
          <Text style={styles.successText}>Tu pago de ${amount} por "{concept}" se procesó correctamente.</Text>
          <Text style={styles.emailText}>Enviamos el comprobante a {formData.email}</Text>
          
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigate('/dashboard?payment_status=approved')}>
            <Text style={styles.btnText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Checkout</Text>
          
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Concepto</Text>
            <Text style={styles.summaryValue}>{concept}</Text>
            <View style={styles.divider} />
            
            {memberName && (
              <>
                <Text style={styles.summaryLabel}>Inscrito</Text>
                <Text style={styles.summaryValue}>{memberName} (DNI: {memberDni})</Text>
                <View style={styles.divider} />
              </>
            )}

            <Text style={styles.summaryLabel}>Total a Pagar</Text>
            <Text style={styles.summaryAmount}>${amount}</Text>
          </View>

          {status === 'error' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{errors.submit}</Text>
            </View>
          )}

          <Text style={[styles.label, {marginTop: 10, marginBottom: 10}]}>Método de Pago</Text>
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
            <TouchableOpacity 
              style={[styles.paymentMethodBtn, paymentMethod === 'card' && styles.paymentMethodBtnActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'card' && styles.paymentMethodTextActive]}>💳 Tarjeta</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paymentMethodBtn, paymentMethod === 'mercadopago' && styles.paymentMethodBtnActive]}
              onPress={() => setPaymentMethod('mercadopago')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'mercadopago' && styles.paymentMethodTextActive]}>Mercado Pago</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email para el comprobante</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="ejemplo@email.com"
              keyboardType="email-address"
              onSubmitEditing={handleSubmit}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Enter') handleSubmit();
              }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Titular / Pagador</Text>
            <TextInput
              style={[styles.input, errors.cardName && styles.inputError]}
              value={formData.cardName}
              onChangeText={(text) => handleChange('cardName', text)}
              placeholder="Nombre del pagador"
              onSubmitEditing={handleSubmit}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Enter') handleSubmit();
              }}
            />
            {errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Número de Documento del Pagador</Text>
            <TextInput
              style={[styles.input, errors.docNumber && styles.inputError]}
              value={formData.docNumber}
              onChangeText={(text) => handleChange('docNumber', text)}
              placeholder="DNI"
              keyboardType="numeric"
              onSubmitEditing={handleSubmit}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Enter') handleSubmit();
              }}
            />
            {errors.docNumber && <Text style={styles.errorText}>{errors.docNumber}</Text>}
          </View>

          {paymentMethod === 'card' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Tarjeta</Text>
                <View style={styles.cardInputContainer}>
                  <TextInput
                    style={[styles.input, styles.cardInput, errors.cardNumber && styles.inputError]}
                    value={formData.cardNumber}
                    onChangeText={(text) => handleChange('cardNumber', text)}
                    placeholder="0000 0000 0000 0000"
                    keyboardType="numeric"
                    maxLength={19}
                    onSubmitEditing={handleSubmit}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Enter') handleSubmit();
                    }}
                  />
                  <Text style={styles.cardBrand}>{getCardType(formData.cardNumber)}</Text>
                </View>
                {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Vencimiento</Text>
                  <TextInput
                    style={[styles.input, errors.expiryDate && styles.inputError]}
                    value={formData.expiryDate}
                    onChangeText={(text) => handleChange('expiryDate', text)}
                    placeholder="MM/YY"
                    maxLength={5}
                    keyboardType="numeric"
                    onSubmitEditing={handleSubmit}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Enter') handleSubmit();
                    }}
                  />
                  {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
                </View>
                
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={[styles.input, errors.cvv && styles.inputError]}
                    value={formData.cvv}
                    onChangeText={(text) => handleChange('cvv', text)}
                    placeholder="123"
                    maxLength={getCardType(formData.cardNumber) === 'AMEX' ? 4 : 3}
                    keyboardType="numeric"
                    secureTextEntry
                    onSubmitEditing={handleSubmit}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Enter') handleSubmit();
                    }}
                  />
                  {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.btnPrimary, loading && styles.btnDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Pagar ${amount}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.btnLink} onPress={() => navigate(-1)}>
            <Text style={styles.linkText}>Cancelar</Text>
          </TouchableOpacity>

          <View style={styles.secureBadge}>
            <Text style={styles.secureText}>🔒 Pago seguro procesado con encriptación SSL</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100vh',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 480,
    elevation: 5,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#070571',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Garet',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#049756',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#495057',
    backgroundColor: '#fff',
    outlineStyle: 'none',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: '#070571',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    boxShadow: '0px 4px 8px rgba(7, 5, 113, 0.2)',
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#6c757d',
    boxShadow: 'none',
    elevation: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#6c757d',
    fontSize: 14,
  },
  cardInputContainer: {
    position: 'relative',
  },
  cardInput: {
    paddingRight: 60,
  },
  cardBrand: {
    position: 'absolute',
    right: 15,
    top: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#070571',
  },
  secureBadge: {
    marginTop: 25,
    alignItems: 'center',
  },
  secureText: {
    fontSize: 12,
    color: '#adb5bd',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorBoxText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  checkMark: {
    fontSize: 40,
    color: '#155724',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#155724',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  paymentMethodBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  paymentMethodBtnActive: {
    borderColor: '#070571',
    backgroundColor: '#eef2ff'
  },
  paymentMethodText: {
    fontWeight: '600',
    color: '#6b7280'
  },
  paymentMethodTextActive: {
    color: '#070571'
  }
});
