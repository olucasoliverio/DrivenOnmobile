import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchDriveOnData, fallbackDriveOnData, type DriveOnData } from '../services/driveOnData';
import { useAuth } from './AuthContext';

type DriveOnDataContextData = DriveOnData & {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
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
    }),
    [data, error, isLoading, refresh],
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
