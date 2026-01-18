/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

let cachedToken = null;
let cachedUser = null;

/**
 * Get the stored auth token
 */
export const getAuthToken = async () => {
  if (cachedToken) return cachedToken;
  
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    cachedToken = token;
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get the stored user data
 */
export const getStoredUser = async () => {
  if (cachedUser) return cachedUser;
  
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      cachedUser = JSON.parse(userData);
      return cachedUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Store auth token and user data
 */
const storeAuthData = async (token, user) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    cachedToken = token;
    cachedUser = user;
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
};

/**
 * Clear auth data (logout)
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    cachedToken = null;
    cachedUser = null;
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Register a new user
 * @param {string} username
 * @param {string} email
 * @param {string} password
 */
export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    await storeAuthData(data.token, data.user);
    
    // Automatically claim any reports created on this device
    try {
      const { claimDeviceReports } = await import('./api');
      const claimResult = await claimDeviceReports();
      if (claimResult.claimedCount > 0) {
        console.log(`Claimed ${claimResult.claimedCount} reports from this device`);
        // Update cached user with new stats
        cachedUser = claimResult.user;
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(claimResult.user));
        data.user = claimResult.user;
        data.claimedReports = claimResult.claimedCount;
      }
    } catch (claimError) {
      console.log('Could not claim device reports:', claimError);
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} email
 * @param {string} password
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    await storeAuthData(data.token, data.user);
    
    // Automatically claim any reports created on this device
    try {
      const { claimDeviceReports } = await import('./api');
      const claimResult = await claimDeviceReports();
      if (claimResult.claimedCount > 0) {
        console.log(`Claimed ${claimResult.claimedCount} reports from this device`);
        // Update cached user with new stats
        cachedUser = claimResult.user;
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(claimResult.user));
        data.user = claimResult.user;
        data.claimedReports = claimResult.claimedCount;
      }
    } catch (claimError) {
      console.log('Could not claim device reports:', claimError);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = async () => {
  await clearAuthData();
};

/**
 * Get the current user's profile from the server
 */
export const fetchProfile = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        await clearAuthData();
        return null;
      }
      throw new Error('Failed to fetch profile');
    }
    
    const data = await response.json();
    cachedUser = data.user;
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Get the leaderboard
 * @param {number} limit - Number of users to return (default 10)
 */
export const fetchLeaderboard = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/leaderboard?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    const data = await response.json();
    return data.leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async () => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
};
