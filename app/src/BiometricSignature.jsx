import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';

const BiometricSignature = ({ visible, onClose, onSigned }) => {
  const [step, setStep] = useState('prompt'); // prompt, scanning, success

  const handleSimulateSideButton = () => {
    setStep('scanning');
    // Simulate FaceID scan
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSigned();
        onClose();
        setStep('prompt'); // Reset for next time
      }, 1500);
    }, 2000);
  };

  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 'prompt' && (
            <>
              <Text style={styles.title}>Confirmar con Face ID</Text>
              <Text style={styles.subtitle}>Doble clic para firmar digitalmente</Text>
              <View style={styles.iconContainer}>
                 <View style={styles.faceIdIcon} />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSimulateSideButton}>
                <Text style={styles.buttonText}>Simular Doble Clic Lateral</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'scanning' && (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.statusText}>Escaneando rostro...</Text>
            </>
          )}

          {step === 'success' && (
            <>
              <View style={styles.successIcon}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.statusText}>Firma Verificada</Text>
            </>
          )}
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Bottom sheet style
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 30,
    alignItems: 'center',
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  faceIdIcon: {
    width: 60,
    height: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
  },
  closeText: {
    color: '#999',
  },
});

export default BiometricSignature;
