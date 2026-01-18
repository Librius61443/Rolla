/**
 * Register Screen
 * Allows new users to create an account
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { register, loading, error, clearError } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    clearError();
    
    // Validation
    if (!username.trim()) {
      setLocalError('Please enter a username');
      return;
    }
    
    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }
    
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email');
      return;
    }
    
    if (!password) {
      setLocalError('Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
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
    backButton: {
      position: 'absolute',
      top: 16,
      left: 16,
      padding: 8,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
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
      textAlign: 'center',
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
    registerButton: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    registerButtonDisabled: {
      opacity: 0.6,
    },
    registerButtonText: {
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join our community and help map accessibility
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

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
                  placeholder="Create a password"
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {(localError || error) && (
              <Text style={styles.errorText}>{localError || error}</Text>
            )}

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
