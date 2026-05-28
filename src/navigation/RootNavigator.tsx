import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AppTabs from './AppTabs';
import { ActivityIndicator, View } from 'react-native';
import { colors, palette } from '../theme/theme';

// Import sub-screens to render in Root Stack (hiding tab bar)
import ClientesScreen from '../screens/clientes/ClientesScreen';
import ClienteDetalhesScreen from '../screens/clientes/ClienteDetalhesScreen';
import VeiculosScreen from '../screens/veiculos/VeiculosScreen';
import PlacaScannerScreen from '../screens/veiculos/PlacaScannerScreen';
import OSDetalhesScreen from '../screens/tarefas/OSDetalhesScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  console.log('[RootNavigator] Render state:', { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: palette.navy800 },
          headerTintColor: palette.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="App" component={AppTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Clientes" component={ClientesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClienteDetalhes" component={ClienteDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Veiculos" component={VeiculosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlacaScanner" component={PlacaScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OSDetalhes" component={OSDetalhesScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
