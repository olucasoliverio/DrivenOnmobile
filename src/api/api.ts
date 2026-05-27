import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

type Env = {
  EXPO_PUBLIC_API_URL?: string;
};

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
  return 'http://localhost:4000/api';
}

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl()).replace(/\/$/, '');
console.log('[API] Base URL configured as:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  console.log('[API] Setting token in memory:', token ? `${token.substring(0, 15)}...` : 'null');
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.request.use((config) => {
  console.log(`[API] Intercepting request to ${config.url}`);
  if (authToken) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${authToken}`);
    } else {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
  } else {
    console.log(`[API] No in-memory token found for request to ${config.url}`);
  }
  return config;
}, (error) => {
  console.error('[API] Request interceptor error:', error);
  return Promise.reject(error);
});

export default api;
