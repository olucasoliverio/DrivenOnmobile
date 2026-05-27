import axios from 'axios';
import api, { API_BASE_URL } from '../api/api';
import { LicensePlatePattern } from './licensePlateRecognition';

type Env = {
  EXPO_PUBLIC_PLATE_LOOKUP_PATH?: string;
};

export type PlateLookupRequest = {
  plate: string;
  pattern: LicensePlatePattern;
  rawOcrText?: string;
};

export type PlateLookupResponse = {
  plate: string;
  status: 'mock' | 'found' | 'not_found' | 'error';
  message: string;
  data?: unknown;
};

const plateLookupPath = process.env.EXPO_PUBLIC_PLATE_LOOKUP_PATH ?? '/api/placas/consulta';
const normalizedPlateLookupPath = plateLookupPath.replace(/^\/api\//, '/');

export async function lookupPlate(request: PlateLookupRequest): Promise<PlateLookupResponse> {
  try {
    const response = await api.post(normalizedPlateLookupPath, request);

    return {
      plate: request.plate,
      status: 'found',
      message: 'Consulta enviada ao backend.',
      data: response.data,
    };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message ?? error.message
      : 'Falha desconhecida ao consultar placa.';

    return {
      plate: request.plate,
      status: 'error',
      message: `${message} (${API_BASE_URL}${normalizedPlateLookupPath})`,
    };
  }
}
