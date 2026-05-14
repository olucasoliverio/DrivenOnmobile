import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

type Env = {
  EXPO_PUBLIC_API_URL?: string;
};

const env = ((globalThis as { process?: { env?: Env } }).process?.env ?? {}) as Env;

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
  return 'http://localhost:4000/api';
}

export const API_BASE_URL = (env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl()).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@driveon:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
