import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TarefasScreen from '../../screens/tarefas/TarefasScreen';
import OSDetalhesScreen from '../../screens/tarefas/OSDetalhesScreen';
import { colors } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function TarefasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen name="TarefasList" component={TarefasScreen} options={{ title: 'Ordens de Serviço' }} />
      <Stack.Screen name="OSDetalhes" component={OSDetalhesScreen} options={{ title: 'Detalhes da OS' }} />
    </Stack.Navigator>
  );
}
