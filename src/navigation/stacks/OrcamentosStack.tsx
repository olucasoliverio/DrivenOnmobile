import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrcamentosScreen from '../../screens/orcamentos/OrcamentosScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function OrcamentosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.navy800 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="OrcamentosList" 
        component={OrcamentosScreen} 
        options={{ title: 'Orçamentos' }} 
      />
    </Stack.Navigator>
  );
}
