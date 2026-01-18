/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as auth from '../services/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for stored auth on mount
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      setLoading(true);
      const storedUser = await auth.getStoredUser();
      if (storedUser) {
        // Verify user still exists on server
        try {
          const freshUser = await auth.fetchProfile();
          if (freshUser) {
            setUser(freshUser);
          } else {
            // Account no longer exists (deleted or invalid token)
            console.log('Account no longer valid, clearing auth');
            await auth.clearAuthData();
            setUser(null);
          }
        } catch (profileError) {
          // Server error or account deleted - clear auth to be safe
          console.log('Error verifying account, clearing auth:', profileError);
          await auth.clearAuthData();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await auth.login(email, password);
      setUser(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await auth.register(username, email, password);
      setUser(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await auth.fetchProfile();
      if (freshUser) {
        setUser(freshUser);
      }
      return freshUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    refreshUser,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
