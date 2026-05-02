import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const MOCK_USER: User = {
  id: 1,
  nome: 'Admin DriveOn',
  email: 'admin@driveon.com',
  perfil: 'admin',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      // Mock: aceita qualquer email com senha "123456"
      await new Promise((res) => setTimeout(res, 1000));
      if (senha === '123456' || (email === 'admin@driveon.com' && senha === 'admin')) {
        await AsyncStorage.setItem('@driveon:token', 'mock-jwt-token');
        await AsyncStorage.setItem('@driveon:user', JSON.stringify(MOCK_USER));
        setUser(MOCK_USER);
      } else {
        throw new Error('Credenciais inválidas');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@driveon:token', '@driveon:user']);
    setUser(null);
  }, []);

  // Carregar usuário salvo ao iniciar
  React.useEffect(() => {
    (async () => {
      const savedUser = await AsyncStorage.getItem('@driveon:user');
      if (savedUser) setUser(JSON.parse(savedUser));
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
