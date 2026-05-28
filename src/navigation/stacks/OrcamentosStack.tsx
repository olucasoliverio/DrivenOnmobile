import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrcamentosScreen from '../../screens/orcamentos/OrcamentosScreen';

const Stack = createNativeStackNavigator();

export default function OrcamentosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrcamentosList" component={OrcamentosScreen} />
    </Stack.Navigator>
  );
}
