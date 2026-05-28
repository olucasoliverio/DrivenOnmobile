import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, registerOnUnauthorized } from '../api/api';

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
    console.log('[AuthContext] persistSession starting...');
    try {
      await AsyncStorage.setItem('@driveon:token', token);
      await AsyncStorage.setItem('@driveon:user', JSON.stringify(usuario));
      console.log('[AuthContext] persistSession storage written successfully.');
      setAuthToken(token);
      setUser(usuario);
      console.log('[AuthContext] persistSession completed, user set:', usuario);
    } catch (err) {
      console.error('[AuthContext] persistSession storage write failed:', err);
      throw err;
    }
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    console.log('[AuthContext] signIn called for email:', email);
    setIsLoading(true);
    try {
      console.log('[AuthContext] signIn: posting to /auth/login...');
      const { data } = await api.post('/auth/login', { email, senha });
      console.log('[AuthContext] signIn: response data keys:', Object.keys(data));

      if (data.requiresOfficeSelection) {
        console.log('[AuthContext] signIn: requires office selection.');
        const firstOffice = data.oficinas?.[0];
        if (!firstOffice) {
          throw new Error('Usuario sem oficina vinculada.');
        }

        console.log('[AuthContext] signIn: selecting first office:', firstOffice);
        const selected = await api.post('/auth/select-oficina', {
          selectionToken: data.selectionToken,
          oficina_id: firstOffice.id,
        });

        await persistSession(selected.data.token, normalizeUser(selected.data.usuario));
      } else {
        console.log('[AuthContext] signIn: no office selection required.');
        await persistSession(data.token, normalizeUser(data.usuario));
      }
    } catch (err: any) {
      console.error('[AuthContext] signIn failed:', err?.response?.data ?? err);
      throw err;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signIn execution finished, isLoading set to false.');
    }
  }, [persistSession]);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] signOut starting...');
    try {
      await AsyncStorage.multiRemove(['@driveon:token', '@driveon:user']);
      console.log('[AuthContext] signOut: AsyncStorage cleared.');
      setAuthToken(null);
      setUser(null);
      console.log('[AuthContext] signOut complete.');
    } catch (err) {
      console.error('[AuthContext] signOut error:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      console.log('[AuthContext] useEffect (mount): checking stored session...');
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('@driveon:user'),
          AsyncStorage.getItem('@driveon:token'),
        ]);

        console.log('[AuthContext] useEffect (mount) AsyncStorage read:', {
          hasUser: !!savedUser,
          hasToken: !!savedToken,
          rawUser: savedUser
        });

        if (savedToken) {
          setAuthToken(savedToken);
        }

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          console.log('[AuthContext] useEffect (mount): session restored for user:', parsed);
        } else {
          console.log('[AuthContext] useEffect (mount): no stored user found.');
        }
      } catch (err) {
        console.error('[AuthContext] useEffect (mount) session restoration failed:', err);
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] useEffect (mount) completed, isLoading set to false.');
      }
    })();
  }, []);

  useEffect(() => {
    registerOnUnauthorized(() => {
      console.log('[AuthContext] Automatic signOut triggered due to 401 Unauthorized.');
      void signOut();
    });
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
