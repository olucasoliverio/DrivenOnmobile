import axios from 'axios';
import { LicensePlatePattern } from './licensePlateRecognition';

type Env = {
  EXPO_PUBLIC_BACKEND_URL?: string;
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

const env = ((globalThis as { process?: { env?: Env } }).process?.env ?? {}) as Env;

const backendBaseUrl = env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '');
const plateLookupPath = env.EXPO_PUBLIC_PLATE_LOOKUP_PATH ?? '/api/placas/consulta';

export async function lookupPlate(request: PlateLookupRequest): Promise<PlateLookupResponse> {
  if (!backendBaseUrl) {
    return {
      plate: request.plate,
      status: 'mock',
      message: 'Backend ainda nao configurado. Defina EXPO_PUBLIC_BACKEND_URL para ativar a consulta.',
      data: {
        receivedPayload: request,
        nextEndpoint: plateLookupPath,
      },
    };
  }

  try {
    const response = await axios.post(`${backendBaseUrl}${plateLookupPath}`, request);

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
      message,
    };
  }
}
