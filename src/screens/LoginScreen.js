/**
 * Login Screen
 * Allows users to sign in with email and password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation, onSkip }) => {
  const { colors } = useTheme();
  const { login, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    setLocalError('');
    clearError();
    
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }
    
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation will happen automatically via auth state change
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#3355FF',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: '#ffffff',
    },
    inputIcon: {
      paddingRight: 16,
    },
    errorText: {
      color: '#FF6B6B',
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    loginButton: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: '#3355FF',
      fontSize: 18,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 15,
    },
    footerLink: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    skipButton: {
      alignItems: 'center',
      marginTop: 32,
      paddingVertical: 12,
    },
    skipText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 15,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/roland.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to locate accessibility features near you.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.inputIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {(localError || error) && (
              <Text style={styles.errorText}>{localError || error}</Text>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                if (onSkip) onSkip();
                navigation.navigate('Map');
              }}
            >
              <Text style={styles.skipText}>Continue without signing in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
