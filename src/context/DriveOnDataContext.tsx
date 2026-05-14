import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createCliente as createClienteRequest,
  fetchDriveOnData,
  fallbackDriveOnData,
  type ClientePayload,
  type DriveOnData,
} from '../services/driveOnData';
import { useAuth } from './AuthContext';

type DriveOnDataContextData = DriveOnData & {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCliente: (payload: ClientePayload) => Promise<void>;
  createRecord: (path: string, payload: Record<string, unknown>) => Promise<void>;
  updateRecord: (path: string, id: number, payload: Record<string, unknown>) => Promise<void>;
  deleteRecord: (path: string, id: number) => Promise<void>;
};

const DriveOnDataContext = createContext<DriveOnDataContextData | null>(null);

export function DriveOnDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DriveOnData>(fallbackDriveOnData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const nextData = await fetchDriveOnData();
      setData(nextData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nao foi possivel carregar os dados do DriveOn.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const createCliente = useCallback(async (payload: ClientePayload) => {
    const cliente = await createClienteRequest(payload);
    setData((current) => ({
      ...current,
      clientes: [cliente, ...current.clientes].sort((a, b) => a.nome.localeCompare(b.nome)),
      dashboard: {
        ...current.dashboard,
        clientesAtivos: current.dashboard.clientesAtivos + 1,
      },
    }));
    void refresh();
  }, [refresh]);

  const createRecord = useCallback(async (path: string, payload: Record<string, unknown>) => {
    const { default: api } = await import('../api/api');
    await api.post(path, payload);
    await refresh();
  }, [refresh]);

  const updateRecord = useCallback(async (path: string, id: number, payload: Record<string, unknown>) => {
    const { default: api } = await import('../api/api');
    await api.put(`${path}/${id}`, payload);
    await refresh();
  }, [refresh]);

  const deleteRecord = useCallback(async (path: string, id: number) => {
    const { default: api } = await import('../api/api');
    await api.delete(`${path}/${id}`);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setData(fallbackDriveOnData);
      setError(null);
    }
  }, [isAuthenticated, refresh]);

  const value = useMemo(
    () => ({
      ...data,
      isLoading,
      error,
      refresh,
      createCliente,
      createRecord,
      updateRecord,
      deleteRecord,
    }),
    [createCliente, createRecord, data, deleteRecord, error, isLoading, refresh, updateRecord],
  );

  return <DriveOnDataContext.Provider value={value}>{children}</DriveOnDataContext.Provider>;
}

export function useDriveOnData() {
  const context = useContext(DriveOnDataContext);
  if (!context) {
    throw new Error('useDriveOnData deve ser usado dentro de DriveOnDataProvider.');
  }
  return context;
}
