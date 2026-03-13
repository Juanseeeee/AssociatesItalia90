import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Image, Platform, Dimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Complete todos los campos');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
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
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <Image 
                source={{ uri: '/logo-italia90.png' }} 
                style={styles.logo} 
                resizeMode="contain" 
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
    height: '100vh',
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 5, 113, 0.85)', // Brand Blue with opacity
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 100, // Header spacer
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24, // Reduced padding
    width: '100%',
    maxWidth: 360, // Compact width
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
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
    fontSize: 14,
    color: '#1f2937',
    width: '100%',
    height: 40, // Fixed height for compactness
  },
  button: {
    backgroundColor: '#f42b29', // Brand Red
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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
