/**
 * API Configuration
 * Centralized configuration for backend URL
 */

// PRODUCTION: Update this URL after deploying your backend
// Options:
// - Railway: https://your-app-name.up.railway.app/api
// - Render: https://your-app-name.onrender.com/api
// - Heroku: https://your-app-name.herokuapp.com/api
const PRODUCTION_API_URL = 'https://rolla-backend.up.railway.app/api';

// DEVELOPMENT: Your local IP address for testing on physical devices
// Find it by running: ifconfig (Mac) or ipconfig (Windows)
const DEV_API_URL = 'http://10.36.12.44:3000/api';

// Automatically switch between dev and production
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PRODUCTION_API_URL;

// Export individual URLs for flexibility
export const getApiUrl = () => API_BASE_URL;
export const isProduction = () => !__DEV__;
