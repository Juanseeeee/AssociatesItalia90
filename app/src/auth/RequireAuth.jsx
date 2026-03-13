import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { View, ActivityIndicator } from 'react-native';

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <ActivityIndicator size="large" color="#049756" />
      </View>
    );
  }

  return user ? children : null;
};

export default RequireAuth;
