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
import ClienteFormScreen from '../screens/clientes/ClienteFormScreen';
import VeiculosScreen from '../screens/veiculos/VeiculosScreen';
import VeiculoDetalhesScreen from '../screens/veiculos/VeiculoDetalhesScreen';
import PlacaScannerScreen from '../screens/veiculos/PlacaScannerScreen';
import OSDetalhesScreen from '../screens/tarefas/OSDetalhesScreen';
import OSFormScreen from '../screens/tarefas/OSFormScreen';
import TarefasScreen from '../screens/tarefas/TarefasScreen';
import AgendaScreen from '../screens/agenda/AgendaScreen';
import AgendaDetalhesScreen from '../screens/agenda/AgendaDetalhesScreen';
import OrcamentosScreen from '../screens/orcamentos/OrcamentosScreen';
import OrcamentoDetalhesScreen from '../screens/orcamentos/OrcamentoDetalhesScreen';
import OrcamentoFormScreen from '../screens/orcamentos/OrcamentoFormScreen';
import PagamentosScreen from '../screens/pagamentos/PagamentosScreen';
import PagamentoDetalhesScreen from '../screens/pagamentos/PagamentoDetalhesScreen';
import VeiculoFormScreen from '../screens/veiculos/VeiculoFormScreen';
import AgendaFormScreen from '../screens/agenda/AgendaFormScreen';
import PagamentoFormScreen from '../screens/pagamentos/PagamentoFormScreen';
import NotificacoesScreen from '../screens/notificacoes/NotificacoesScreen';

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
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="App" component={AppTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Clientes" component={ClientesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClienteDetalhes" component={ClienteDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="Veiculos" component={VeiculosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VeiculoDetalhes" component={VeiculoDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlacaScanner" component={PlacaScannerScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="OSDetalhes" component={OSDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OSForm" component={OSFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="OS" component={TarefasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AgendaDetalhes" component={AgendaDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Orcamentos" component={OrcamentosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrcamentoDetalhes" component={OrcamentoDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrcamentoForm" component={OrcamentoFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="Financeiro" component={PagamentosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PagamentoDetalhes" component={PagamentoDetalhesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VeiculoForm" component={VeiculoFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="AgendaForm" component={AgendaFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="PagamentoForm" component={PagamentoFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="Notificacoes" component={NotificacoesScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
