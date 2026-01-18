/**
 * API Service
 * Handles communication with the backend
 */

import * as FileSystem from 'expo-file-system';

// Configuration - change this to your backend URL
// For physical devices/simulators, use your computer's local IP address
// Find it by running: ipconfig (Windows) or ifconfig/ip addr (Mac/Linux)
// Example: 'http://192.168.1.100:3000/api'
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.2:3000/api'  // Your computer's local IP
  : 'https://your-production-url.com/api';

// Generate a simple device ID for user tracking
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let cachedUserId = null;

const getUserId = async () => {
  if (cachedUserId) return cachedUserId;
  
  try {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('userId', userId);
    }
    cachedUserId = userId;
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'anonymous';
  }
};

/**
 * Fetch nearby accessibility reports
 * @param {number} longitude
 * @param {number} latitude
 * @param {number} radius - Search radius in meters (default 1000)
 */
export const fetchNearbyReports = async (longitude, latitude, radius = 1000) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reports?longitude=${longitude}&latitude=${latitude}&radius=${radius}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    const data = await response.json();
    return data.reports;
  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    throw error;
  }
};

/**
 * Get a single report by ID
 * @param {string} reportId
 */
export const fetchReport = async (reportId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

/**
 * Create a new accessibility report
 * @param {string} type - Type of accessibility feature
 * @param {number} longitude
 * @param {number} latitude
 * @param {string} photoUri - Local URI of the photo
 */
export const createReport = async (type, longitude, latitude, photoUri) => {
  try {
    const userId = await getUserId();
    
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('type', type);
    formData.append('longitude', longitude.toString());
    formData.append('latitude', latitude.toString());
    
    // Add photo
    const filename = photoUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('photo', {
      uri: photoUri,
      name: filename || 'photo.jpg',
      type: fileType,
    });
    
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-id': userId,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create report');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Confirm an existing report
 * @param {string} reportId
 * @param {string} photoUri - Optional photo URI
 */
export const confirmReport = async (reportId, photoUri = null) => {
  try {
    const userId = await getUserId();
    
    const formData = new FormData();
    
    if (photoUri) {
      const filename = photoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('photo', {
        uri: photoUri,
        name: filename || 'photo.jpg',
        type: fileType,
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/confirm`, {
      method: 'POST',
      headers: {
        ...(photoUri ? { 'Content-Type': 'multipart/form-data' } : {}),
        'x-user-id': userId,
      },
      body: photoUri ? formData : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm report');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error confirming report:', error);
    throw error;
  }
};

/**
 * Report that an accessibility feature has been removed
 * @param {string} reportId
 */
export const reportRemoval = async (reportId) => {
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to report removal');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reporting removal:', error);
    throw error;
  }
};

/**
 * Report a photo as inappropriate
 * @param {string} reportId
 * @param {number} photoIndex
 * @param {string} reason
 */
export const reportBadPhoto = async (reportId, photoIndex, reason) => {
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/report-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ photoIndex, reason }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to report photo');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reporting photo:', error);
    throw error;
  }
};
