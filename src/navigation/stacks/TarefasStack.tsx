import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TarefasScreen from '../../screens/tarefas/TarefasScreen';
import OSDetalhesScreen from '../../screens/tarefas/OSDetalhesScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function TarefasStack() {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.navy800 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        headerStatusBarHeight: insets.top,
      }}
    >
      <Stack.Screen name="TarefasList" component={TarefasScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OSDetalhes" component={OSDetalhesScreen} options={{ title: 'Detalhes da OS' }} />
    </Stack.Navigator>
  );
}
