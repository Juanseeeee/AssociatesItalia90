import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Image, Platform, Dimensions } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Complete todos los campos');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const returnTo = location.state?.returnTo || '/dashboard';
      navigate(returnTo);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: '/assets/fondo-celebracion.jpg' }}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <Image 
                source={{ uri: '/logo-italia90.png' }} 
                style={styles.logo} 
              />
              <Text style={styles.brandTitle}>ITALIA 90</Text>
            </View>

            <Text style={styles.formTitle}>Bienvenido</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={handleLogin}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter') handleLogin();
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                onSubmitEditing={handleLogin}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter') handleLogin();
                }}
              />
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>INGRESAR</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No eres socio? </Text>
              <TouchableOpacity onPress={() => navigate('/register')}>
                <Text style={styles.link}>Asociate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 5, 113, 0.85)', // Brand Blue with opacity
    width: '100%',
    minHeight: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 100, // Header spacer
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24, // Reduced padding
    width: '100%',
    maxWidth: 360, // Compact width
    alignItems: 'center',
    boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#070571', // Brand Blue
    fontFamily: 'System', // Fallback
  },
  formTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 12,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16, // Better for mobile readability
    color: '#1f2937',
    minHeight: 48, // Touch target size
  },
  button: {
    backgroundColor: '#070571', // Brand Blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48, // Touch target size
    justifyContent: 'center',
    boxShadow: '0px 4px 5px rgba(7, 5, 113, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#4b5563',
    fontSize: 12,
  },
  link: {
    color: '#049756', // Brand Green
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default Login;
