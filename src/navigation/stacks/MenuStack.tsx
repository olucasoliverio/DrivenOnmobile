import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../../screens/menu/MenuScreen';
import ClientesScreen from '../../screens/clientes/ClientesScreen';
import ClienteDetalhesScreen from '../../screens/clientes/ClienteDetalhesScreen';
import VeiculosScreen from '../../screens/veiculos/VeiculosScreen';
import PlacaScannerScreen from '../../screens/veiculos/PlacaScannerScreen';
import OrcamentosScreen from '../../screens/orcamentos/OrcamentosScreen';
import PagamentosScreen from '../../screens/pagamentos/PagamentosScreen';
import EstoqueScreen from '../../screens/estoque/EstoqueScreen';
import FornecedoresScreen from '../../screens/fornecedores/FornecedoresScreen';
import ServicosScreen from '../../screens/servicos/ServicosScreen';
import RelatoriosScreen from '../../screens/relatorios/RelatoriosScreen';
import ConfiguracoesScreen from '../../screens/configuracoes/ConfiguracoesScreen';
import UsuariosScreen from '../../screens/usuarios/UsuariosScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function MenuStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.navy800 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />

      <Stack.Screen name="Clientes" component={ClientesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClienteDetalhes" component={ClienteDetalhesScreen} options={{ title: 'Detalhes do Cliente' }} />
      <Stack.Screen name="Veiculos" component={VeiculosScreen} options={{ title: 'Veículos' }} />
      <Stack.Screen name="Orcamentos" component={OrcamentosScreen} options={{ title: 'Orçamentos' }} />
      <Stack.Screen name="Pagamentos" component={PagamentosScreen} options={{ title: 'Pagamentos' }} />
      <Stack.Screen name="Estoque" component={EstoqueScreen} options={{ title: 'Estoque' }} />
      <Stack.Screen name="Fornecedores" component={FornecedoresScreen} options={{ title: 'Fornecedores' }} />
      <Stack.Screen name="Servicos" component={ServicosScreen} options={{ title: 'Serviços' }} />
      <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
      <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} options={{ title: 'Configurações' }} />
      <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Usuários' }} />
      <Stack.Screen name="PlacaScanner" component={PlacaScannerScreen} options={{ title: 'Leitura de Placa' }} />
    </Stack.Navigator>
  );
}
