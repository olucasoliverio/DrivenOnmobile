import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  oficinaId?: number;
  perfilAcessoNome?: string | null;
  permissoes?: Record<string, unknown>;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function normalizeUser(usuario: any): User {
  return {
    id: Number(usuario.id),
    nome: String(usuario.nome ?? ''),
    email: String(usuario.email ?? ''),
    perfil: String(usuario.tipo ?? usuario.perfil ?? ''),
    oficinaId: Number(usuario.oficinaId ?? usuario.oficina_id ?? 0) || undefined,
    perfilAcessoNome: usuario.perfilAcessoNome ?? null,
    permissoes: usuario.permissoes ?? {},
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback(async (token: string, usuario: User) => {
    await AsyncStorage.setItem('@driveon:token', token);
    await AsyncStorage.setItem('@driveon:user', JSON.stringify(usuario));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(usuario);
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });

      if (data.requiresOfficeSelection) {
        const firstOffice = data.oficinas?.[0];
        if (!firstOffice) {
          throw new Error('Usuario sem oficina vinculada.');
        }

        const selected = await api.post('/auth/select-oficina', {
          selectionToken: data.selectionToken,
          oficina_id: firstOffice.id,
        });

        await persistSession(selected.data.token, normalizeUser(selected.data.usuario));
      } else {
        await persistSession(data.token, normalizeUser(data.usuario));
      }
    } finally {
      setIsLoading(false);
    }
  }, [persistSession]);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@driveon:token', '@driveon:user']);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('@driveon:user'),
          AsyncStorage.getItem('@driveon:token'),
        ]);

        if (savedToken) {
          api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
